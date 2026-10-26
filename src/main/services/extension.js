import { app, dialog } from "electron";
import { downloadAndExtract, extractZip } from "../libs/downloader";
import { getGithubHeaders, hasGithubToken } from "../../shared/lib/github";

import axios from "axios";
import fs from "fs/promises";
import { join } from "path";
import semver from "semver";

/** Release API request timeout */
const RELEASE_REQUEST_TIMEOUT = 30_000;

/** Release asset name pattern, with "*" matching a version number */
const RELEASE_FILE_REGEX = new RegExp(
  import.meta.env.VITE_EXTENSION_RELEASE_FILE_PATTERN.replaceAll(
    "*",
    "\\d+",
  ).replaceAll(".", "\\."),
);

/** The default extension folder in the app's data */
export function getDefaultExtensionPath() {
  return join(app.getPath("userData"), "Extension");
}

/** Opens a dialog for picking the extension folder */
export function pickExtensionPath(defaultPath) {
  return dialog.showOpenDialog({
    defaultPath,
    properties: ["openDirectory"],
  });
}

/** Extracts an extension zip into a folder */
export function installExtension(file, path) {
  return extractZip(file, path);
}

/** Get the installed extension version as "vX.Y.Z", or null */
export async function getExtensionVersion(path) {
  try {
    const manifestContent = await fs.readFile(
      join(path, "manifest.json"),
      "utf8",
    );

    return "v" + JSON.parse(manifestContent).version;
  } catch (error) {
    console.error("Error reading manifest.json:", error.message);
    return null;
  }
}

/** Fetch Latest Release Info */
async function getLatestRelease() {
  const response = await axios.get(
    import.meta.env.VITE_EXTENSION_RELEASE_API_URL,
    {
      headers: getGithubHeaders(),
      timeout: RELEASE_REQUEST_TIMEOUT,
    },
  );

  return response.data;
}

/** Download and extract a release asset into `path` */
function installReleaseAsset(asset, path) {
  /** Whether the asset is downloaded through the API with the token */
  const useApiAsset = hasGithubToken();

  return downloadAndExtract(
    useApiAsset ? asset["url"] : asset["browser_download_url"],
    path,
    useApiAsset ? getGithubHeaders("application/octet-stream") : {},
  );
}

/** The installed and latest extension versions, and whether an update exists */
export async function checkExtensionUpdate(path) {
  const currentVersion = await getExtensionVersion(path);
  const latestVersion = (await getLatestRelease())["tag_name"];

  /** Whether none is installed or the latest version is newer */
  const isOutdated =
    currentVersion === null || semver.gt(latestVersion, currentVersion);

  return { currentVersion, latestVersion, isOutdated };
}

/** Installs the latest release, whatever version is installed */
export async function installLatestExtension(path) {
  const latestRelease = await getLatestRelease();
  /** The extension file of the release */
  const asset = latestRelease.assets.find((item) =>
    RELEASE_FILE_REGEX.test(item.name),
  );

  if (!asset) {
    throw new Error("The latest release has no extension file");
  }

  await installReleaseAsset(asset, path);

  return { version: latestRelease["tag_name"] };
}
