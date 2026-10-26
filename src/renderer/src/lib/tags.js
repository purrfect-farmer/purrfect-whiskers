import { toTagId } from "../../../shared/lib/tagNames";

/** Builds a tag from its name; the id is the kebab-cased name */
export function createTag(name) {
  const trimmedName = name.trim();

  return { id: toTagId(trimmedName), name: trimmedName };
}

/** Whether another tag than `exceptId` already uses `id` */
export function isTagIdTaken(tags, id, exceptId = null) {
  return tags.some((item) => item.id === id && item.id !== exceptId);
}

/** The pseudo tag matching accounts without any tag */
export const UNTAGGED_TAG = Object.freeze({
  id: "__untagged__",
  name: "Untagged",
  excludedName: "Tagged",
});

/** A check of whether an account matches a tag filter */
export function accountMatchesTag(account, tagId) {
  if (tagId === UNTAGGED_TAG.id) {
    return !account.tags?.length;
  }

  return Boolean(account.tags?.includes(tagId));
}

/** A tag list with ids added and removed, or `tags` itself when unchanged */
export function applyTagChanges(tags, add, remove) {
  const current = tags || [];
  /** The ids to remove */
  const removed = new Set(remove);
  /** The tag ids after the changes */
  const next = current.filter((tagId) => !removed.has(tagId));
  /** The ids in the new list */
  const present = new Set(next);

  for (const tagId of add) {
    if (!present.has(tagId)) {
      present.add(tagId);
      next.push(tagId);
    }
  }

  /** Whether the list changed */
  const changed =
    next.length !== current.length ||
    next.some((tagId, index) => tagId !== current[index]);

  return changed ? next : tags;
}

/** A count of accounts per tag id, including untagged ones */
export function countTagUsage(accounts) {
  /** The account count of each tag id */
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

/** The accounts carrying each of the tag ids in `ids` */
export function findAccountsWithTags(accounts, ids) {
  /** The accounts of each tag id */
  const found = new Map([...ids].map((id) => [id, []]));

  for (const account of accounts) {
    for (const tagId of account.tags || []) {
      found.get(tagId)?.push(account);
    }
  }

  return found;
}

/** A finder for unused tags and unknown tag ids */
export function findTagIssues(tags, usage) {
  /** The ids of the known tags */
  const known = new Set(tags.map((tag) => tag.id));

  /** The tags no account uses */
  const unused = tags.filter((tag) => !usage.get(tag.id));

  /** The tag ids without a tag, with their counts */
  const unknown = [];

  for (const [id, count] of usage) {
    if (id !== UNTAGGED_TAG.id && !known.has(id)) {
      unknown.push({ id, count });
    }
  }

  unknown.sort((a, b) => a.id.localeCompare(b.id));

  return { unused, unknown };
}

/** The summary of removing the checked tags, in past tense once `done` */
export function summarizeTagRemoval({
  unused,
  unknown,
  unknownAccounts,
  skipped,
  done = false,
}) {
  /** The checked unused tags */
  const removedUnused = unused.filter((tag) => !skipped.has(tag.id));
  /** The checked unknown tags */
  const removedUnknown = unknown.filter((tag) => !skipped.has(tag.id));

  /** The accounts losing an unknown tag */
  const affected = new Set(
    removedUnknown.flatMap((tag) =>
      unknownAccounts.get(tag.id).map((account) => account.partition),
    ),
  );

  /** The parts of the summary */
  const parts = [];

  if (removedUnused.length > 0) {
    parts.push(
      `${done ? "removed" : "removes"} ${removedUnused.length} unused ` +
        "tag(s) from your tag list",
    );
  }

  if (removedUnknown.length > 0) {
    parts.push(
      `${done ? "stripped" : "strips"} ${removedUnknown.length} unknown ` +
        "tag(s) from " +
        `${affected.size} account(s)`,
    );
  }

  if (parts.length === 0) return "Nothing selected";

  /** The sentence of the parts */
  const sentence = parts.join(" and ");

  return sentence[0].toUpperCase() + sentence.slice(1);
}
