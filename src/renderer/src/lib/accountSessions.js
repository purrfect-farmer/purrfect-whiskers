import { FARMER_STORAGE_KEY } from "./constants";

/** The Telegram session of each account, by partition */
const sessions = new Map();

/** The callbacks told when the cache changes */
const listeners = new Set();

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

/** The cached Telegram session of an account */
export function getCachedSession(partition) {
  return sessions.get(partition);
}

/** Caches the Telegram sessions found in `{ account, backup }` results */
export function cacheSessions(results) {
  for (const { account, backup } of results) {
    const session =
      backup?.data?.chromeLocalStorage?.[
        FARMER_STORAGE_KEY.LOCAL_TELEGRAM_SESSION
      ];

    if (session) sessions.set(account.partition, session);
  }

  notify();
}

/** Forgets every cached session, so the next run reads them again */
export function clearCachedSessions() {
  sessions.clear();
  notify();
}
