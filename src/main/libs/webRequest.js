import setCookie from "set-cookie-parser";

const map = new Map();
/**
 * onBeforeSendHeaders
 * @param {Electron.Session} session
 * @returns
 */
export const onBeforeSendHeaders = (session) => {
  return session.webRequest.onBeforeSendHeaders(
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
        if (details.frame?.parent) {
          requestHeaders["Origin"] = new URL(details.url).origin;
          requestHeaders["Referer"] = requestHeaders["Origin"] + "/";
        }
      } catch (e) {
        console.error(e);
      }

      callback({ requestHeaders });
    }
  );
};

/**
 * onHeadersReceived
 * @param {Electron.Session} session
 * @returns
 */
export const onHeadersReceived = (session) => {
  return session.webRequest.onHeadersReceived(
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
        responseHeaders["Access-Control-Allow-Origin"] = request?.origin || "*";

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
            cookie.expirationDate = Math.floor(parsed.expires.getTime() / 1000);
          }

          /** If expired, then remove */
          if (
            cookie.expirationDate &&
            cookie.expirationDate < Date.now() / 1000
          ) {
            /** Remove Cookie */
            session.cookies
              .remove(cookie.url, cookie.name)
              .catch(console.error);
          } else {
            /** Set Cookie */
            session.cookies.set(cookie).catch(console.error);
          }
        }
      } catch (e) {
        console.error(e);
      }

      callback({ responseHeaders, statusLine });
    }
  );
};
