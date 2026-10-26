import { app, dialog, shell } from "electron";
import {
  exists,
  installScriptFromZip,
  isPlainName,
} from "../libs/scriptPackages";

import fs from "fs/promises";
import path from "path";

export { listScripts } from "../libs/scriptPackages";

/** The name of the default scripts folder in the documents folder */
const DEFAULT_FOLDER_NAME = "Purrfect Whiskers Scripts";

/** The package file making the scripts ES modules */
const PACKAGE_JSON = `${JSON.stringify(
  { name: "purrfect-whiskers-scripts", private: true, type: "module" },
  null,
  2,
)}\n`;

/** The example script copied into a new default folder */
const EXAMPLE_SCRIPT_DIR = path
  .join(__dirname, "../../resources/example-script")
  .replace("app.asar", "app.asar.unpacked");

/** The default scripts folder, created with an example on first use */
export async function getDefaultScriptsFolder() {
  /** The default scripts folder */
  const folder = path.join(app.getPath("documents"), DEFAULT_FOLDER_NAME);

  if (!(await exists(folder))) {
    await fs.mkdir(folder, { recursive: true });
    await fs.writeFile(path.join(folder, "package.json"), PACKAGE_JSON);
    await fs.cp(EXAMPLE_SCRIPT_DIR, path.join(folder, "example"), {
      recursive: true,
    });
  }

  return folder;
}

/** Opens a folder picker for the scripts folder */
export function pickScriptsFolder(defaultPath) {
  return dialog.showOpenDialog({
    defaultPath: defaultPath || undefined,
    properties: ["openDirectory"],
  });
}

/** Opens the folder of the script `name` in the file manager */
export function openScriptFolder(folder, name) {
  if (typeof folder !== "string" || folder === "" || !isPlainName(name)) {
    throw new Error("Invalid script");
  }

  return shell.openPath(path.join(folder, name));
}

/** Opens a zip picker and installs the chosen script package into `folder` */
export async function installScript(folder) {
  const result = await dialog.showOpenDialog({
    filters: [{ name: "Script package", extensions: ["zip"] }],
    properties: ["openFile"],
  });

  if (result.canceled) return { canceled: true };

  return installScriptFromZip(folder, result.filePaths[0]);
}
