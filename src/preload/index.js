import { contextBridge } from "electron";
import { electronAPI } from "@electron-toolkit/preload";
import { exposeConf } from "electron-conf/preload";
import { injectBrowserAction } from "electron-chrome-extensions/browser-action";

if (
  location.protocol === "chrome-extension:" &&
  location.pathname === "/webui.html"
) {
  injectBrowserAction();
} else {
  /** Expose Conf */
  exposeConf();

  // Custom APIs for renderer
  const api = {};

  // Use `contextBridge` APIs to expose Electron APIs to
  // renderer only if context isolation is enabled, otherwise
  // just add to the DOM global.
  if (process.contextIsolated) {
    try {
      contextBridge.exposeInMainWorld("electron", electronAPI);
      contextBridge.exposeInMainWorld("api", api);
    } catch (error) {
      console.error(error);
    }
  } else {
    window.electron = electronAPI;
    window.api = api;
  }
}
