import * as yup from "yup";

import { kebabCase } from "change-case";

/** The longest tag name accepted */
const MAX_TAG_NAME_LENGTH = 100;

/** The message of a name with no letter or number to make an id from */
const NO_ID_MESSAGE = "A tag name needs at least one letter or number";

/** The id of a tag: its name, trimmed and kebab-cased */
export const toTagId = (name) => kebabCase(name.trim());

/** The rule of a tag name */
export const tagNameSchema = () =>
  yup
    .string()
    .trim()
    .required()
    .max(MAX_TAG_NAME_LENGTH)
    .label("Tag Name")
    .test("tag-id", NO_ID_MESSAGE, (value) => !value || toTagId(value) !== "");

/** The error of an untrusted tag name, or null when it can be used */
export function checkTagName(name) {
  try {
    tagNameSchema().validateSync(name);

    return null;
  } catch (error) {
    return error.errors?.[0] ?? NO_ID_MESSAGE;
  }
}
