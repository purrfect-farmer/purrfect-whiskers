import { Conf } from "electron-conf/renderer";

/** Delay before a store write reaches the main process */
const WRITE_DELAY = 300;

/** The main process config store */
const conf = new Conf();

/** Latest unwritten value per store name */
const pendingWrites = new Map();
/** The timer of the pending flush */
let writeTimeout = null;

/** Writes every pending value now */
function flushWrites() {
  clearTimeout(writeTimeout);
  writeTimeout = null;

  for (const [name, value] of pendingWrites) {
    conf.set(name, value);
  }

  pendingWrites.clear();
}

/** Write pending values before the page unloads */
window.addEventListener("beforeunload", flushWrites);

/** Storage for persisted stores, batching rapid writes into one */
export const storage = {
  /** Reads a value, preferring an unwritten one */
  getItem: async (name) => {
    return pendingWrites.has(name) ? pendingWrites.get(name) : conf.get(name);
  },
  /** Queues a value for writing */
  setItem: async (name, value) => {
    pendingWrites.set(name, value);

    if (writeTimeout === null) {
      writeTimeout = setTimeout(flushWrites, WRITE_DELAY);
    }
  },
  /** Deletes a value and its unwritten one */
  removeItem: async (name) => {
    pendingWrites.delete(name);
    return conf.delete(name);
  },
};
