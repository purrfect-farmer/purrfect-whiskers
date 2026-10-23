/** Response headers that block embedding or cross-origin access */
const STRIPPED_RESPONSE_HEADERS = new Set([
  "x-frame-options",
  "content-security-policy",
  "cross-origin-embedder-policy",
  "cross-origin-opener-policy",
  "cross-origin-resource-policy",
  "access-control-allow-origin",
  "access-control-allow-credentials",
  "access-control-allow-methods",
  "access-control-allow-headers",
]);

/**
 * Removes headers that block embedding or cross-origin access
 * @param {ReturnType<import("./headers").createHeaders>} headers
 */
export function stripBlockingHeaders(headers) {
  headers.deleteWhere((name) => STRIPPED_RESPONSE_HEADERS.has(name));
}

/**
 * Remembers each request's CORS headers until its response arrives,
 * then answers the response with permissive CORS headers.
 */
export function createCorsTracker() {
  /** @type {Map<number, {origin?: string, method?: string, headers?: string}>} */
  const requests = new Map();

  return {
    /**
     * @param {number} id
     * @param {ReturnType<import("./headers").createHeaders>} headers
     */
    remember(id, headers) {
      requests.set(id, {
        origin: headers.get("Origin"),
        method: headers.get("Access-Control-Request-Method"),
        headers: headers.get("Access-Control-Request-Headers"),
      });
    },

    /** @param {number} id */
    forget(id) {
      requests.delete(id);
    },

    /**
     * @param {Electron.OnHeadersReceivedListenerDetails} details
     * @param {ReturnType<import("./headers").createHeaders>} headers
     */
    apply(details, headers) {
      const request = requests.get(details.id);

      headers.set("Access-Control-Allow-Credentials", "true");
      headers.set("Access-Control-Allow-Headers", request?.headers || "*");
      headers.set("Access-Control-Allow-Origin", request?.origin || "*");
      headers.set("Access-Control-Allow-Methods", request?.method || "*");

      requests.delete(details.id);
    },
  };
}
