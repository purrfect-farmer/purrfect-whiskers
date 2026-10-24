/**
 * User-Agent per session
 * @type {WeakMap<Electron.Session, string>}
 */
const userAgents = new WeakMap();

/** Full Chrome version of the running Electron */
const ELECTRON_CHROME_FULL_VERSION = process.versions.chrome;

/**
 * The User-Agent naming the running Electron's Chrome version
 * @param {string} userAgent
 */
export function withEngineChromeVersion(userAgent) {
  return userAgent.replace(
    /Chrome\/[\d.]+/,
    `Chrome/${ELECTRON_CHROME_FULL_VERSION}`,
  );
}

/**
 * Sets the User-Agent of a session, naming the running Electron's Chrome version
 * @param {Electron.Session} session
 * @param {string} userAgent
 */
export function setUserAgent(session, userAgent) {
  const engineUserAgent = withEngineChromeVersion(userAgent);

  userAgents.set(session, engineUserAgent);
  session.setUserAgent(engineUserAgent);
}

/**
 * Gets the User-Agent of a session, or undefined when it has none
 * @param {Electron.Session} session
 */
export function getUserAgent(session) {
  return userAgents.get(session);
}

/** @param {Electron.Session} session */
export function clearUserAgent(session) {
  userAgents.delete(session);
}

/**
 * Replaces the request's User-Agent with the session's one
 * @param {Electron.Session} session
 * @param {ReturnType<import("./headers").createHeaders>} headers
 */
export function applyUserAgent(session, headers) {
  const userAgent = userAgents.get(session);

  if (userAgent && headers.get("User-Agent")) {
    headers.set("User-Agent", userAgent);
  }
}
