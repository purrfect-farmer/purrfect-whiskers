import { app } from "electron";
import { withChromeVersion } from "../../../shared/lib/userAgent";

/** Whether the User-Agent is also set on the session itself */
const SET_USER_AGENT_ON_SESSION = false;

/**
 * User-Agent per session
 * @type {WeakMap<Electron.Session, string>}
 */
const userAgents = new WeakMap();

/**
 * The User-Agent without the app's and Electron's own tokens, as Chrome sends it
 * @param {string} userAgent
 */
export function toBrowserUserAgent(userAgent) {
  return userAgent
    .replace(/(\(KHTML, like Gecko\))\s.*?(?=\sChrome\/)/, "$1")
    .replace(/\sElectron\/\S+/g, "");
}

/** Make sessions without an account User-Agent send a plain Chrome one */
export function applyBrowserUserAgentFallback() {
  app.userAgentFallback = toBrowserUserAgent(app.userAgentFallback);
}

/**
 * The User-Agent naming the running Electron's Chrome version
 * @param {string} userAgent
 */
export function withEngineChromeVersion(userAgent) {
  return withChromeVersion(userAgent, process.versions.chrome);
}

/**
 * Sets the User-Agent of a session, naming the running Electron's Chrome version
 * @param {Electron.Session} session
 * @param {string} userAgent
 */
export function setUserAgent(session, userAgent) {
  /** The User-Agent naming the running Chrome version */
  const engineUserAgent = withEngineChromeVersion(userAgent);

  userAgents.set(session, engineUserAgent);

  if (SET_USER_AGENT_ON_SESSION) {
    session.setUserAgent(engineUserAgent);
  }
}

/**
 * Gets the User-Agent of a session, or undefined when it has none
 * @param {Electron.Session} session
 */
export function getUserAgent(session) {
  return userAgents.get(session);
}

/**
 * Puts a session back on the plain Chrome User-Agent
 * @param {Electron.Session} session
 */
export function clearUserAgent(session) {
  userAgents.delete(session);
  if (SET_USER_AGENT_ON_SESSION) {
    session.setUserAgent(app.userAgentFallback);
  }
}

/**
 * Replaces the request's User-Agent with the session's one
 * @param {Electron.Session} session
 * @param {ReturnType<import("./headers").createHeaders>} headers
 */
export function applyUserAgent(session, headers) {
  /** The User-Agent of the session */
  const userAgent = userAgents.get(session);

  if (userAgent && headers.get("User-Agent")) {
    headers.set("User-Agent", userAgent);
  }
}
