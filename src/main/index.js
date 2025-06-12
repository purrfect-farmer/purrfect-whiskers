import { BrowserWindow, app, ipcMain } from "electron";
import { electronApp, optimizer } from "@electron-toolkit/utils";

import { MainWindow } from "./window";
import {
  cancelNewWindowCapture,
  configureProxy,
  enableNewWindowCapture,
  getAppVersion,
  getDefaultExtensionPath,
  getExtensionVersion,
  getSessionCookie,
  pickExtensionPath,
  registerProxyAuthHandler,
  removeSession,
  saveBackupFile,
  setSessionCookie,
  setupSession,
  updateExtension,
} from "./libs/handles";
import { startMirrorServer, stopMirrorServer } from "./server";

async function createWindow() {
  new MainWindow();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId("com.electron");

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  // Start Mirror Server
  await startMirrorServer();

  // Handles
  ipcMain.handle("get-app-version", getAppVersion);
  ipcMain.handle("get-session-cookie", getSessionCookie);
  ipcMain.handle("set-session-cookie", setSessionCookie);
  ipcMain.handle("save-backup-file", saveBackupFile);
  ipcMain.handle("update-extension", updateExtension);
  ipcMain.handle("get-extension-version", getExtensionVersion);
  ipcMain.handle("get-default-extension-path", getDefaultExtensionPath);
  ipcMain.handle("pick-extension-path", pickExtensionPath);
  ipcMain.handle("configure-proxy", configureProxy);
  ipcMain.handle("setup-session", setupSession);
  ipcMain.handle("remove-session", removeSession);
  ipcMain.handle("enable-new-window-capture", enableNewWindowCapture);
  ipcMain.handle("cancel-new-window-capture", cancelNewWindowCapture);

  // Register Proxy Auth
  registerProxyAuthHandler();

  // Create Window
  createWindow();

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", async () => {
  if (process.platform !== "darwin") {
    await stopMirrorServer();
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
