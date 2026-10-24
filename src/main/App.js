import {
  BrowserWindow,
  app,
  ipcMain,
  nativeTheme,
  screen,
  session,
  shell,
} from "electron";
import { electronApp, is, optimizer } from "@electron-toolkit/utils";
import {
  checkExtensionUpdate,
  getDefaultExtensionPath,
  getExtensionVersion,
  installExtension,
  installLatestExtension,
  pickExtensionPath,
} from "./services/extension";
import { generateUserAgent, syncUserAgents } from "./services/userAgents";
import { registerWebRequest, setSessionRules } from "./libs/webRequest";
import { startMirrorServer, stopMirrorServer } from "./server";

import { Conf } from "electron-conf/main";
import { IPC } from "../shared/constants/ipc";
import ProfileRegistry from "./ProfileRegistry";
import { buildChromeContextMenu } from "electron-chrome-context-menu";
import fs from "fs/promises";
import icon from "../../resources/icon.png?asset";
import { join } from "path";

/** Wraps a handler that does not need the IPC event */
const withoutEvent =
  (handler) =>
  (_event, ...args) =>
    handler(...args);

class App {
  profiles = new ProfileRegistry();

  constructor() {
    this.initialize();
  }

  createWindow() {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    // Create the browser window.
    this.window = new BrowserWindow({
      width,
      height,
      show: false,
      autoHideMenuBar: true,
      ...(process.platform === "linux" ? { icon } : {}),
      webPreferences: {
        preload: join(__dirname, "../preload/index.js"),
        sandbox: false,
        webviewTag: true,
        webSecurity: false,
      },
    });

    /* Context Menu for WebContents */
    this.window.webContents.on("context-menu", (_e, params) => {
      const menu = buildChromeContextMenu({
        params,
        webContents: this.window.webContents,
        openLink: (url) => {
          shell.openExternal(url);
        },
      });

      menu.popup();
    });

    /* Maximize when ready to show */
    this.window.on("ready-to-show", () => {
      this.window.maximize();
    });

    /* Handle links opening in external browser */
    this.window.webContents.setWindowOpenHandler((details) => {
      shell.openExternal(details.url);
      return { action: "deny" };
    });

    // HMR for renderer base on electron-vite cli.
    // Load the remote URL for development or the local html file for production.
    if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
      this.window.loadURL(process.env["ELECTRON_RENDERER_URL"]);
    } else {
      this.window.loadFile(join(__dirname, "../renderer/index.html"));
    }
  }

  /** Register IPC Handlers */
  registerIpcHandlers() {
    const handlers = {
      [IPC.GET_APP_VERSION]: () => app.getVersion(),
      [IPC.GET_SESSION_COOKIE]: (event, options) =>
        event.sender.session.cookies.get(options),
      [IPC.SET_SESSION_COOKIE]: (event, options) =>
        event.sender.session.cookies.set(options),
      [IPC.UPDATE_DECLARATIVE_NET_RULES]: (event, rules) =>
        this.updateDeclarativeNetRules(event.sender.session, rules),
      [IPC.SAVE_BACKUP_FILE]: withoutEvent(this.saveBackupFile),
      [IPC.OPEN_PATH]: withoutEvent((path) => shell.openPath(path)),
      [IPC.INSTALL_EXTENSION]: withoutEvent((file, path) =>
        this.installExtension(file, path),
      ),
      [IPC.CHECK_EXTENSION_UPDATE]: withoutEvent(checkExtensionUpdate),
      [IPC.INSTALL_LATEST_EXTENSION]: withoutEvent((path) =>
        this.installLatestExtension(path),
      ),
      [IPC.GET_EXTENSION_VERSION]: withoutEvent(getExtensionVersion),
      [IPC.GET_DEFAULT_EXTENSION_PATH]: withoutEvent(getDefaultExtensionPath),
      [IPC.PICK_EXTENSION_PATH]: withoutEvent(pickExtensionPath),
      [IPC.CONFIGURE_PROXY]: withoutEvent((partition, options) =>
        this.profiles.get(partition).configureProxy(options),
      ),
      [IPC.SETUP_SESSION]: withoutEvent((data) => this.setupSession(data)),
      [IPC.REMOVE_SESSION]: withoutEvent((partition) =>
        this.removeSession(partition),
      ),
      [IPC.CONFIGURE_THEME]: withoutEvent((theme) => {
        nativeTheme.themeSource = theme;
      }),
      [IPC.GENERATE_USER_AGENT]: withoutEvent(generateUserAgent),
      [IPC.SYNC_USER_AGENTS]: withoutEvent(syncUserAgents),
    };

    for (const [channel, handler] of Object.entries(handlers)) {
      ipcMain.handle(channel, handler);
    }
  }

  /** Route global events to the profile owning the session */
  registerProfileListeners() {
    app.on("login", (event, webContents, _request, authInfo, callback) => {
      this.profiles
        .find(webContents?.session)
        ?.handleLogin(event, authInfo, callback);
    });

    app.on("web-contents-created", (_event, contents) => {
      this.profiles.find(contents.session)?.handleWebContentsCreated(contents);
    });
  }

  /** Save Backup File */
  async saveBackupFile(filename, content) {
    /** Backup Directory */
    const backupDir = join(
      app.getPath("documents"),
      "Purrfect Whiskers Backup",
    );

    /** Full Backup File Path */
    const backupFile = join(backupDir, filename);

    /** Ensure backup directory exists */
    await fs.mkdir(backupDir, { recursive: true });

    /** Write to Backup */
    await fs.writeFile(backupFile, content);

    /** Show Backup File */
    shell.showItemInFolder(backupFile);
  }

  /** Install an extension, then sync the User-Agent catalog to its version */
  async installExtension(file, path) {
    const result = await installExtension(file, path);
    await syncUserAgents(path);

    return result;
  }

  /** Install the latest extension, then sync the User-Agent catalog to its version */
  async installLatestExtension(path) {
    const result = await installLatestExtension(path);
    await syncUserAgents(path);

    return result;
  }

  /** Setup Session */
  async setupSession(data) {
    const profile = this.profiles.get(data.partition);

    /** Configure Proxy */
    if (data.proxyOptions) {
      await profile.configureProxy(data.proxyOptions);
    }

    /** Load Extension */
    return profile.getExtension(data.extensionPath);
  }

  /**
   * Stores the extension's rules and makes sure they are applied
   * @param {Electron.Session} ses
   * @param {Array} rules
   */
  updateDeclarativeNetRules(ses, rules) {
    setSessionRules(ses, rules);
    registerWebRequest(ses);
  }

  /** Remove Session */
  async removeSession(partition) {
    /* Get Session */
    const ses = session.fromPartition(partition);

    /* Destroy Profile */
    await this.profiles.remove(partition);

    /* Clear all session data before removing */
    await ses.clearCache();
    await ses.clearStorageData();

    /** Remove Partition */
    await fs.rm(ses.getStoragePath(), { recursive: true, force: true });
  }

  /** Start the mirror server, continuing without it on failure */
  async startMirrorServer() {
    try {
      await startMirrorServer();
    } catch (error) {
      console.error("Mirror server unavailable:", error);
    }
  }

  initialize() {
    // This method will be called when Electron has finished
    // initialization and is ready to create browser windows.
    // Some APIs can only be used after this event occurs.
    app.whenReady().then(async () => {
      // Set app user model id for windows
      electronApp.setAppUserModelId("Purrfect Whiskers");

      // Default open or close DevTools by F12 in development
      // and ignore CommandOrControl + R in production.
      // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
      app.on("browser-window-created", (_, window) => {
        optimizer.watchWindowShortcuts(window);
      });

      // Start Mirror Server
      await this.startMirrorServer();

      // Register conf listener
      new Conf().registerRendererListener();

      // Handles
      this.registerIpcHandlers();
      this.registerProfileListeners();

      // Create Window
      this.createWindow();

      app.on("activate", () => {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) this.createWindow();
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
  }
}

export default App;
