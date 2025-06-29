/**
 * registerWebRequest
 * @param {Electron.Session} session
 * @returns
 */
export const registerWebRequest = (session) => {
  const requestMap = new Map();

  /** onBeforeSendHeaders */
  session.webRequest.onBeforeSendHeaders(
    { urls: ["*://*/*"] },
    (details, callback) => {
      if (
        !details.url.startsWith("http://") &&
        !details.url.startsWith("https://")
      ) {
        return callback({ requestHeaders: details.requestHeaders });
      }

      const requestHeaders = details.requestHeaders || {};
      const whiskerOrigin = requestHeaders["x-whisker-origin"];

      if (whiskerOrigin) {
        delete requestHeaders["x-whisker-origin"];
        requestHeaders["Origin"] = whiskerOrigin;
        requestHeaders["Referer"] = whiskerOrigin + "/";
      }

      requestMap.set(details.id, {
        origin: requestHeaders["Origin"],
        method: requestHeaders["Access-Control-Request-Method"],
        headers: requestHeaders["Access-Control-Request-Headers"],
      });

      callback({ requestHeaders });
    }
  );

  /** onHeadersReceived */
  session.webRequest.onHeadersReceived(
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

      callback({ responseHeaders, statusLine });
    }
  );
};
