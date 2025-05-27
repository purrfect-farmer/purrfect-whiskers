import axios from "axios";
import fs from "fs/promises";
import semver from "semver";
import {
  Notification,
  app,
  dialog,
  session as electronSession,
  shell,
} from "electron";
import { join } from "path";

import { downloadAndExtract } from "./downloader";
import { onBeforeSendHeaders, onHeadersReceived } from "./webRequest";

/** Session Map */
const sessionMap = new Map();

/** Proxy Handler Map */
const proxyHandlerMap = new Map();

/** Get Default Extension Path */
export const getDefaultExtensionPath = async (_event) => {
  return join(app.getPath("userData"), "Extension");
};

/** Pick Extension Path */
export const pickExtensionPath = async (_event, defaultPath) => {
  return await dialog.showOpenDialog({
    defaultPath,
    properties: ["openDirectory"],
  });
};

/** Get Extension Version */
export const getExtensionVersion = async (_event, path) => {
  const manifestPath = join(path, "manifest.json");

  try {
    /** Check if manifest.json exists by trying to access it */
    await fs.access(manifestPath);

    /** Read and parse manifest.json */
    const manifestContent = await fs.readFile(manifestPath, "utf8");
    const manifest = JSON.parse(manifestContent);

    return "v" + manifest.version;
  } catch (error) {
    console.error("Error reading manifest.json:", error.message);
    return null;
  }
};

/** Update Extension */
export const updateExtension = async (_event, path) => {
  try {
    const currentExtensionVersion = await getExtensionVersion(_event, path);
    const currentRelease = await axios
      .get(import.meta.env.VITE_EXTENSION_RELEASE_API_URL)
      .then((res) => res.data);
    const currentTag = currentRelease["tag_name"];

    if (
      currentExtensionVersion === null ||
      semver.gt(currentTag, currentExtensionVersion)
    ) {
      const filePattern = new RegExp(
        import.meta.env.VITE_EXTENSION_RELEASE_FILE_PATTERN.replaceAll(
          "*",
          "\\d+"
        ).replaceAll(".", "\\.")
      );

      const releaseFile = currentRelease.assets.find((item) =>
        filePattern.test(item.name)
      );

      if (releaseFile) {
        await downloadAndExtract(releaseFile["browser_download_url"], path);

        new Notification({
          title: "Extension Updated",
          body: `A new version of the extension has been installed - ${currentTag}.`,
        }).show();

        return {
          status: true,
          version: currentTag,
        };
      }
    }
  } catch (e) {
    console.error("Failed to check for extension update:", e);
  }

  return {
    status: false,
  };
};

/**
 * Get Session
 * @param {string} partition
 * @returns {Electron.Session | undefined}
 */
export const getSession = (partition) => {
  if (sessionMap.has(partition)) {
    return sessionMap.get(partition);
  } else {
    const session = electronSession.fromPartition(partition);

    sessionMap.set(partition, session);

    return session;
  }
};

/** Add Proxy Handler */
export const addProxyHandler = (partition, username, password) => {
  const handler = (event, webContents, request, authInfo, callback) => {
    if (authInfo.isProxy && webContents.session === getSession(partition)) {
      event.preventDefault();
      callback(username, password);
    }
  };

  /** Store Handler */
  proxyHandlerMap.set(partition, handler);

  /** Add Listener */
  app.addListener("login", handler);
};

/** Remove Proxy Handler */
export const removeProxyHandler = (partition) => {
  if (proxyHandlerMap.has(partition)) {
    app.removeListener("login", proxyHandlerMap.get(partition));
    proxyHandlerMap.delete(partition);
  }
};

/** Configure Proxy */
export const configureProxy = async (_event, partition, options) => {
  const session = getSession(partition);
  if (options.proxyEnabled) {
    /** Remove Handler */
    removeProxyHandler(partition);

    /** Add new Handler */
    addProxyHandler(partition, options.proxyUsername, options.proxyPassword);

    /** Set Proxy */
    await session.setProxy({
      proxyRules: `${options.proxyHost}:${options.proxyPort || 80}`,
    });
  } else {
    /** Clear Proxy */
    await session.setProxy({ proxyRules: "" });

    /** Remove Handler */
    removeProxyHandler(partition);
  }
};

/** Setup Session */
export const setupSession = async (_event, data) => {
  let extension;
  const preload = "file://" + join(__dirname, "../preload/index.js");
  const session = getSession(data.partition);

  /** Remove preload scripts */
  session
    .getPreloadScripts()
    .forEach((script) => session.unregisterPreloadScript(script.id));

  /** Register onBeforeSendHeaders */
  onBeforeSendHeaders(session);

  /** Register onHeadersReceived */
  onHeadersReceived(session);

  if (data.extensionPath) {
    try {
      /** Load Extension */
      extension = await session.loadExtension(data.extensionPath, {
        allowFileAccess: true,
      });
    } catch (e) {
      console.error(e);
    }
  }
  return { extension, preload };
};

/** Close Session */
export const closeSession = async (_event, partition) => {
  /** Remove Proxy Handler */
  await removeProxyHandler(partition);

  /** Get Session */
  const session = getSession(partition);

  /** Unregister Handlers */
  session.webRequest.onBeforeSendHeaders({ urls: ["<all_urls>"] }, null);
  session.webRequest.onHeadersReceived({ urls: ["<all_urls>"] }, null);

  /** Remove Extensions */
  session
    .getAllExtensions()
    .forEach((extension) => session.removeExtension(extension.id));

  /** Remove From Map */
  sessionMap.delete(partition);
};

/** Remove Session */
export const removeSession = async (_event, partition) => {
  /** Close Session */
  await closeSession(_event, partition);

  /** Get Partition Path */
  const partitionPath = join(
    app.getPath("userData"),
    "Partitions",
    partition.replace(/^persist:/, "")
  );

  /** Remove Partition */
  await fs.rm(partitionPath, { recursive: true, force: true });
};

/** Save Backup File */
export const saveBackupFile = async (_event, filename, content) => {
  const backupDir = join(app.getPath("documents"), "Purrfect Whiskers Backup");
  const backupFile = join(backupDir, filename);

  /** Ensure backup directory exists */
  await fs.mkdir(backupDir, { recursive: true });

  /** Write to Backup */
  await fs.writeFile(backupFile, content);

  /** Show Backup File */
  shell.showItemInFolder(backupFile);
};

/** Get Session Cookie */
export function getSessionCookie(_event, partition, options) {
  return getSession(partition).cookies.get(options);
}

/** Set Session Cookie */
export function setSessionCookie(_event, partition, options) {
  return getSession(partition).cookies.set(options);
}

/** Close All Sessions */
export async function closeAllSessions() {
  for (const partition of sessionMap.keys()) {
    await closeSession(null, partition);
  }

  /** Clear Session Map */
  sessionMap.clear();

  /** Clear Proxy Handler Map */
  proxyHandlerMap.clear();
}

/** Get App Version */
export function getAppVersion(_event) {
  return app.getVersion();
}
