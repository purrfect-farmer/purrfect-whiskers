import { IPC, WEBVIEW_CHANNEL } from "../../../shared/constants/ipc";

import { PROXY_OPTION_KEYS } from "./constants";

const DEFAULT_WEBVIEW_URL = import.meta.env.VITE_DEFAULT_WEBVIEW_URL;

/** Picks the proxy and User-Agent options of an account */
export function pickProxyOptions(account) {
  return Object.fromEntries(
    PROXY_OPTION_KEYS.map((key) => [key, account[key]]),
  );
}

/** Configure Proxy */
export function configureProxy(partition, options) {
  return window.electron.ipcRenderer.invoke(
    IPC.CONFIGURE_PROXY,
    partition,
    options,
  );
}

/**
 * Prepares the account's session, then points the webview at the extension,
 * or at the default page when no extension is available.
 * @param {Electron.WebviewTag} webview
 * @param {{partition: string, extensionPath: string, proxyOptions?: object}} options
 * @param {AbortSignal} [signal]
 */
export async function loadAccountWebview(webview, options, signal) {
  let src = DEFAULT_WEBVIEW_URL;

  try {
    const { extension, preload } = await window.electron.ipcRenderer.invoke(
      IPC.SETUP_SESSION,
      options,
    );

    if (signal?.aborted) return;

    webview.preload = preload;
    src = extension ? extension.url + "index.html" : DEFAULT_WEBVIEW_URL;
  } catch (error) {
    console.error("Failed to set up session:", error);
  }

  if (!signal?.aborted) {
    webview.src = src;
  }
}

/** Creates a hidden webview that loads the account's extension */
export function createWebview(partition, extensionPath) {
  const webview = document.createElement("webview");

  webview.setAttribute("partition", partition);
  webview.setAttribute("allowpopups", "true");
  webview.setAttribute("class", "w-full h-full opacity-0 fixed");

  loadAccountWebview(webview, { partition, extensionPath });

  return webview;
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
      theme,
      allowProxies,
      proxyEnabled,
      proxyHost,
      proxyPort,
      proxyUsername,
      proxyPassword,
    },
    settings: {},
  };
}

/**
 * Sends a message to the page inside a webview
 * @param {Electron.WebviewTag} webview
 * @param {{action: string, data?: any}} message
 */
export function sendHostMessage(webview, message) {
  webview.send(WEBVIEW_CHANNEL.HOST_MESSAGE, message);
}

/**
 * Routes the webview's messages to `handlers` by action
 * @param {Electron.WebviewTag} webview
 * @param {Record<string, (data: any, reply: (message: object) => void) => void>} handlers
 * @returns {() => void} Removes the listener
 */
export function registerWebviewMessage(webview, handlers) {
  const reply = (message) => sendHostMessage(webview, message);

  const listener = (event) => {
    if (event.channel !== WEBVIEW_CHANNEL.WEBVIEW_MESSAGE) return;

    const { action, data } = event.args[0] || {};

    if (typeof handlers[action] === "function") {
      handlers[action](data, reply);
    }
  };

  webview.addEventListener("ipc-message", listener);

  return () => webview.removeEventListener("ipc-message", listener);
}
