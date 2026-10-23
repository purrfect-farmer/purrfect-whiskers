import { Conf } from "electron-conf/renderer";

/** Delay before a store write reaches the main process */
const WRITE_DELAY = 300;

const conf = new Conf();

/** Latest unwritten value per store name */
const pendingWrites = new Map();
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

window.addEventListener("beforeunload", flushWrites);

/** Storage for persisted stores, batching rapid writes into one */
export const storage = {
  getItem: async (name) => {
    return pendingWrites.has(name) ? pendingWrites.get(name) : conf.get(name);
  },
  setItem: async (name, value) => {
    pendingWrites.set(name, value);

    if (writeTimeout === null) {
      writeTimeout = setTimeout(flushWrites, WRITE_DELAY);
    }
  },
  removeItem: async (name) => {
    pendingWrites.delete(name);
    return conf.delete(name);
  },
};
