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
