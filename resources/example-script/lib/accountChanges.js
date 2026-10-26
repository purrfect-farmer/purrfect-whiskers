/** The name of the tag added to checked accounts */
export const CHECKED_TAG_NAME = "Example checked";

/** Adds a tag to an account, reading the account fresh first */
export async function addTag(api, partition, tagId) {
  /** The account as it is now */
  const account = await api.getAccount(partition);

  if (account.tags.includes(tagId)) return false;

  await api.updateAccount(partition, { tags: [...account.tags, tagId] });

  return true;
}

/**
 * Creates a copy of an account from its backup with api.addAccount, and
 * returns the new account
 */
export async function copyAccount(api, account) {
  /** The account's full backup */
  const backup = await api.getBackup(account.partition);

  return api.addAccount(
    { title: `${account.title} (copy)`, tags: account.tags ?? [] },
    backup,
  );
}
