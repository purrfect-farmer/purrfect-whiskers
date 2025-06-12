import setCookie from "set-cookie-parser";
import {
  BaseWindow,
  WebContentsView,
  app,
  screen,
  session as electronSession,
} from "electron";
import { Conf } from "electron-conf";
import { is } from "@electron-toolkit/utils";
import { join } from "path";

class WindowWebContentsView extends WebContentsView {
  loadPage(page) {
    this.webContents.setWindowOpenHandler((details) => {
      shell.openExternal(details.url);
      return { action: "deny" };
    });

    if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
      this.webContents.loadURL(
        process.env["ELECTRON_RENDERER_URL"] + `/${page}`
      );
    } else {
      this.webContents.loadFile(join(__dirname, `../renderer/${page}`));
    }
  }
}

export class MainWindow {
  constructor() {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

    this.conf = new Conf();
    this.preload = join(__dirname, "../preload/index.js");
    this.conf.registerRendererListener();
    this.baseWindow = new BaseWindow({
      width,
      height,
      autoHideMenuBar: true,
    });

    /** Controls View */
    this.controlsView = new WindowWebContentsView({
      webPreferences: {
        sandbox: false,
        preload: this.preload,
      },
    });

    this.controlsView.loadPage("controls/index.html");

    /** Accounts View */
    this.accountsView = new WindowWebContentsView({
      webPreferences: {
        transparent: true,
        sandbox: false,
        preload: this.preload,
      },
    });

    this.accountsView.loadPage("accounts/index.html");
    this.baseWindow.on("ready-to-show", async () => {
      this.baseWindow.maximize();
    });

    this.app = JSON.parse(this.conf.get("app-store")).state;
    this.settings = JSON.parse(this.conf.get("settings-store")).state;

    this.accounts = this.app.accounts.slice(0, 10).map((account) => ({
      ...account,
      session: electronSession.fromPartition(account.partition),
      view: new WebContentsView({
        webPreferences: {
          partition: account.partition,
          transparent: true,
          sandbox: false,
          preload: this.preload,
        },
      }),
    }));

    this.configureProxyHandler();
    this.loadViews();

    this.baseWindow.on("resize", () => this.resizeBounds());
    this.resizeBounds();
  }

  configureProxyHandler() {
    app.on("login", (event, webContents, request, authInfo, callback) => {
      if (authInfo.isProxy) {
        const account = this.accounts.find(
          (item) => item.session === webContents.session
        );

        if (account) {
          event.preventDefault();
          callback(account.proxyUsername, account.proxyPassword);
        }
      }
    });
  }

  async configureProxy(account) {
    /** Set Proxy */
    await account.session.setProxy({
      mode: "fixed_servers",
      proxyBypassRules: "<local>",
      proxyRules: `${account.proxyHost}:${account.proxyPort || 80},direct://`,
    });
  }

  handleWebRequest(account) {
    const map = new Map();

    account.session.webRequest.onBeforeSendHeaders(
      { urls: ["*://*/*"] },
      (details, callback) => {
        if (
          !details.url.startsWith("http://") &&
          !details.url.startsWith("https://")
        ) {
          return callback({ requestHeaders: details.requestHeaders });
        }

        const requestHeaders = details.requestHeaders || {};

        map.set(details.id, {
          origin: requestHeaders["Origin"],
          method: requestHeaders["Access-Control-Request-Method"],
          headers: requestHeaders["Access-Control-Request-Headers"],
        });

        try {
          requestHeaders["Origin"] = new URL(details.url).origin;
          requestHeaders["Referer"] = requestHeaders["Origin"] + "/";
        } catch (e) {
          console.error(e);
        }

        callback({ requestHeaders });
      }
    );

    account.session.webRequest.onHeadersReceived(
      { urls: ["*://*/*"] },
      (details, callback) => {
        if (
          !details.url.startsWith("http://") &&
          !details.url.startsWith("https://")
        ) {
          return callback({ responseHeaders: details.responseHeaders });
        }

        let statusLine = details.statusLine;
        const responseHeaders = Object.fromEntries(
          Object.entries(details.responseHeaders || {}).filter(([key]) => {
            return ![
              "set-cookie",
              "x-frame-options",
              "content-security-policy",
              "cross-origin-embedder-policy",
              "cross-origin-opener-policy",
              "cross-origin-resource-policy",
              "access-control-allow-origin",
              "access-control-allow-credentials",
              "access-control-allow-methods",
              "access-control-allow-header",
            ].includes(key.toLowerCase());
          })
        );

        try {
          if (details.method === "OPTIONS") {
            /** Set Status Code */
            statusLine = "HTTP/1.1 200";
          }

          /** Get Request */
          const request = map.get(details.id);

          /** Credentials */
          responseHeaders["Access-Control-Allow-Credentials"] = "true";

          /** Headers */
          responseHeaders["Access-Control-Allow-Headers"] =
            request?.headers || "*";

          /** Origin */
          responseHeaders["Access-Control-Allow-Origin"] =
            request?.origin || "*";

          /** Methods */
          responseHeaders["Access-Control-Allow-Methods"] =
            request?.method || "*";

          /** Cookies */
          const setCookieHeaders = details.responseHeaders["set-cookie"] || [];

          /** Relax Cookies */
          for (const header of setCookieHeaders) {
            const parsed = setCookie.parseString(header);

            /**
             * @type {import("electron").CookiesSetDetails}
             */
            const cookie = {
              url: details.url,
              name: parsed.name,
              domain: parsed.domain,
              path: parsed.path,
              value: parsed.value,
              httpOnly: parsed.httpOnly,
              secure: true,
              sameSite: "no_restriction",
            };

            if (typeof parsed.maxAge !== "undefined") {
              cookie.expirationDate =
                Math.floor(Date.now() / 1000) + parsed.maxAge;
            } else if (parsed.expires instanceof Date) {
              cookie.expirationDate = Math.floor(
                parsed.expires.getTime() / 1000
              );
            }

            /** If expired, then remove */
            if (
              cookie.expirationDate &&
              cookie.expirationDate < Date.now() / 1000
            ) {
              /** Remove Cookie */
              account.session.cookies
                .remove(cookie.url, cookie.name)
                .catch(console.error);
            } else {
              /** Set Cookie */
              account.session.cookies.set(cookie).catch(console.error);
            }
          }
        } catch (e) {
          console.error(e);
        }

        callback({ responseHeaders, statusLine });
      }
    );
  }

  loadViews() {
    this.accounts.forEach(
      /**
       * @param {object} account
       * @param {Electron.WebContentsView} account.view
       * @param {Electron.Session} account.session
       */
      async (account) => {
        /** Set Proxy */
        await this.configureProxy(account);

        /** Handle Web Request */
        await this.handleWebRequest(account);

        /** Load Extension */
        const extension = await account.session.extensions.loadExtension(
          this.settings.extensionPath,
          { allowFileAccess: true }
        );

        /** Load URL */
        await account.view.webContents.loadURL(extension.url + "index.html");
      }
    );
  }

  resizeBounds() {
    const { width, height } = this.baseWindow.getBounds();
    const sidebarWidth = 56;
    const columns = 5;
    const rows = 2;

    const viewWidth = (width - sidebarWidth) / columns;
    const viewHeight = height / rows;

    this.accounts.forEach((account, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      const x = sidebarWidth + col * viewWidth;
      const y = row * viewHeight;

      account.view.setBounds({ x, y, width: viewWidth, height: viewHeight });
      this.baseWindow.contentView.addChildView(account.view);
    });
    this.baseWindow.contentView.addChildView(this.controlsView);
    this.baseWindow.contentView.addChildView(this.accountsView);
    this.controlsView.setBounds({ x: 0, y: 0, width: 56, height });
    this.accountsView.setBounds({ x: 0, y: 0, width, height });
    this.accountsView.setVisible(false);
  }
}
