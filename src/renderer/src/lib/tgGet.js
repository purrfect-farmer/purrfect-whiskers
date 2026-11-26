import {
  BOT_CANCEL_TIMEOUT,
  BOT_REPLY,
  BOT_REPLY_TIMEOUT,
  LOGIN_CODE_MAX_POLLS,
  LOGIN_CODE_POLL_INTERVAL,
  TG_GET_STEP,
} from "./constants";

import { TELEGRAM_SERVICE_USER_ID } from "../../../shared/lib/telegramClient";
import TelegramWebClient from "./telegram/TelegramWebClient";
import { nameAccounts } from "./cleaner";
import resetTelegramAccount from "./telegram/resetTelegramAccount";

/** Matches Telegram's 5-digit login code */
const LOGIN_CODE_REGEX = /(\d{5})/;

/** The candidate 2FA passwords of a space- or comma-separated pool */
export function parsePasswords(text) {
  return (text || "")
    .split(/[\s,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

/** Classifies a bot reply and reads the verify delay from it */
export function parseBotReply(text) {
  /** The reply, lower-cased for matching */
  const normalized = (text || "").toLowerCase();

  /* The account was received, with the seconds until it verifies */
  if (normalized.includes("account received")) {
    const match = normalized.match(/after\s+(\d+)\s+seconds/);

    return {
      reply: BOT_REPLY.ACCOUNT_RECEIVED,
      seconds: match ? Number(match[1]) : null,
    };
  }

  /* The bot sent the code and is asking for it */
  if (normalized.includes("code sent")) {
    return { reply: BOT_REPLY.CODE_REQUESTED, seconds: null };
  }

  /* The bot cancelled the current request */
  if (/cancell?ed/.test(normalized)) {
    return { reply: BOT_REPLY.CANCELLED, seconds: null };
  }

  return { reply: BOT_REPLY.UNKNOWN, seconds: null };
}

/** Polls `readCode` until it returns a code, or rejects after the last check */
function waitForLoginCode(readCode) {
  return new Promise((resolve, reject) => {
    /** The number of checks so far */
    let polls = 0;

    /** Resolves with the code, or rejects after the last check */
    const check = () => {
      const code = readCode();

      if (code) {
        clearInterval(interval);
        resolve(code);
      } else if (polls >= LOGIN_CODE_MAX_POLLS) {
        clearInterval(interval);
        reject(new Error("Timed out waiting for the login code"));
      }

      polls += 1;
    };

    /** The check timer */
    const interval = setInterval(check, LOGIN_CODE_POLL_INTERVAL);
    check();
  });
}

/**
 * Sends a message to the bot and waits for the `expected` reply, ignoring any
 * intermediate messages, since the bot's reply is not instant. Returns the
 * parsed reply, or rejects on timeout.
 */
async function sendAndExpect(main, bot, text, expected) {
  /** The expected reply, awaited before the message leaves */
  const reply = main.waitForReply(bot, {
    filter: (message) => parseBotReply(message.message).reply === expected,
    timeout: BOT_REPLY_TIMEOUT,
  });

  await main.sendMessage(bot, text);

  return parseBotReply((await reply).message);
}

/** Cancels any pending bot prompt, draining its reply so it is not misread */
async function cancelBot(main, bot) {
  /** The reply to the cancel, drained with a short wait */
  const drain = main
    .waitForReply(bot, { timeout: BOT_CANCEL_TIMEOUT })
    .catch(() => {});

  await main.sendMessage(bot, "/cancel").catch(() => {});
  await drain;
}

/** Terminates every device except the bot's newest sign-in and this session */
async function handOverDevices(client) {
  /** The devices other than this session */
  const others = (await client.getAuthorizations()).filter(
    (auth) => !auth.current,
  );

  if (others.length === 0) return;

  /** The bot's newest sign-in */
  const newest = others.reduce((latest, auth) =>
    auth.dateCreated > latest.dateCreated ? auth : latest,
  );

  /* Terminate every other device, past a failure */
  for (const auth of others) {
    if (auth === newest) continue;

    try {
      await client.terminateAuthorization(auth.hash);
    } catch (error) {
      console.error("Failed to terminate a device:", error);
    }
  }
}

/**
 * Transfers one account to the bot: removes its 2FA, cleans it, relays the
 * login code through `main`, then hands its devices over. Never rejects.
 * @param {{main: TelegramWebClient, account: object, session: string, passwords: string[], bot: object, onStep: (step: string) => void}} params
 */
export async function transferAccount({
  main,
  account,
  session,
  passwords,
  bot,
  onStep,
}) {
  /** The live client of the account being transferred */
  const client = new TelegramWebClient(session);
  /** Removes the login-code listener */
  let stopCodeWatch = null;

  try {
    /* Connect and read the account's phone number */
    onStep?.(TG_GET_STEP.CONNECT);
    await client.connect();

    const me = await client.getMe();
    const phone = me.phone ? `+${me.phone.replace(/^\+/, "")}` : null;

    if (!phone) throw new Error("The account has no phone number");

    /* Remove the 2FA and clean the account */
    await resetTelegramAccount(client, { passwords }, ({ step }) =>
      onStep?.(step),
    );

    /* Watch for Telegram's login code on the account */
    let loginCode = null;
    stopCodeWatch = client.onMessage([TELEGRAM_SERVICE_USER_ID], (event) => {
      const match = (event.message?.message || "").match(LOGIN_CODE_REGEX);

      if (match) loginCode = match[1];
    });

    /* Clear any pending prompt the bot still holds */
    await cancelBot(main, bot);

    /* Send the phone number and wait for the code request */
    onStep?.(TG_GET_STEP.SEND_PHONE);
    await sendAndExpect(main, bot, phone, BOT_REPLY.CODE_REQUESTED);

    /* Wait for the login code, then relay it */
    onStep?.(TG_GET_STEP.AWAIT_CODE);
    const code = await waitForLoginCode(() => loginCode);

    onStep?.(TG_GET_STEP.SEND_CODE);
    const received = await sendAndExpect(
      main,
      bot,
      code,
      BOT_REPLY.ACCOUNT_RECEIVED,
    );

    /* Stop watching once the account is handed over */
    stopCodeWatch();
    stopCodeWatch = null;

    /* Keep only the bot's device, then drop the web session last */
    onStep?.(TG_GET_STEP.TERMINATE_DEVICES);
    await handOverDevices(client);

    onStep?.(TG_GET_STEP.LOGOUT);
    await client.logout();

    return { account, success: true, seconds: received.seconds };
  } catch (error) {
    console.error(`TG Get failed for "${account.title}":`, error);

    return { account, success: false, error: error.message };
  } finally {
    stopCodeWatch?.();
    await client.destroy();
  }
}

/** One line summarizing a run of transfers */
export function summarizeTransfer(outcomes) {
  /** The accounts transferred, and the accounts that failed */
  const transferred = outcomes.filter((item) => item.success);
  const failed = outcomes.filter((item) => !item.success);

  return [
    `Transferred ${transferred.length} account(s).`,
    failed.length
      ? `Failed ${nameAccounts(failed.map((item) => item.account))}.`
      : null,
  ]
    .filter(Boolean)
    .join(" ");
}
