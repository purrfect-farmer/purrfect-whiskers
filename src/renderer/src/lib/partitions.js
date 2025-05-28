/** Configure Proxy */
export function configureProxy(partition, options) {
  return window.electron.ipcRenderer.invoke(
    "configure-proxy",
    partition,
    options
  );
}

/** Close Session */
export function closeSession(partition) {
  return window.electron.ipcRenderer.invoke("close-session", partition);
}

/** Get Whisker Data */
export function getWhiskerData({ account, settings }) {
  const {
    title,
    partition,
    proxyEnabled,
    proxyHost,
    proxyPort,
    proxyUsername,
    proxyPassword,
  } = account;

  const { theme, allowProxies } = settings;

  return {
    account: {
      title,
      partition,
    },
    sharedSettings: {
      allowProxies,
      proxyEnabled,
      proxyHost,
      proxyPort,
      proxyUsername,
      proxyPassword,
    },
    settings: {
      theme,
    },
  };
}

/** Create Webview */
export function createWebview(partition, extensionPath) {
  /** Create the <webview> element */
  const webview = document.createElement("webview");

  webview.setAttribute("partition", partition);
  webview.setAttribute("allowpopups", "true");
  webview.setAttribute(
    "useragent",
    "Mozilla/5.0 (Linux; Android 14; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.6778.135 Mobile Safari/537.36 Telegram-Android/11.6.1 (Samsung SM-G998B; Android 14; SDK 34; HIGH)"
  );
  webview.style.width = "100%";
  webview.style.height = "100%";

  /** Context Menu */
  webview.addEventListener("context-menu", () => {
    webview.openDevTools({ mode: "detach" });
  });

  /** Load extension URL */
  window.electron.ipcRenderer
    .invoke("setup-session", { partition, extensionPath })
    .then(({ extension, preload }) => {
      webview.preload = preload;
      webview.src = extension
        ? extension.url + "index.html"
        : import.meta.env.VITE_DEFAULT_WEBVIEW_URL;
    })
    .catch(() => {
      webview.src = import.meta.env.VITE_DEFAULT_WEBVIEW_URL;
    });

  return webview;
}

/**
 * Register Webview Message
 * @param {Electron.WebviewTag} webview
 */
export function registerWebviewMessage(webview, handlers) {
  const reply = (data) => {
    webview.send("host-message", data);
  };

  const listener = (event) => {
    if (event.channel === "webview-message") {
      const { action, data } = event.args[0];

      if (typeof handlers[action] === "function") {
        handlers[action](data, reply);
      }
    }
  };

  webview.addEventListener("ipc-message", listener);

  return listener;
}
