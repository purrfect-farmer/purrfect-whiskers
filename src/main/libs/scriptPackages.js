import AdmZip from "adm-zip";
import { normalizeFields } from "../../shared/lib/scriptFields";
import fs from "fs/promises";
import os from "os";
import path from "path";

/** The default entry file of a script */
export const SCRIPT_ENTRY = "index.js";

/** The manifest file of a script */
const MANIFEST_FILE = "package.json";

/** The manifest key holding a script's app fields (display name, icon) */
const MANIFEST_KEY = import.meta.env?.VITE_SCRIPT_MANIFEST_KEY;

/** The media type of each supported icon extension */
const ICON_TYPES = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

/** The largest icon read, in bytes */
const MAX_ICON_SIZE = 256 * 1024;

/** The largest unpacked script package, in bytes */
const MAX_PACKAGE_SIZE = 50 * 1024 * 1024;

/** The folder macOS adds to zips it creates */
const MACOS_ZIP_FOLDER = "__MACOSX";

/** Whether a value is a string with visible characters */
const isText = (value) => typeof value === "string" && value.trim() !== "";

/** Whether a path exists */
export async function exists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

/** Whether a path is an existing file */
export async function isFile(filePath) {
  try {
    return (await fs.stat(filePath)).isFile();
  } catch {
    return false;
  }
}

/** Whether a name is a single folder name */
export function isPlainName(name) {
  return (
    isText(name) &&
    name !== "." &&
    name !== ".." &&
    path.basename(name) === name
  );
}

/** A path inside `dir`, or null when `relativePath` leaves it */
function resolveInside(dir, relativePath) {
  if (!isText(relativePath)) return null;

  /** The resolved path */
  const resolved = path.resolve(dir, relativePath);

  /** The path relative to `dir` */
  const relative = path.relative(dir, resolved);

  const isInside =
    relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative);

  return isInside ? resolved : null;
}

/** The parsed JSON of a file, or null */
async function readJson(filePath) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch {
    return null;
  }
}

/** The manifest of a script folder, with defaults for missing fields */
export async function readManifest(scriptDir) {
  const json = await readJson(path.join(scriptDir, MANIFEST_FILE));

  /** The package fields */
  const data = json && typeof json === "object" ? json : {};

  /** The app fields of the script */
  const appFields =
    MANIFEST_KEY && data[MANIFEST_KEY] && typeof data[MANIFEST_KEY] === "object"
      ? data[MANIFEST_KEY]
      : {};

  /** The author's name */
  const author = isText(data.author)
    ? data.author
    : isText(data.author?.name)
      ? data.author.name
      : null;

  return {
    name: isText(data.name) ? data.name.trim() : null,
    displayName:
      [appFields.displayName, data.name].find(isText)?.trim() ??
      path.basename(scriptDir),
    description: isText(data.description) ? data.description.trim() : null,
    version: isText(data.version) ? data.version.trim() : null,
    author: author?.trim() ?? null,
    entry:
      data.main === undefined
        ? path.join(scriptDir, SCRIPT_ENTRY)
        : resolveInside(scriptDir, data.main),
    iconPath: resolveInside(scriptDir, appFields.icon),
    options: normalizeFields(appFields.options),
  };
}

/** An icon as a data URL, or null when missing, unsupported or too large */
export async function readIcon(iconPath) {
  const type = iconPath
    ? ICON_TYPES[path.extname(iconPath).toLowerCase()]
    : null;

  if (!type) return null;

  try {
    if ((await fs.stat(iconPath)).size > MAX_ICON_SIZE) return null;

    /** The icon's bytes */
    const content = await fs.readFile(iconPath);

    return `data:${type};base64,${content.toString("base64")}`;
  } catch {
    return null;
  }
}

/** The scripts in `folder`, with their manifest details and icons */
export async function listScripts(folder) {
  if (!isText(folder)) return [];

  let entries;

  try {
    entries = await fs.readdir(folder, { withFileTypes: true });
  } catch {
    return [];
  }

  /** The scripts found */
  const scripts = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const manifest = await readManifest(path.join(folder, entry.name));

    if (!manifest.entry || !(await isFile(manifest.entry))) continue;

    scripts.push({
      name: entry.name,
      displayName: manifest.displayName,
      description: manifest.description,
      version: manifest.version,
      author: manifest.author,
      icon: await readIcon(manifest.iconPath),
      options: manifest.options,
    });
  }

  return scripts.sort((a, b) => a.displayName.localeCompare(b.displayName));
}

/** The folder, details and options of script `name`, refusing other paths */
export async function resolveScript(folder, name) {
  if (!isText(folder) || !isPlainName(name)) {
    throw new Error("Invalid script");
  }

  /** The script's folder */
  const scriptDir = path.join(folder, name);

  const { entry, displayName, options } = await readManifest(scriptDir);

  if (!entry || !(await isFile(entry))) {
    throw new Error(`Script not found: ${name}`);
  }

  return { scriptDir, entry, displayName, options };
}

/** A script folder name from a package name, or "" */
function toFolderName(value) {
  if (!isText(value)) return "";

  return value
    .replace(/^@[^/]+\//, "")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "");
}

/** The folder holding a package: `dir`, or its single top-level folder */
async function findPackageRoot(dir) {
  if (await exists(path.join(dir, MANIFEST_FILE))) return dir;

  /** The top-level entries, without macOS metadata */
  const entries = (await fs.readdir(dir, { withFileTypes: true })).filter(
    (entry) => entry.name !== MACOS_ZIP_FOLDER,
  );

  return entries.length === 1 && entries[0].isDirectory()
    ? path.join(dir, entries[0].name)
    : dir;
}

/** Checks the paths and size of every entry in a script zip */
function checkZipEntries(zip) {
  let totalSize = 0;

  for (const entry of zip.getEntries()) {
    /** The parts of the entry's path */
    const parts = entry.entryName.split(/[\\/]/);

    if (path.isAbsolute(entry.entryName) || parts.includes("..")) {
      throw new Error("The zip contains unsafe paths");
    }

    totalSize += entry.header.size;
  }

  if (totalSize > MAX_PACKAGE_SIZE) {
    throw new Error("The zip is larger than 50 MB when unpacked");
  }
}

/** Installs the script package in `zipPath` into `folder` */
export async function installScriptFromZip(folder, zipPath) {
  if (!isText(folder)) throw new Error("Invalid scripts folder");

  const zip = new AdmZip(zipPath);

  checkZipEntries(zip);

  /** The temporary extraction folder */
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "script-package-"));

  try {
    zip.extractAllTo(tempDir, true);

    /** The folder holding the package */
    const root = await findPackageRoot(tempDir);

    if (!(await exists(path.join(root, MANIFEST_FILE)))) {
      throw new Error("The zip has no package.json");
    }

    const manifest = await readManifest(root);

    if (!manifest.entry || !(await isFile(manifest.entry))) {
      throw new Error("The script's entry file is missing");
    }

    /** The installed script's folder name */
    const name =
      toFolderName(manifest.name) ||
      toFolderName(path.basename(zipPath, path.extname(zipPath)));

    if (!name) throw new Error("The script has no usable name");

    /** The installed script's folder */
    const target = path.join(folder, name);

    if (await exists(target)) {
      throw new Error(`A script named "${name}" is already installed`);
    }

    await fs.cp(root, target, {
      recursive: true,
      filter: (source) => path.basename(source) !== MACOS_ZIP_FOLDER,
    });

    return { name };
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}
