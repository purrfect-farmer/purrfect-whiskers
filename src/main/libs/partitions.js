import AdmZip from "adm-zip";
import axios from "axios";
import fs from "fs/promises";
import os from "os";
import semver from "semver";
import {
  Notification,
  app,
  dialog,
  session as electronSession,
} from "electron";
import { createWriteStream } from "fs";
import { deleteAsync } from "del";
import { join } from "path";

/** Clean Directory */
async function cleanDirectory(dir) {
  try {
    await deleteAsync(join(dir, "**"), { force: true });
    console.log(`Cleaned up directory: ${dir}`);
  } catch (error) {
    console.error(`Failed to clean directory ${dir}:`, error);
    throw error;
  }
}

/** Download Zip */
async function downloadZip(url, outputPath) {
  const writer = createWriteStream(outputPath);

  const response = await axios({
    url,
    method: "GET",
    responseType: "stream",
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}

/** Extract Zip */
async function extractZip(zipPath, extractToDir) {
  const zip = new AdmZip(zipPath);
  zip.extractAllTo(extractToDir, true);
}

/** Download and Extract */
async function downloadAndExtract(url, extractToDir) {
  const tempDir = await fs.mkdtemp(join(os.tmpdir(), "whiskers-"));
  const zipPath = join(tempDir, "temp.zip");

  try {
    /** Download ZIP */
    console.log("Downloading ZIP to temp dir...");
    await downloadZip(url, zipPath);
    console.log("Download complete:", zipPath);

    /** Cleanup extract directory */
    console.log("Cleaning target directory...");
    await cleanDirectory(extractToDir);

    /** Ensure extract directory exists */
    await fs.mkdir(extractToDir, { recursive: true });

    /** Extract ZIP */
    console.log("Extracting zip...");
    await extractZip(zipPath, extractToDir);
    console.log("Extraction complete.");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    /** Clean up the temp ZIP file and temp directory */
    try {
      await fs.unlink(zipPath);
      await fs.rmdir(tempDir);
      console.log("Cleaned up temp files");
    } catch (e) {
      console.warn("Failed to fully clean temp files:", e);
    }
  }
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
      .get(import.meta.env.VITE_EXTENSION_RELEASE_URL)
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

/** Setup Session */
export const setupSession = async (_event, data) => {
  const session = electronSession.fromPartition(data.partition);

  /** Remove preload scripts */
  session
    .getPreloadScripts()
    .forEach((script) => session.unregisterPreloadScript(script.id));

  /** Register preload script */
  session.registerPreloadScript({
    type: "frame",
    filePath: join(__dirname, "../preload/index.js"),
  });

  /** Register onHeadersReceived */
  session.webRequest.onHeadersReceived(
    { urls: ["<all_urls>"] },
    (details, callback) => {
      const responseHeaders = Object.fromEntries(
        Object.entries(details.responseHeaders).filter(([key]) => {
          return ![
            "x-frame-options",
            "content-security-policy",
            "cross-origin-embedder-policy",
            "cross-origin-opener-policy",
            "cross-origin-resource-policy",
          ].includes(key.toLowerCase());
        })
      );
      callback({ responseHeaders });
    }
  );

  if (data.extensionPath) {
    /** Load Extension */
    const extension = await session.loadExtension(data.extensionPath, {
      allowFileAccess: true,
    });

    return extension;
  }
};

/** Remove Session */
export const removeSession = async (_event, partition) => {
  const session = electronSession.fromPartition(partition);
  session.webRequest.onHeadersReceived({ urls: ["<all_urls>"] }, null);
  await session.clearStorageData();

  /** Remove Partition Path */
  const partitionPath = join(
    app.getPath("userData"),
    "Partitions",
    partition.replace(/^persist:/, "")
  );

  await fs.rm(partitionPath, { recursive: true, force: true });
};
