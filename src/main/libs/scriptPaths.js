import {
  FIELD_TYPE,
  PATH_FIELD_TYPES,
} from "../../shared/lib/scriptFieldTypes";
import { toExtensions, toFileName } from "../../shared/lib/scriptPathFields";

import { dialog } from "electron";
import fs from "fs/promises";
import path from "path";

/** What each path field needs on disk, and its messages */
const PATH_CHECKS = {
  [FIELD_TYPE.FILE]: {
    isFile: true,
    missing: "file not found",
    wrongKind: "not a file",
  },
  [FIELD_TYPE.FOLDER]: {
    isFile: false,
    missing: "folder not found",
    wrongKind: "not a folder",
  },
  [FIELD_TYPE.SAVE]: {
    isFile: false,
    missing: "the folder to save in was not found",
    wrongKind: "the folder to save in was not found",
  },
};

/** The problem with a path on disk: "missing", "wrongKind", or null */
async function findPathProblem(target, isFile) {
  try {
    const stat = await fs.stat(target);

    return (isFile ? stat.isFile() : stat.isDirectory()) ? null : "wrongKind";
  } catch {
    return "missing";
  }
}

/** The message of the first path value not usable on disk, or null */
export async function checkPathValues(fields, values) {
  for (const field of fields) {
    if (!PATH_FIELD_TYPES.has(field.type)) continue;

    /** The paths of the field */
    const paths = [values[field.key]].flat().filter(Boolean);
    /** What the field needs on disk */
    const check = PATH_CHECKS[field.type];

    for (const value of paths) {
      /** The path that must exist: the file or folder, or the save folder */
      const target =
        field.type === FIELD_TYPE.SAVE ? path.dirname(value) : value;

      const problem = await findPathProblem(target, check.isFile);

      if (problem) return `${field.label}: ${check[problem]}`;
    }
  }

  return null;
}

/** The file filters of a dialog for the allowed extensions */
const toFilters = (extensions) =>
  extensions.length > 0
    ? [{ name: extensions.map((ext) => `.${ext}`).join(", "), extensions }]
    : undefined;

/**
 * Opens the system dialog for a path field and resolves with the chosen
 * path, the chosen paths of a multiple file field, or null when cancelled
 */
export async function pickScriptPath(window, request = {}) {
  const { type } = request;

  if (!PATH_FIELD_TYPES.has(type)) throw new Error("Invalid path field");

  /** The allowed extensions */
  const extensions =
    type === FIELD_TYPE.FOLDER ? [] : toExtensions(request.extensions);
  /** The dialog's title */
  const title = typeof request.title === "string" ? request.title : undefined;

  if (type === FIELD_TYPE.SAVE) {
    const result = await dialog.showSaveDialog(window, {
      title,
      defaultPath: toFileName(request.defaultName) ?? undefined,
      filters: toFilters(extensions),
    });

    return result.canceled ? null : result.filePath;
  }

  /** Whether several files can be chosen */
  const multiple = type === FIELD_TYPE.FILE && request.multiple === true;

  const result = await dialog.showOpenDialog(window, {
    title,
    filters: toFilters(extensions),
    properties:
      type === FIELD_TYPE.FOLDER
        ? ["openDirectory", "createDirectory"]
        : multiple
          ? ["openFile", "multiSelections"]
          : ["openFile"],
  });

  if (result.canceled || result.filePaths.length === 0) return null;

  return multiple ? result.filePaths : result.filePaths[0];
}
