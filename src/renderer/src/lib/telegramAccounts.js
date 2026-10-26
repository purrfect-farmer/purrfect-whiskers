import { getTelegramUser } from "./utils";

/** The accounts by Telegram id, built once per accounts list */
const telegramIdMaps = new WeakMap();

/** The account of each Telegram id, keeping the first partition of a user found in several */
function getTelegramIdMap(accounts) {
  if (!telegramIdMaps.has(accounts)) {
    const map = new Map();

    for (const account of accounts) {
      const user = getTelegramUser(account);
      const key = user?.["id"] != null ? String(user["id"]) : "";

      if (key && !map.has(key)) map.set(key, account);
    }

    telegramIdMaps.set(accounts, map);
  }

  return telegramIdMaps.get(accounts);
}

/** The accounts of the given Telegram ids, once each, skipping ids no account has */
export function findAccountsByTelegramIds(accounts, telegramIds) {
  const map = getTelegramIdMap(accounts);
  const matched = new Set();

  for (const id of telegramIds) {
    const account = map.get(String(id));

    if (account) matched.add(account);
  }

  return [...matched];
}
