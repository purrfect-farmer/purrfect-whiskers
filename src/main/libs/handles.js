import axios from "axios";
import fs from "fs/promises";
import isEqual from "fast-deep-equal";
import semver from "semver";
import {
  Notification,
  app,
  dialog,
  session as electronSession,
  shell,
  webContents,
} from "electron";
import { join, resolve } from "path";

import { downloadAndExtract, extractZip } from "./downloader";
import { mutexify } from "../../renderer/src/lib/utils";
import { registerWebRequest } from "./webRequest";

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
    const latestRelease = await axios
      .get(import.meta.env.VITE_EXTENSION_RELEASE_API_URL)
      .then((res) => res.data);
    const latestTag = latestRelease["tag_name"];

    if (
      currentExtensionVersion === null ||
      semver.gt(latestTag, currentExtensionVersion)
    ) {
      const filePattern = new RegExp(
        import.meta.env.VITE_EXTENSION_RELEASE_FILE_PATTERN.replaceAll(
          "*",
          "\\d+"
        ).replaceAll(".", "\\.")
      );

      const releaseFile = latestRelease.assets.find((item) =>
        filePattern.test(item.name)
      );

      if (releaseFile) {
        await downloadAndExtract(releaseFile["browser_download_url"], path);

        new Notification({
          title: "Extension Updated",
          body: `A new version of the extension has been installed - ${latestTag}.`,
        }).show();

        return {
          status: true,
          version: latestTag,
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

/** Install Extension */
export const installExtension = async (_event, file, path) => {
  await extractZip(file, path);
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
export const configureProxy = mutexify(async (_event, partition, options) => {
  /** Get Session */
  const session = getSession(partition);

  try {
    if (options.allowProxies && options.proxyEnabled && options.proxyHost) {
      if (
        !proxyCredentialsMap.has(session) ||
        !isEqual(proxyCredentialsMap.get(session), options)
      ) {
        /** Add credentials */
        proxyCredentialsMap.set(session, options);

        /** Proxy Rules */
        const proxyRules = `${options.proxyHost}:${options.proxyPort || 80},direct://`;

        /** Set Proxy */
        await session.setProxy({
          mode: "fixed_servers",
          proxyBypassRules: "<local>",
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

  /** Close All Connections */
  await session.closeAllConnections();

  /** Configure Web Request */
  configureWebRequest(_event, partition);
});

export const configureWebRequest = mutexify(async (_event, partition) => {
  /** Get Session */
  const session = getSession(partition);

  /** Register Web Request */
  registerWebRequest(session);
});

/** Setup Session */
export const setupSession = mutexify(async (_event, data) => {
  let extension;
  const preload = "file://" + join(__dirname, "../preload/index.js");
  const session = getSession(data.partition);

  /** Configure Proxy */
  if (data.proxyOptions) {
    await configureProxy(_event, data.partition, data.proxyOptions);
  }

  if (data.extensionPath) {
    try {
      /** Get Loaded Extension */
      extension = session.extensions
        .getAllExtensions()
        .find((item) => resolve(item.path) === resolve(data.extensionPath));

      /** Load Extension */
      if (!extension) {
        extension = await session.extensions.loadExtension(data.extensionPath, {
          allowFileAccess: true,
        });
      }
    } catch (e) {
      console.error(e);
    }
  }

  return { extension, preload };
});

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

/** Open Path */
export const openPath = async (_event, path) => {
  shell.openPath(path);
};

/** Get Session Cookie */
export function getSessionCookie(_event, options) {
  return _event.sender.session.cookies.get(options);
}

/** Set Session Cookie */
export function setSessionCookie(_event, options) {
  return _event.sender.session.cookies.set(options);
}

/** Get App Version */
export function getAppVersion(_event) {
  return app.getVersion();
}

export function enableNewWindowCapture(_event, id) {
  const contents = webContents.fromId(id);

  if (contents) {
    contents.setWindowOpenHandler((details) => {
      if (
        ["default", "foreground-tab", "background-tab"].includes(
          details.disposition
        )
      ) {
        if (contents.hostWebContents) {
          contents.hostWebContents.send("browser-message", {
            id,
            action: "open-window",
            data: details,
          });
        } else {
          console.warn("No hostWebContents to send browser-message");
        }
        return { action: "deny" };
      } else {
        return {
          action: "allow",
          overrideBrowserWindowOptions: {
            autoHideMenuBar: true,
          },
        };
      }
    });
  }
}

export function cancelNewWindowCapture(_event, id) {
  const contents = webContents.fromId(id);

  if (contents) {
    contents.setWindowOpenHandler(() => ({ action: "allow" }));
  }
}

export function updateNetRules(_event, rules) {
  registerWebRequest(_event.sender.session, rules);
}
