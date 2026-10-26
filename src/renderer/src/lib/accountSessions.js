import { FARMER_STORAGE_KEY } from "./constants";

/** The Telegram session of each account, by partition */
const sessions = new Map();

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
}
