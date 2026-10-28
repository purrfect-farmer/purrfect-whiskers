import { applyHeaderModifications, getMatchingRules } from "./rules";
import { createCorsTracker, stripBlockingHeaders } from "./cors";

import { applyUserAgent, getUserAgent } from "./userAgent";
import { createHeaders } from "./headers";
import { getSecChUa } from "./clientHints";

export { clearSessionRules, setSessionRules } from "./rules";
export {
  clearUserAgent,
  setUserAgent,
  applyBrowserUserAgentFallback,
  withEngineChromeVersion,
} from "./userAgent";

/** The URLs the listeners handle */
const URL_FILTER = { urls: ["*://*/*", "ws://*/*", "wss://*/*"] };
/** Matches http, https, ws and wss URLs */
const WEB_URL_REGEX = /^(http|https|ws|wss):\/\//;

/** Headers a Telegram Android WebView sends */
const ANDROID_WEBVIEW_HEADERS = Object.freeze({
  "X-Requested-With": "org.telegram.messenger",
  "Sec-Ch-Ua-Mobile": "?1",
  "Sec-Ch-Ua-Platform": `"Android"`,
});

/**
 * Challenge hosts, with their subdomains, whose requests keep the browser's
 * own headers; `path` limits a host to those paths
 */
const NATIVE_HEADER_TARGETS = Object.freeze([
  { host: "challenges.cloudflare.com" },
  { host: "hcaptcha.com" },
  { host: "recaptcha.net" },
  { host: "www.google.com", path: "/recaptcha/" },
  { host: "www.gstatic.com", path: "/recaptcha/" },
]);

/** Sessions with listeners already registered */
const registeredSessions = new WeakSet();

/**
 * Sets the headers a Telegram Android WebView sends
 * @param {ReturnType<typeof createHeaders>} headers
 * @param {string|undefined} userAgent
 */
function applyAndroidWebviewHeaders(headers, userAgent) {
  headers.deleteWhere((name) => name.startsWith("sec-fetch-"));

  for (const [name, value] of Object.entries(ANDROID_WEBVIEW_HEADERS)) {
    headers.set(name, value);
  }

  headers.set("Sec-Ch-Ua", getSecChUa(userAgent));
}

/**
 * Whether the request goes to a challenge listed in `NATIVE_HEADER_TARGETS`
 * @param {string} url
 */
function isNativeHeaderRequest(url) {
  let parsed;

  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  const { hostname, pathname } = parsed;

  return NATIVE_HEADER_TARGETS.some(({ host, path }) => {
    const isHost = hostname === host || hostname.endsWith(`.${host}`);

    return isHost && (!path || pathname.startsWith(path));
  });
}

/**
 * Sets the Referer of sub-frame requests to the frame's origin
 * @param {ReturnType<typeof createHeaders>} headers
 * @param {Electron.WebFrameMain | null} frame
 */
function applyFrameReferer(headers, frame) {
  if (!frame?.parent) return;

  if (frame.url) {
    headers.set("Referer", new URL(frame.url).origin);
  } else {
    headers.delete("Referer");
  }
}

/**
 * Registers the request and response listeners of a session once, answering
 * every response with its request's CORS headers
 * @param {Electron.Session} session
 * @param {object} [modifiers]
 * @param {(details: Electron.OnBeforeSendHeadersListenerDetails, headers: ReturnType<typeof createHeaders>) => void} [modifiers.request]
 * @param {(details: Electron.OnHeadersReceivedListenerDetails, headers: ReturnType<typeof createHeaders>) => void} [modifiers.response]
 */
function registerListeners(session, modifiers = {}) {
  if (registeredSessions.has(session)) return;

  registeredSessions.add(session);

  /** The CORS headers of the session's requests */
  const cors = createCorsTracker();

  session.webRequest.onBeforeSendHeaders(URL_FILTER, (details, callback) => {
    const requestHeaders = details.requestHeaders || {};

    if (!WEB_URL_REGEX.test(details.url)) {
      return callback({ requestHeaders });
    }

    /** The case-insensitive view of the request headers */
    const headers = createHeaders(requestHeaders);

    modifiers.request?.(details, headers);
    cors.remember(details.id, headers);

    callback({ requestHeaders });
  });

  session.webRequest.onHeadersReceived(URL_FILTER, (details, callback) => {
    const responseHeaders = details.responseHeaders || {};

    if (!WEB_URL_REGEX.test(details.url)) {
      return callback({ responseHeaders });
    }

    /** The case-insensitive view of the response headers */
    const headers = createHeaders(responseHeaders);

    modifiers.response?.(details, headers);
    cors.apply(details, headers);

    callback({
      responseHeaders,
      statusLine:
        details.method === "OPTIONS" ? "HTTP/1.1 200" : details.statusLine,
    });
  });

  /* Forget requests that never reach onHeadersReceived */
  session.webRequest.onCompleted(URL_FILTER, (details) => {
    cors.forget(details.id);
  });

  session.webRequest.onErrorOccurred(URL_FILTER, (details) => {
    cors.forget(details.id);
  });
}

/**
 * Registers an account session's listeners once
 * @param {Electron.Session} session
 */
export function registerWebRequest(session) {
  registerListeners(session, {
    request(details, headers) {
      if (isNativeHeaderRequest(details.url)) return;

      applyAndroidWebviewHeaders(headers, getUserAgent(session));
      applyFrameReferer(headers, details.frame);
      applyUserAgent(session, headers);

      for (const rule of getMatchingRules(session, details.url)) {
        applyHeaderModifications(headers, rule.request);
      }
    },
    response(details, headers) {
      stripBlockingHeaders(headers);

      for (const rule of getMatchingRules(session, details.url)) {
        applyHeaderModifications(headers, rule.response);
      }
    },
  });
}

/**
 * Registers the app shell session's listeners once, adding CORS headers only
 * @param {Electron.Session} session
 */
export function registerShellWebRequest(session) {
  registerListeners(session);
}
