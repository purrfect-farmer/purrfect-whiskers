import {
  TELEGRAM_API_HASH,
  TELEGRAM_API_ID,
  TELEGRAM_CLIENT_OPTIONS,
} from "../../../../shared/lib/telegramClient";

import { TelegramClient } from "telegram";

/** Creates a Telegram Web-K client for a session, reporting this device */
export function createTelegramClient(session) {
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
