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
 * The header modifications of rules, indexed by request domain
 * @param {chrome.declarativeNetRequest.Rule[]} rules
 */
function compileRules(rules) {
  /** The header modifications of each domain */
  const compiled = new Map();

  for (const rule of rules || []) {
    /** The domains the rule applies to */
    const domains = rule?.condition?.requestDomains || [];

    for (const domain of domains) {
      /** The header modifications of the domain */
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

/**
 * Forgets the rules of a session
 * @param {Electron.Session} session
 */
export function clearSessionRules(session) {
  sessionRules.delete(session);
}

/**
 * The rule entries of a URL's hostname and its parent domains
 * @param {Electron.Session} session
 * @param {string} url
 */
export function getMatchingRules(session, url) {
  /** The compiled rules of the session */
  const compiled = sessionRules.get(session);

  if (!compiled?.size) return [];

  let domain;

  try {
    domain = new URL(url).hostname;
  } catch {
    return [];
  }

  /** The matching rule entries */
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
