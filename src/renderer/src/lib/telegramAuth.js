import { Api, TelegramClient } from "telegram";
import { MemorySession, StringSession } from "telegram/sessions";

import { NewMessage } from "telegram/events";
import { SPIDER_LOGIN_METHOD } from "./constants";
import {
  TELEGRAM_API_HASH,
  TELEGRAM_API_ID,
  TELEGRAM_CLIENT_OPTIONS,
} from "../../../shared/lib/telegramClient";

/** Telegram Web-K API credentials */
const TELEGRAM_API_CREDENTIALS = {
  apiId: TELEGRAM_API_ID,
  apiHash: TELEGRAM_API_HASH,
};

/** Sender of Telegram's login code messages */
const TELEGRAM_SERVICE_USER_ID = 777000;
/** Matches a login code */
const LOGIN_CODE_REGEX = /(\d{5})/;
/** How often the login code is checked */
const LOGIN_CODE_POLL_INTERVAL = 5000;
/** The most checks for a login code */
const LOGIN_CODE_MAX_POLLS = 10;

/** Creates a Telegram Web-K client */
function createTelegramClient(session) {
  return new TelegramClient(session, TELEGRAM_API_ID, TELEGRAM_API_HASH, {
    ...TELEGRAM_CLIENT_OPTIONS,
    deviceModel: navigator.userAgent,
    systemVersion: navigator.platform,
  });
}

/** Destroys a client, logging instead of throwing */
export async function destroyClient(client) {
  try {
    await client.destroy();
  } catch (error) {
    console.error("Error destroying Telegram client:", error);
  }
}

/**
 * Runs the client's login flow and stops it at the first error,
 * rethrowing that error.
 */
async function startClient(client, params) {
  /** The first login error */
  let authError = null;

  try {
    await client.start({
      ...params,
      onError: async (error) => {
        authError = error;
        return true;
      },
    });
  } catch (error) {
    throw authError ?? error;
  }
}

/** Polls `readCode` until it returns a code, or rejects on timeout */
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
        reject(new Error("Auth code timeout"));
      }

      polls += 1;
    };

    /** The check timer */
    const interval = setInterval(check, LOGIN_CODE_POLL_INTERVAL);
    check();
  });
}

/**
 * Logs in with the code Spider receives for the account.
 * Resolves with the authorized client, which the caller destroys.
 * @param {{account: object, twoFA: string, getCode: (hashCode: string) => Promise<object>}} params
 */
export async function loginWithSpider({ account, twoFA, getCode }) {
  const client = createTelegramClient(new MemorySession());

  /** The code and password Spider returned */
  let authResult = null;
  /** Whether the login asked for the 2FA password */
  let used2FA = false;

  try {
    await startClient(client, {
      phoneNumber: async () => account["phone"],
      phoneCode: async () => {
        authResult = await getCode(account["hash_code"]);
        return authResult["code"];
      },
      password: async () => {
        used2FA = true;
        return authResult["password"];
      },
    });

    /** The auth key of the session as hex */
    const authKey = client.session.authKey.getKey().toString("hex");
    const dcId = client.session.dcId;
    const user = await client.getMe();

    console.log("Logged in as", user.username || user.firstName);

    if (twoFA || used2FA) {
      await client.updateTwoFaSettings({
        currentPassword: used2FA ? authResult["password"] : undefined,
        newPassword: twoFA || undefined,
        email: "",
        hint: "",
      });
    }

    return { account, authResult, used2FA, user, client, authKey, dcId };
  } catch (error) {
    await destroyClient(client);
    throw error;
  }
}

/**
 * Logs in a new local client with the login code Telegram sends to the
 * already-authorized client.
 */
async function getLocalSessionViaLoginCode({ telegram, account, twoFA }) {
  const client = createTelegramClient(new StringSession());
  /** The filter for login code messages */
  const codeFilter = new NewMessage({ fromUsers: [TELEGRAM_SERVICE_USER_ID] });

  /** The received login code */
  let loginCode = null;
  /** Whether the login asked for the 2FA password */
  let used2FA = false;

  /**
   * Stores the login code of a message
   * @param {import("telegram/events").NewMessageEvent} event
   */
  const handleMessage = (event) => {
    const match = (event.message?.message || "").match(LOGIN_CODE_REGEX);

    if (match) loginCode = match[1];
  };

  telegram.client.addEventHandler(handleMessage, codeFilter);

  try {
    await startClient(client, {
      phoneNumber: async () => account["phone"],
      phoneCode: () => waitForLoginCode(() => loginCode),
      password: async () => {
        used2FA = true;
        return twoFA;
      },
    });

    return { account, used2FA, session: client.session.save() };
  } finally {
    telegram.client.removeEventHandler(handleMessage, codeFilter);
    await destroyClient(client);
  }
}

/** Export Login Token */
function exportLoginToken(client) {
  return client.invoke(
    new Api.auth.ExportLoginToken({
      ...TELEGRAM_API_CREDENTIALS,
      exceptIds: [],
    }),
  );
}

/**
 * Logs in a new local client with a login token
 * the already-authorized client accepts
 */
async function getLocalSessionViaLoginToken({ telegram, account, twoFA }) {
  const client = createTelegramClient(new StringSession());
  /** Whether the login asked for the 2FA password */
  let used2FA = false;

  try {
    try {
      /* Connect Without Authenticating */
      await client.connect();

      /** The exported login token */
      const exported = await exportLoginToken(client);

      if (!(exported instanceof Api.auth.LoginToken)) {
        throw new Error(
          "Unexpected result while exporting login token: " +
            exported.className,
        );
      }

      /* Accept the Token on the Already-Authorized Client */
      await telegram.client.invoke(
        new Api.auth.AcceptLoginToken({ token: exported.token }),
      );

      /* Re-Export to Collect the Authorization */
      let result = await exportLoginToken(client);

      /* Follow the Token to Its Home DC */
      if (result instanceof Api.auth.LoginTokenMigrateTo) {
        await client._switchDC(result.dcId);
        result = await client.invoke(
          new Api.auth.ImportLoginToken({ token: result.token }),
        );
      }

      if (!(result instanceof Api.auth.LoginTokenSuccess)) {
        throw new Error(
          "Unexpected result while importing login token: " + result.className,
        );
      }
    } catch (error) {
      if (error.errorMessage !== "SESSION_PASSWORD_NEEDED") throw error;

      used2FA = true;

      /** The new 2FA password, or the one Spider supplied */
      const password = twoFA || telegram.authResult?.["password"];

      await client.signInWithPassword(TELEGRAM_API_CREDENTIALS, {
        password: async () => password,
        onError: (err) => {
          throw err;
        },
      });
    }

    return { account, used2FA, session: client.session.save() };
  } finally {
    await destroyClient(client);
  }
}

/**
 * Get Local Telegram Session
 *
 * `method` picks the login strategy:
 * - TOKEN - exported login token only
 * - CODE  - login code only
 * - AUTO  - token first, falling back to the login code (default)
 */
export async function getLocalTelegramSession({
  telegram,
  account,
  twoFA,
  method = SPIDER_LOGIN_METHOD.AUTO,
}) {
  const params = { telegram, account, twoFA };

  if (method === SPIDER_LOGIN_METHOD.CODE) {
    return getLocalSessionViaLoginCode(params);
  }

  try {
    return await getLocalSessionViaLoginToken(params);
  } catch (error) {
    if (method === SPIDER_LOGIN_METHOD.TOKEN) throw error;

    console.warn("Login token failed, falling back to the login code:", error);

    return getLocalSessionViaLoginCode(params);
  }
}

/** Telegram Web-K local storage that signs the account in */
export function buildTelegramWebLocalStorage({ dcId, authKey, user }) {
  /** The Web-K account entry */
  const account = {
    ["dcId"]: dcId,
    [`dc${dcId}_auth_key`]: authKey,
    ["dc2_auth_key"]: authKey /* Patch for Web-K */,
    ["userId"]: user.id.toString(),
    ["auth_key_fingerprint"]: authKey.slice(0, 8),
  };

  return { ["account1"]: JSON.stringify(account) };
}
