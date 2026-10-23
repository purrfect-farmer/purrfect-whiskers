/**
 * Case-insensitive view over a headers object.
 * Keys are indexed once, and every change writes through to `headers`.
 * @param {Record<string, string | string[]>} headers
 */
export function createHeaders(headers) {
  /** Lower-cased name → actual key */
  const keys = new Map();

  for (const key of Object.keys(headers)) {
    keys.set(key.toLowerCase(), key);
  }

  return {
    get(name) {
      const key = keys.get(name.toLowerCase());
      return key === undefined ? null : headers[key];
    },

    set(name, value) {
      const lowerName = name.toLowerCase();
      const key = keys.get(lowerName) ?? name;

      headers[key] = value;
      keys.set(lowerName, key);
    },

    delete(name) {
      const lowerName = name.toLowerCase();
      const key = keys.get(lowerName);

      if (key !== undefined) {
        delete headers[key];
        keys.delete(lowerName);
      }
    },

    /** Deletes every header whose lower-cased name passes `predicate` */
    deleteWhere(predicate) {
      for (const [lowerName, key] of keys) {
        if (predicate(lowerName)) {
          delete headers[key];
          keys.delete(lowerName);
        }
      }
    },
  };
}
