/**
 * User-Agent per session
 * @type {WeakMap<Electron.Session, string>}
 */
const userAgents = new WeakMap();

/**
 * Sets the User-Agent of a session
 * @param {Electron.Session} session
 * @param {string} userAgent
 */
export function setUserAgent(session, userAgent) {
  userAgents.set(session, userAgent);
  session.setUserAgent(userAgent);
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
