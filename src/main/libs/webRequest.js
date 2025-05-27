import setCookie from "set-cookie-parser";

/**
 * onBeforeSendHeaders
 * @param {Electron.Session} session
 * @returns
 */
export const onBeforeSendHeaders = (session) =>
  session.webRequest.onBeforeSendHeaders(
    { urls: ["<all_urls>"] },
    async (details, callback) => {
      const origin = new URL(details.url).origin;
      const requestHeaders = details.requestHeaders;
      requestHeaders["Origin"] = origin;
      requestHeaders["Referer"] = origin + "/";

      callback({ requestHeaders });
    }
  );

/**
 * onHeadersReceived
 * @param {Electron.Session} session
 * @returns
 */
export const onHeadersReceived = (session) =>
  session.webRequest.onHeadersReceived(
    { urls: ["<all_urls>"] },
    async (details, callback) => {
      const responseHeaders = Object.fromEntries(
        Object.entries(details.responseHeaders).filter(([key]) => {
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

      /** Set Access Control Headers */
      if (details.referrer) {
        responseHeaders["Access-Control-Allow-Origin"] = new URL(
          details.referrer
        ).origin;
        responseHeaders["Access-Control-Allow-Credentials"] = "true";
        responseHeaders["Access-Control-Allow-Methods"] = "*";
        responseHeaders["Access-Control-Allow-Headers"] = "*";
      }

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
          cookie.expirationDate = Math.floor(Date.now() / 1000) + parsed.maxAge;
        } else if (parsed.expires instanceof Date) {
          cookie.expirationDate = Math.floor(parsed.expires.getTime() / 1000);
        }

        /** If expired, then remove */
        if (
          cookie.expirationDate &&
          cookie.expirationDate < Date.now() / 1000
        ) {
          /** Remove Cookie */
          await session.cookies
            .remove(cookie.url, cookie.name)
            .catch(console.error);
        } else {
          /** Set Cookie */
          await session.cookies.set(cookie).catch(console.error);
        }
      }

      callback({ responseHeaders });
    }
  );
