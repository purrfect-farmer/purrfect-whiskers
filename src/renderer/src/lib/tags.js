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

/** Pseudo tag matching accounts without any tag */
export const UNTAGGED_TAG = Object.freeze({
  id: "__untagged__",
  name: "Untagged",
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
