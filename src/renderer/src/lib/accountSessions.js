import {
  FARMER_STORAGE_KEY,
  MAX_CONCURRENT_WEBVIEWS,
  SESSION_SOURCE,
} from "./constants";

import { createConcurrencyLimit } from "./concurrencyLimit";
import { getOrRestoreAccountBackup } from "./accountBackup";
import { sessionFromTelegramWeb } from "./telegramWebSession";

/** The Telegram session of each account and where it came from, by partition */
const sessions = new Map();

/** The callbacks told when the cache changes */
const listeners = new Set();

/** The limit on hidden webviews reading account backups at once */
const limitBackupReads = createConcurrencyLimit(MAX_CONCURRENT_WEBVIEWS);

/** Tells every listener that the cache changed */
function notify() {
  for (const listener of listeners) listener();
}

/** Subscribes to cache changes, returning the unsubscribe */
export function subscribeToSessions(listener) {
  listeners.add(listener);

  return () => listeners.delete(listener);
}

/** The number of cached sessions */
export function getCachedSessionCount() {
  return sessions.size;
}

/** Reads an account's backup, a few accounts at a time */
export function readAccountBackup(account) {
  return limitBackupReads(() => getOrRestoreAccountBackup(account));
}

/** The session in a backup: the farmer's own, else Telegram Web's, or null */
async function findSession(backup) {
  /** The farmer's local session */
  const local =
    backup?.data?.chromeLocalStorage?.[
      FARMER_STORAGE_KEY.LOCAL_TELEGRAM_SESSION
    ];

  if (local) return { session: local, source: SESSION_SOURCE.LOCAL };

  /** The session built from Telegram Web */
  const web = await sessionFromTelegramWeb(
    backup?.data?.telegramWebLocalStorage,
  );

  return web ? { session: web, source: SESSION_SOURCE.WEB } : null;
}

/** The Telegram session of an account and its source, read once then cached */
export async function getAccountSession(account) {
  if (sessions.has(account.partition)) return sessions.get(account.partition);

  const found = await findSession(await readAccountBackup(account));

  if (found) {
    sessions.set(account.partition, found);
    notify();
  }

  return found;
}

/** Forgets every cached session, so the next request reads them again */
export function clearCachedSessions() {
  sessions.clear();
  notify();
}
