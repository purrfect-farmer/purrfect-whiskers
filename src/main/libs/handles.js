import axios from "axios";
import equal from "deep-equal";
import fs from "fs/promises";
import semver from "semver";
import {
  Notification,
  app,
  dialog,
  session as electronSession,
  shell,
} from "electron";
import { join, resolve } from "path";

import { downloadAndExtract } from "./downloader";
import { onBeforeSendHeaders, onHeadersReceived } from "./webRequest";

/** Session Map */
const sessionMap = new Map();

/** Proxy Handler Map */
const proxyCredentialsMap = new Map();

/** Register Proxy Auth Handler */
export function registerProxyAuthHandler() {
  app.on("login", (event, webContents, request, authInfo, callback) => {
    if (authInfo.isProxy && proxyCredentialsMap.has(webContents.session)) {
      const { proxyUsername, proxyPassword } = proxyCredentialsMap.get(
        webContents.session
      );

      event.preventDefault();
      callback(proxyUsername, proxyPassword);
    }
  });
}

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
    console.error("Failed to check for extension update:", e.message);
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
  if (!sessionMap.has(partition)) {
    sessionMap.set(partition, electronSession.fromPartition(partition));
  }
  return sessionMap.get(partition);
};

/** Configure Proxy */
export const configureProxy = async (_event, partition, options) => {
  /** Get Session */
  const session = getSession(partition);

  try {
    if (options.proxyEnabled) {
      if (
        !proxyCredentialsMap.has(session) ||
        !equal(proxyCredentialsMap.get(session), options)
      ) {
        /** Add credentials */
        proxyCredentialsMap.set(session, options);

        /** Proxy Rules */
        const proxyRules = `${options.proxyHost}:${options.proxyPort || 80},direct://`;

        /** Set Proxy */
        await session.setProxy({
          mode: "fixed_servers",
          proxyRules,
        });
      }
    } else {
      /** Clear Proxy */
      await session.setProxy({ proxyRules: "" });

      /** Remove Credentials */
      proxyCredentialsMap.delete(session);
    }
  } catch (e) {
    console.error(e);
  }
};

/** Setup Session */
export const setupSession = async (_event, data) => {
  let extension;
  const exists = sessionMap.has(data.partition);
  const preload = "file://" + join(__dirname, "../preload/index.js");
  const session = getSession(data.partition);

  /** Configure Proxy */
  if (data.proxyOptions) {
    await configureProxy(_event, data.partition, data.proxyOptions);
  }

  /** Register WebRequest */
  if (!exists) {
    /** Register onBeforeSendHeaders */
    onBeforeSendHeaders(session);

    /** Register onHeadersReceived */
    onHeadersReceived(session);
  }

  if (data.extensionPath) {
    try {
      /** Get Loaded Extension */
      extension = session
        .getAllExtensions()
        .find((item) => resolve(item.path) === resolve(data.extensionPath));

      /** Load Extension */
      if (!extension) {
        extension = await session.loadExtension(data.extensionPath, {
          allowFileAccess: true,
        });
      }
    } catch (e) {
      console.error(e);
    }
  }

  return { extension, preload };
};

/** Remove Session */
export const removeSession = async (_event, partition) => {
  /** Get Session */
  const session = getSession(partition);

  /** Remove Proxy Credentials */
  proxyCredentialsMap.delete(session);

  /** Delete Session */
  sessionMap.delete(partition);

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

/** Get App Version */
export function getAppVersion(_event) {
  return app.getVersion();
}
