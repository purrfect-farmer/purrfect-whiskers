import { Notification, app, dialog } from "electron";
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

/** Get Default Extension Path */
export function getDefaultExtensionPath() {
  return join(app.getPath("userData"), "Extension");
}

/** Pick Extension Path */
export function pickExtensionPath(defaultPath) {
  return dialog.showOpenDialog({
    defaultPath,
    properties: ["openDirectory"],
  });
}

/** Install Extension */
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
  const useApiAsset = hasGithubToken();

  return downloadAndExtract(
    useApiAsset ? asset["url"] : asset["browser_download_url"],
    path,
    useApiAsset ? getGithubHeaders("application/octet-stream") : {},
  );
}

/** Installs the latest release when it is newer than the installed one */
export async function updateExtension(path) {
  try {
    const currentVersion = await getExtensionVersion(path);
    const latestRelease = await getLatestRelease();
    const latestTag = latestRelease["tag_name"];

    const isOutdated =
      currentVersion === null || semver.gt(latestTag, currentVersion);

    const asset = isOutdated
      ? latestRelease.assets.find((item) => RELEASE_FILE_REGEX.test(item.name))
      : null;

    if (asset) {
      await installReleaseAsset(asset, path);

      new Notification({
        title: "Extension Updated",
        body: `A new version of the extension has been installed - ${latestTag}.`,
      }).show();

      return { status: true, version: latestTag };
    }
  } catch (e) {
    console.error("Failed to check for extension update:", e.message);
  }

  return { status: false };
}
