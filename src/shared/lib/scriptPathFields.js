import * as yup from "yup";

import { FIELD_TYPE } from "./scriptFieldTypes";

/** The pattern of an allowed file extension, without the dot */
const EXTENSION_PATTERN = /^[a-z0-9]{1,16}$/;

/** The most extensions a field can allow */
const MAX_EXTENSIONS = 20;

/** The most files a multiple file field takes */
const MAX_FILES = 500;

/** The longest path accepted */
const MAX_PATH_LENGTH = 4096;

/** The longest suggested file name kept */
const MAX_NAME_LENGTH = 255;

/** The unique, lowercase extensions of an untrusted list, without dots */
export function toExtensions(raw) {
  if (!Array.isArray(raw)) return [];

  /** The extensions, cleaned */
  const extensions = raw
    .filter((item) => typeof item === "string")
    .map((item) => item.trim().toLowerCase().replace(/^\.+/, ""))
    .filter((item) => EXTENSION_PATTERN.test(item));

  return [...new Set(extensions)].slice(0, MAX_EXTENSIONS);
}

/** A plain file name to suggest in a save dialog, or null */
export function toFileName(raw) {
  if (typeof raw !== "string") return null;

  const name = raw.trim();

  const isPlain =
    name !== "" &&
    name !== "." &&
    name !== ".." &&
    name.length <= MAX_NAME_LENGTH &&
    !/[\\/:*?"<>|\0]/.test(name);

  return isPlain ? name : null;
}

/** The path properties of a file, folder or save field */
export function normalizePathField(field, raw) {
  /** Whether a file field takes several files */
  const multiple = field.type === FIELD_TYPE.FILE && raw.multiple === true;

  return {
    ...field,
    extensions:
      field.type === FIELD_TYPE.FOLDER ? [] : toExtensions(raw.extensions),
    multiple,
    defaultName:
      field.type === FIELD_TYPE.SAVE ? toFileName(raw.defaultName) : null,
    default: multiple ? [] : "",
  };
}

/** Whether a path is absolute on Windows, macOS or Linux */
const isAbsolutePath = (value) => /^(\/|[A-Za-z]:[\\/]|\\\\)/.test(value);

/** The lowercase extension of a path, without the dot */
function getExtension(value) {
  /** The last part of the path */
  const name = value.split(/[\\/]/).pop();
  /** The position of the extension's dot */
  const dot = name.lastIndexOf(".");

  return dot > 0 ? name.slice(dot + 1).toLowerCase() : "";
}

/** Whether a path is a full path of an accepted length */
const isFullPath = (value) =>
  value.length <= MAX_PATH_LENGTH && isAbsolutePath(value);

/** Whether a path has one of the field's extensions, or any if none */
const hasAllowedExtension = (field, value) =>
  field.extensions.length === 0 ||
  field.extensions.includes(getExtension(value));

/** The message of a path that isn't a full path */
const notFullPathMessage = (field) => `${field.label} must be a full path`;

/** The message of a path with another extension */
const extensionMessage = (field) =>
  `${field.label} must be a ` +
  field.extensions.map((ext) => `.${ext}`).join(" or ") +
  " file";

/** The word for what a field asks for */
const NOUNS = {
  [FIELD_TYPE.FILE]: "a file",
  [FIELD_TYPE.FOLDER]: "a folder",
  [FIELD_TYPE.SAVE]: "where to save",
};

/** The yup schema of a single path */
function singlePathSchema(field) {
  /** The schema of the path */
  const schema = yup
    .string()
    .transform((_value, input) => (typeof input === "string" ? input : ""))
    .default("")
    .test("full-path", notFullPathMessage(field), (value) =>
      value === "" ? true : isFullPath(value),
    )
    .test("extension", extensionMessage(field), (value) =>
      value === "" ? true : hasAllowedExtension(field, value),
    );

  return field.required
    ? schema.required(`Choose ${NOUNS[field.type]} for ${field.label}`)
    : schema;
}

/** The yup schema of a list of files */
function multiplePathSchema(field) {
  /** The schema of the list */
  const schema = yup
    .array()
    .transform((_value, input) =>
      Array.isArray(input)
        ? [...new Set(input.filter((item) => typeof item === "string"))]
        : [],
    )
    .default([])
    .max(MAX_FILES, `${field.label} takes at most ${MAX_FILES} files`)
    .test("full-paths", notFullPathMessage(field), (list) =>
      list.every(isFullPath),
    )
    .test("extensions", extensionMessage(field), (list) =>
      list.every((value) => hasAllowedExtension(field, value)),
    );

  return field.required
    ? schema.min(1, `Choose at least one file for ${field.label}`)
    : schema;
}

/** The yup schema of a file, folder or save field */
export function pathSchema(field) {
  return field.multiple ? multiplePathSchema(field) : singlePathSchema(field);
}
