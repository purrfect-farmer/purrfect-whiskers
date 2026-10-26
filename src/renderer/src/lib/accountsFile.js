/** An account copy without its tags */
export function withoutTags(account) {
  const { tags, ...rest } = account;

  return rest;
}

/**
 * A parser for the items of an accounts file, each partition kept once,
 * returning null when invalid
 */
export function parseAccountsFile(data) {
  const items = data?.accounts;

  if (!Array.isArray(items) || items.length === 0) return null;

  /** Whether every item has an account partition */
  const valid = items.every(
    (item) => typeof item?.account?.partition === "string",
  );

  if (!valid) return null;

  /** The partitions already kept */
  const seen = new Set();

  return items.filter(({ account }) => {
    if (seen.has(account.partition)) return false;

    seen.add(account.partition);

    return true;
  });
}
