/** Header operations of `chrome.declarativeNetRequest` rules */
const HEADER_OPERATION = Object.freeze({
  SET: "set",
  REMOVE: "remove",
});

/**
 * Compiled rules per session: domain → header modifications
 * @type {WeakMap<Electron.Session, Map<string, {request: Array, response: Array}>>}
 */
const sessionRules = new WeakMap();

/**
 * Indexes rules by request domain.
 * Rules without `requestDomains` are skipped.
 * @param {chrome.declarativeNetRequest.Rule[]} rules
 */
function compileRules(rules) {
  const compiled = new Map();

  for (const rule of rules || []) {
    const domains = rule?.condition?.requestDomains || [];

    for (const domain of domains) {
      const entry = compiled.get(domain) || { request: [], response: [] };

      entry.request.push(...(rule.action?.requestHeaders || []));
      entry.response.push(...(rule.action?.responseHeaders || []));
      compiled.set(domain, entry);
    }
  }

  return compiled;
}

/**
 * Stores the rules of a session
 * @param {Electron.Session} session
 * @param {chrome.declarativeNetRequest.Rule[]} rules
 */
export function setSessionRules(session, rules) {
  sessionRules.set(session, compileRules(rules));
}

/** @param {Electron.Session} session */
export function clearSessionRules(session) {
  sessionRules.delete(session);
}

/**
 * Collects the rule entries matching a hostname or any of its parent
 * domains, the way `requestDomains` matches.
 * @param {Electron.Session} session
 * @param {string} url
 */
export function getMatchingRules(session, url) {
  const compiled = sessionRules.get(session);

  if (!compiled?.size) return [];

  let domain;

  try {
    domain = new URL(url).hostname;
  } catch {
    return [];
  }

  const matches = [];

  while (domain) {
    const entry = compiled.get(domain);

    if (entry) matches.push(entry);

    const dotIndex = domain.indexOf(".");
    domain = dotIndex === -1 ? "" : domain.slice(dotIndex + 1);
  }

  return matches;
}

/**
 * Applies header modifications to a header view
 * @param {ReturnType<import("./headers").createHeaders>} headers
 * @param {chrome.declarativeNetRequest.ModifyHeaderInfo[]} modifications
 */
export function applyHeaderModifications(headers, modifications) {
  for (const { operation, header, value } of modifications) {
    if (operation === HEADER_OPERATION.SET) {
      headers.set(header, value);
    } else if (operation === HEADER_OPERATION.REMOVE) {
      headers.delete(header);
    }
  }
}
