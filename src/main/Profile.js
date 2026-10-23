import { WEBVIEW_ACTION, WEBVIEW_CHANNEL } from "../shared/constants/ipc";
import { app, session } from "electron";
import {
  clearSessionRules,
  clearUserAgent,
  registerWebRequest,
  setUserAgent,
} from "./libs/webRequest";
import { join, resolve } from "path";

import { buildChromeContextMenu } from "electron-chrome-context-menu";
import { buildTelegramUserAgent } from "../shared/lib/ua";
import isEqual from "fast-deep-equal";

/** Path to Preload File */
const PRELOAD_FILE = join(__dirname, "../preload/index.js");

/** Window dispositions opened as a tab in the account's browser */
const TAB_DISPOSITIONS = new Set([
  "default",
  "foreground-tab",
  "background-tab",
]);

/** Profile Class */
class Profile {
  /** @type {string} */
  partition = "";

  /** @type {Electron.Session} */
  session = null;

  /** @type {{proxyHost: string, proxyPort?: number, proxyUsername?: string, proxyPassword?: string}|null} */
  proxyOptions = null;

  /**
   * User-Agent used while the account has none, kept for the app's run
   * @type {string|null}
   */
  fallbackUserAgent = null;

  /** @param {string} partition */
  constructor(partition) {
    this.partition = partition;
    this.session = session.fromPartition(this.partition);
  }

  /** Destroy Profile */
  async destroy() {
    /* Remove Extensions */
    this.session.extensions.getAllExtensions().forEach((extension) => {
      this.session.extensions.removeExtension(extension.id);
    });

    clearSessionRules(this.session);
    clearUserAgent(this.session);

    /** Clear Proxy */
    await this.session.setProxy({ proxyRules: "" });

    /** Close All Connections */
    await this.session.closeAllConnections();
  }

  /** Get the account's User-Agent, or the generated fallback */
  resolveUserAgent(userAgent) {
    if (userAgent) return userAgent;

    if (!this.fallbackUserAgent) {
      this.fallbackUserAgent = buildTelegramUserAgent(
        app.userAgentFallback,
        app.name,
      );
    }

    return this.fallbackUserAgent;
  }

  /** Configure Proxy */
  async configureProxy(options = {}) {
    try {
      if (options.allowProxies && options.proxyEnabled && options.proxyHost) {
        if (!this.proxyOptions || !isEqual(this.proxyOptions, options)) {
          /** Add credentials */
          this.proxyOptions = options;

          /** Proxy Rules */
          const proxyRules = `${options.proxyHost}:${options.proxyPort || 80},direct://`;

          /** Set Proxy */
          await this.session.setProxy({
            mode: "fixed_servers",
            proxyBypassRules: "<local>",
            proxyRules,
          });
        }
      } else {
        /** Clear Proxy */
        await this.session.setProxy({ proxyRules: "" });

        /** Remove Credentials */
        this.proxyOptions = null;
      }
    } catch (e) {
      console.error(e);
    }

    /** Close All Connections */
    await this.session.closeAllConnections();

    /** Set User Agent */
    setUserAgent(this.session, this.resolveUserAgent(options.userAgent));

    /** Configure Web Request */
    registerWebRequest(this.session);
  }

  /**
   * Answers proxy authentication with the stored credentials
   * @param {Electron.Event} event
   * @param {Electron.AuthInfo} authInfo
   * @param {(username?: string, password?: string) => void} callback
   */
  handleLogin(event, authInfo, callback) {
    if (authInfo.isProxy && this.proxyOptions !== null) {
      const { proxyUsername, proxyPassword } = this.proxyOptions;

      event.preventDefault();
      callback(proxyUsername, proxyPassword);
    }
  }

  /**
   * Sets up the context menu and window handling of the profile's contents
   * @param {Electron.WebContents} contents
   */
  handleWebContentsCreated(contents) {
    /* Opens a link as a tab in the account's browser */
    const openLink = (data) => {
      if (!contents.hostWebContents) {
        console.warn("No hostWebContents to open link in");
        return;
      }

      contents.hostWebContents.send(WEBVIEW_CHANNEL.BROWSER_MESSAGE, {
        id: this.partition,
        action: WEBVIEW_ACTION.OPEN_WINDOW,
        data,
      });
    };

    /* Context Menu for WebContents */
    contents.on("context-menu", (_e, params) => {
      const menu = buildChromeContextMenu({
        params,
        webContents: contents,
        openLink: (url) => openLink({ url }),
      });

      menu.popup();
    });

    /* Override window handler */
    contents.setWindowOpenHandler((details) => {
      if (TAB_DISPOSITIONS.has(details.disposition)) {
        openLink(details);
        return { action: "deny" };
      }

      return {
        action: "allow",
        overrideBrowserWindowOptions: {
          autoHideMenuBar: true,
        },
      };
    });
  }

  /** Get Extension */
  async getExtension(extensionPath) {
    let extension;

    if (extensionPath) {
      try {
        /** Get Loaded Extension */
        extension = this.session.extensions
          .getAllExtensions()
          .find((item) => resolve(item.path) === resolve(extensionPath));

        /** Load Extension */
        if (!extension) {
          extension = await this.session.extensions.loadExtension(
            extensionPath,
            { allowFileAccess: true },
          );
        }
      } catch (e) {
        console.error(e);
      }
    }
    return { extension, preload: "file://" + PRELOAD_FILE };
  }
}

export default Profile;
