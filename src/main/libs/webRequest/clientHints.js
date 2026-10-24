/** Chrome major version of the running Electron */
const ELECTRON_CHROME_VERSION = process.versions.chrome.split(".")[0];

/** The `Sec-Ch-Ua` brands of an Android WebView running the User-Agent's Chrome */
export function getSecChUa(userAgent) {
  const version =
    userAgent?.match(/Chrome\/(\d+)/)?.[1] || ELECTRON_CHROME_VERSION;

  return [
    `"Android WebView";v="${version}"`,
    `"Chromium";v="${version}"`,
    `"Not_A Brand";v="24"`,
  ].join(", ");
}
