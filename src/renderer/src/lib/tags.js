import { kebabCase } from "change-case";

/** Builds a tag from its name; the id is the kebab-cased name */
export function createTag(name) {
  const trimmedName = name.trim();

  return { id: kebabCase(trimmedName), name: trimmedName };
}

/** Whether another tag than `exceptId` already uses `id` */
export function isTagIdTaken(tags, id, exceptId = null) {
  return tags.some((item) => item.id === id && item.id !== exceptId);
}

/** Pseudo tag matching accounts without any tag; excluded, it reads "Tagged" */
export const UNTAGGED_TAG = Object.freeze({
  id: "__untagged__",
  name: "Untagged",
  excludedName: "Tagged",
});

/** Whether the account carries the tag, or has no tags for `UNTAGGED_TAG` */
export function accountMatchesTag(account, tagId) {
  if (tagId === UNTAGGED_TAG.id) {
    return !account.tags?.length;
  }

  return Boolean(account.tags?.includes(tagId));
}

/**
 * Adds `add` and drops `remove` from `tags`, keeping order and uniqueness.
 * Returns `tags` itself when nothing changes.
 */
export function applyTagChanges(tags, add, remove) {
  const current = tags || [];
  const removed = new Set(remove);
  const next = current.filter((tagId) => !removed.has(tagId));
  const present = new Set(next);

  for (const tagId of add) {
    if (!present.has(tagId)) {
      present.add(tagId);
      next.push(tagId);
    }
  }

  const changed =
    next.length !== current.length ||
    next.some((tagId, index) => tagId !== current[index]);

  return changed ? next : tags;
}

/** Counts the accounts carrying each tag id, and those without any tag */
export function countTagUsage(accounts) {
  const counts = new Map([[UNTAGGED_TAG.id, 0]]);

  for (const account of accounts) {
    if (!account.tags?.length) {
      counts.set(UNTAGGED_TAG.id, counts.get(UNTAGGED_TAG.id) + 1);
    }

    for (const tagId of account.tags || []) {
      counts.set(tagId, (counts.get(tagId) || 0) + 1);
    }
  }

  return counts;
}

/**
 * Tags no account carries (`unused`), and ids accounts carry that are not
 * in `tags` (`unknown`, with how many accounts carry each)
 */
export function findTagIssues(tags, usage) {
  const known = new Set(tags.map((tag) => tag.id));

  const unused = tags.filter((tag) => !usage.get(tag.id));

  const unknown = [];

  for (const [id, count] of usage) {
    if (id !== UNTAGGED_TAG.id && !known.has(id)) {
      unknown.push({ id, count });
    }
  }

  unknown.sort((a, b) => a.id.localeCompare(b.id));

  return { unused, unknown };
}
