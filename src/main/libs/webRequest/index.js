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

const URL_FILTER = { urls: ["*://*/*", "ws://*/*", "wss://*/*"] };
const WEB_URL_REGEX = /^(http|https|ws|wss):\/\//;

/** Headers a Telegram Android WebView sends */
const ANDROID_WEBVIEW_HEADERS = Object.freeze({
  "X-Requested-With": "org.telegram.messenger",
  "Sec-Ch-Ua-Mobile": "?1",
  "Sec-Ch-Ua-Platform": `"Android"`,
});

/** Sessions with listeners already registered */
const registeredSessions = new WeakSet();

/**
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
 * Registers the request and response listeners of a session once.
 * Rules and User-Agent are read per request, so later changes apply
 * without registering again.
 * @param {Electron.Session} session
 */
export function registerWebRequest(session) {
  if (registeredSessions.has(session)) return;

  registeredSessions.add(session);

  const cors = createCorsTracker();

  session.webRequest.onBeforeSendHeaders(URL_FILTER, (details, callback) => {
    const requestHeaders = details.requestHeaders || {};

    if (!WEB_URL_REGEX.test(details.url)) {
      return callback({ requestHeaders });
    }

    const headers = createHeaders(requestHeaders);

    applyAndroidWebviewHeaders(headers, getUserAgent(session));
    applyFrameReferer(headers, details.frame);
    applyUserAgent(session, headers);

    for (const rule of getMatchingRules(session, details.url)) {
      applyHeaderModifications(headers, rule.request);
    }

    cors.remember(details.id, headers);

    callback({ requestHeaders });
  });

  session.webRequest.onHeadersReceived(URL_FILTER, (details, callback) => {
    const responseHeaders = details.responseHeaders || {};

    if (!WEB_URL_REGEX.test(details.url)) {
      return callback({ responseHeaders });
    }

    const headers = createHeaders(responseHeaders);

    stripBlockingHeaders(headers);

    for (const rule of getMatchingRules(session, details.url)) {
      applyHeaderModifications(headers, rule.response);
    }

    cors.apply(details, headers);

    callback({
      responseHeaders,
      statusLine:
        details.method === "OPTIONS" ? "HTTP/1.1 200" : details.statusLine,
    });
  });

  /* Requests that never reach onHeadersReceived */
  session.webRequest.onCompleted(URL_FILTER, (details) => {
    cors.forget(details.id);
  });

  session.webRequest.onErrorOccurred(URL_FILTER, (details) => {
    cors.forget(details.id);
  });
}
