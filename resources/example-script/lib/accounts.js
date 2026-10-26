/** The Telegram user in an account's init data, or null */
export function getTelegramUser(account) {
  try {
    const user = new URLSearchParams(account.telegramInitData ?? "").get(
      "user",
    );

    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
}

/** The proxy of an account as "host:port", or null */
export function getProxy(account) {
  return account.proxyEnabled && account.proxyHost
    ? `${account.proxyHost}:${account.proxyPort}`
    : null;
}

/** The number of stored items in a backup's data */
export function countStoredItems(backup) {
  return Object.values(backup?.data ?? {}).reduce(
    (total, store) =>
      total +
      (store && typeof store === "object" ? Object.keys(store).length : 0),
    0,
  );
}
