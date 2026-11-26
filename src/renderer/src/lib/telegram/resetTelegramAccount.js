import {
  TELEGRAM_SERVICE_USER_ID,
  TELEGRAM_SPAM_BOT_ID,
} from "../../../../shared/lib/telegramClient";

import { TG_GET_STEP } from "../constants";

/** The accounts a reset keeps, as string ids */
const KEPT_IDS = new Set([
  String(TELEGRAM_SERVICE_USER_ID),
  String(TELEGRAM_SPAM_BOT_ID),
]);

/** Whether a dialog is removed by a reset: not self, not a kept account */
const isRemovable = (dialog) =>
  !dialog.entity?.self && !KEPT_IDS.has(dialog.entity?.id?.toString());

/** Whether an error means the tried password was wrong */
const isWrongPassword = (error) =>
  error?.errorMessage === "PASSWORD_HASH_INVALID";

/** Removes the 2FA, trying each candidate password until one is accepted */
async function removeTwoFa(client, passwords) {
  /** The account's 2FA state */
  const state = await client.getPasswordState();

  if (!state.hasPassword) return;

  /** The last wrong-password error, for the final message */
  let lastError = null;

  for (const password of passwords) {
    try {
      await client.removeTwoFa(password);
      return;
    } catch (error) {
      if (!isWrongPassword(error)) throw error;
      lastError = error;
    }
  }

  throw new Error(
    passwords.length
      ? "None of the 2FA passwords were accepted"
      : "The account has 2FA but no password was given",
    { cause: lastError },
  );
}

/**
 * Resets an account: removes its 2FA, then every dialog except itself,
 * Telegram and @SpamBot. A single dialog failure is counted, not fatal.
 * @param {import("./TelegramWebClient").default} client
 * @param {{passwords: string[]}} options
 * @param {(progress: {step: string, done: number, total: number}) => void} onProgress
 */
export default async function resetTelegramAccount(
  client,
  { passwords = [] } = {},
  onProgress = () => {},
) {
  /* Remove the 2FA */
  onProgress({ step: TG_GET_STEP.REMOVE_2FA, done: 0, total: 1 });
  await removeTwoFa(client, passwords);

  /* Collect the removable dialogs */
  const dialogs = (await client.getDialogs()).filter(isRemovable);

  /** The dialogs removed and the dialogs that failed */
  let removed = 0;
  let failed = 0;

  /* Remove each dialog, moving on past a failure */
  for (const [index, dialog] of dialogs.entries()) {
    onProgress({ step: TG_GET_STEP.CLEAN, done: index, total: dialogs.length });

    try {
      await client.removeDialog(dialog, { block: true });
      removed += 1;
    } catch (error) {
      console.error("Failed to remove dialog:", dialog.title, error);
      failed += 1;
    }
  }

  onProgress({
    step: TG_GET_STEP.CLEAN,
    done: dialogs.length,
    total: dialogs.length,
  });

  return { removed, failed };
}
