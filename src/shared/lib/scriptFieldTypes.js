/** The types of a script field */
export const FIELD_TYPE = Object.freeze({
  TEXT: "text",
  TEXTAREA: "textarea",
  NUMBER: "number",
  BOOLEAN: "boolean",
  SELECT: "select",
  SECRET: "secret",
  FILE: "file",
  FOLDER: "folder",
  SAVE: "save",
});

/** The field types whose value is a path on this computer */
export const PATH_FIELD_TYPES = new Set([
  FIELD_TYPE.FILE,
  FIELD_TYPE.FOLDER,
  FIELD_TYPE.SAVE,
]);
