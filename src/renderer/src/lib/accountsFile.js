/** An account copy without its tags */
export function withoutTags(account) {
  const { tags, ...rest } = account;

  return rest;
}

/** A parser for the items of an accounts file, returning null when invalid */
export function parseAccountsFile(data) {
  const items = data?.accounts;

  if (!Array.isArray(items) || items.length === 0) return null;

  /** Whether every item has an account partition */
  const valid = items.every(
    (item) => typeof item?.account?.partition === "string",
  );

  return valid ? items : null;
}
