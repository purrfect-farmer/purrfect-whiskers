import { contextBridge } from "electron";
import { electronAPI } from "@electron-toolkit/preload";
import { exposeConf } from "electron-conf/preload";

/** Expose Conf */
exposeConf();

// Custom APIs for renderer
const api = {};

// Expose the APIs to the renderer
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
