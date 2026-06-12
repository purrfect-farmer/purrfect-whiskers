import { app } from "electron";
import { getRandomDevice } from "../../shared/lib/ua";

/**
 * User Agent Map
 * @type {Map<Electron.Session, string>}
 */
const userAgentMap = new Map();

/**
 * Sets the user agent for a given session
 * @param {Electron.Session} session
 * @param {string} userAgent
 */
export const setUserAgent = (session, userAgent) => {
  if (userAgent) {
    userAgentMap.set(session, userAgent);
  } else {
    userAgentMap.delete(session);
  }
};

/**
 * registerWebRequest
 * @param {Electron.Session} session
 * @param {chrome.declarativeNetRequest.Rule[]} rules
 * @returns
 */
export const registerWebRequest = (session, rules = []) => {
  const requestMap = new Map();

  /** onBeforeSendHeaders */
  session.webRequest.onBeforeSendHeaders(
    { urls: ["*://*/*", "ws://*/*", "wss://*/*"] },
    (details, callback) => {
      if (!/^(http|https|ws|wss):\/\//.test(details.url)) {
        return callback({ requestHeaders: details.requestHeaders });
      }

      /* Get Request Headers */
      const requestHeaders = details.requestHeaders || {};

      /** Get Request Header */
      const getRequestHeader = (key) => {
        for (const headerKey in requestHeaders) {
          if (key.toLowerCase() === headerKey.toLowerCase()) {
            return requestHeaders[headerKey];
          }
        }
        return null;
      };

      /** Set Header */
      const setRequestHeader = (key, value) => {
        for (const headerKey in requestHeaders) {
          if (key.toLowerCase() === headerKey.toLowerCase()) {
            requestHeaders[headerKey] = value;
            return;
          }
        }
        requestHeaders[key] = value;
      };

      /** Delete Header */
      const deleteRequestHeader = (key) => {
        for (const headerKey in requestHeaders) {
          if (key.toLowerCase() === headerKey.toLowerCase()) {
            delete requestHeaders[headerKey];
            return;
          }
        }
      };

      /* Remove Sec-Fetch-Headers */
      for (const headerKey in requestHeaders) {
        if (headerKey.toLowerCase().startsWith("sec-fetch-")) {
          delete requestHeaders[headerKey];
        }
      }

      /* Set X-Requested-With */
      setRequestHeader("X-Requested-With", "org.telegram.messenger");

      /* Set Sec-Ch-Ua */
      const chromeVersion = process.versions.chrome.split(".")[0];
      setRequestHeader(
        "Sec-Ch-Ua",
        `"Android WebView";v="${chromeVersion}", "Chromium";v="${chromeVersion}", "Not)A;Brand";v="24"`,
      );
      setRequestHeader("Sec-Ch-Ua-Mobile", `?1`);
      setRequestHeader("Sec-Ch-Ua-Platform", `"Android"`);

      const frame = details.frame;

      if (frame && frame.parent) {
        const frameUrl = frame?.url;
        if (frameUrl) {
          const refererUrl = new URL(frameUrl);
          /** Set Referer */
          setRequestHeader("Referer", refererUrl.origin);
        } else {
          deleteRequestHeader("Referer");
        }
      }

      /* Modify user-agent */
      if (getRequestHeader("User-Agent")) {
        const userAgent = userAgentMap.get(session);

        if (userAgent) {
          setRequestHeader("User-Agent", userAgent);
        } else {
          const { androidVersion, device, quality, telegramVersion } =
            getRandomDevice();
          const versionPattern = "/\\d+\\.\\d+\\.\\d+\\s*";
          const appRegex = new RegExp(app.name + versionPattern);
          const electronRegex = new RegExp("Electron" + versionPattern);

          let replacedUserAgent = getRequestHeader("User-Agent")
            .replace(appRegex, "")
            .replace(electronRegex, "")
            .trim();

          /** Add Android */
          if (!replacedUserAgent.includes("Android")) {
            const platformRegex = new RegExp("\\([^)]+\\) AppleWebKit");
            replacedUserAgent = replacedUserAgent.replace(
              platformRegex,
              `(Linux; Android ${androidVersion.version}; K) AppleWebKit`,
            );
          }

          /** Add Mobile Safari */
          if (!replacedUserAgent.includes("Mobile Safari")) {
            replacedUserAgent = replacedUserAgent.replace(
              "Safari",
              "Mobile Safari",
            );
          }

          /** Add Telegram-Android */
          if (!replacedUserAgent.includes("Telegram-Android")) {
            replacedUserAgent = `${replacedUserAgent} Telegram-Android/${telegramVersion} (${device.name}; Android ${androidVersion.version}; SDK ${androidVersion.sdk}; ${quality})`;
          }

          setRequestHeader("User-Agent", replacedUserAgent);
          setUserAgent(session, replacedUserAgent);
        }
      }

      /* Modify Headers */
      for (const rule of rules) {
        if (
          rule.condition.requestDomains.includes(new URL(details.url).hostname)
        ) {
          for (const headerModification of rule.action.requestHeaders || []) {
            if (headerModification.operation === "set") {
              requestHeaders[headerModification.header] =
                headerModification.value;
            } else if (headerModification.operation === "remove") {
              delete requestHeaders[headerModification.header];
            }
          }
        }
      }

      /* Save Request Info */
      requestMap.set(details.id, {
        origin: requestHeaders["Origin"],
        method: requestHeaders["Access-Control-Request-Method"],
        headers: requestHeaders["Access-Control-Request-Headers"],
      });

      /* Return Headers */
      callback({ requestHeaders });
    },
  );

  /** onHeadersReceived */
  session.webRequest.onHeadersReceived(
    { urls: ["*://*/*", "ws://*/*", "wss://*/*"] },
    (details, callback) => {
      if (!/^(http|https|ws|wss):\/\//.test(details.url)) {
        return callback({ responseHeaders: details.responseHeaders });
      }

      /* Get Status Line */
      let statusLine = details.statusLine;

      /* Get Response Headers */
      const responseHeaders = Object.fromEntries(
        Object.entries(details.responseHeaders || {}).filter(([key]) => {
          return ![
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
        }),
      );

      /* Modify Headers */
      for (const rule of rules) {
        if (
          rule.condition.requestDomains.includes(new URL(details.url).hostname)
        ) {
          for (const headerModification of rule.action.responseHeaders || []) {
            if (headerModification.operation === "set") {
              responseHeaders[headerModification.header] =
                headerModification.value;
            } else if (headerModification.operation === "remove") {
              delete responseHeaders[headerModification.header];
            }
          }
        }
      }

      try {
        if (details.method === "OPTIONS") {
          /** Set Status Code */
          statusLine = "HTTP/1.1 200";
        }

        /** Get Request */
        const request = requestMap.get(details.id);

        /** Credentials */
        responseHeaders["Access-Control-Allow-Credentials"] = "true";

        /** Headers */
        responseHeaders["Access-Control-Allow-Headers"] =
          request?.headers || "*";

        /** Origin */
        responseHeaders["Access-Control-Allow-Origin"] = request?.origin || "*";

        /** Methods */
        responseHeaders["Access-Control-Allow-Methods"] =
          request?.method || "*";
      } catch (e) {
        console.error(e);
      }

      /* Delete Request Info */
      requestMap.delete(details.id);

      /* Return Headers */
      callback({ responseHeaders, statusLine });
    },
  );
};
