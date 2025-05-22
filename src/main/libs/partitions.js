import fs from "fs/promises";
import { app, dialog, session as electronSession } from "electron";
import { join } from "path";
/** Pick Extension Path */
export const pickExtensionPath = async (_event, defaultPath) => {
  return await dialog.showOpenDialog({
    defaultPath,
    properties: ["openDirectory"],
  });
};

/** Setup Session */
export const setupSession = async (_event, data) => {
  const session = electronSession.fromPartition(data.partition);

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
  const partitionPath = join(app.getPath("userData"), "Partitions", partition);
  await fs.rm(partitionPath, { recursive: true, force: true });
};
