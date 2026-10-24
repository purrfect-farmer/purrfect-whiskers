import { app } from "electron";
import axios from "axios";
import fs from "fs/promises";
import { getExtensionVersion } from "./extension";
import { getGithubHeaders } from "../../shared/lib/github";
import { join } from "path";
import { randomItem } from "../../shared/lib/utils";
import { withEngineChromeVersion } from "../libs/webRequest";

/** Catalog request timeout */
const CATALOG_REQUEST_TIMEOUT = 30_000;

/**
 * Downloaded catalog, kept in memory once read
 * @type {{tag: string, userAgents: string[]}|null}
 */
let catalog = null;

/** Path of the downloaded catalog */
function getCatalogPath() {
  return join(app.getPath("userData"), "user-agents.json");
}

/** Read the downloaded catalog, or null when there is none */
async function readCatalog() {
  if (catalog) return catalog;

  try {
    catalog = JSON.parse(await fs.readFile(getCatalogPath(), "utf8"));
  } catch {
    catalog = null;
  }

  return catalog;
}

/** Download the catalog of a release tag */
async function downloadCatalog(tag) {
  const url = import.meta.env.VITE_USER_AGENTS_CONTENTS_URL.replace(
    "{tag}",
    tag,
  );

  const response = await axios.get(url, {
    headers: getGithubHeaders("application/vnd.github.raw"),
    responseType: "json",
    timeout: CATALOG_REQUEST_TIMEOUT,
  });

  const userAgents = response.data;

  if (!Array.isArray(userAgents) || userAgents.length === 0) {
    throw new Error("User-Agent catalog is empty or malformed");
  }

  catalog = { tag, userAgents };
  await fs.writeFile(getCatalogPath(), JSON.stringify(catalog));
}

/**
 * Download the catalog of the installed extension's version when missing.
 * Resolves whether a catalog for that version is available.
 */
export async function syncUserAgents(extensionPath) {
  try {
    const tag = await getExtensionVersion(extensionPath);

    if (!tag) return false;

    if ((await readCatalog())?.tag !== tag) {
      await downloadCatalog(tag);
    }

    return true;
  } catch (error) {
    console.error("Failed to sync User-Agent catalog:", error.message);
    return false;
  }
}

/** A random User-Agent from the catalog naming Electron's Chrome version, or null when there is none */
export async function generateUserAgent() {
  const userAgents = (await readCatalog())?.userAgents;

  return userAgents?.length
    ? withEngineChromeVersion(randomItem(userAgents))
    : null;
}
