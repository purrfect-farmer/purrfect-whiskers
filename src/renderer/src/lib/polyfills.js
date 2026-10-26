import { Buffer } from "buffer";

/** Alias `window` to the global object where it is missing */
if (typeof window === "undefined") {
  globalThis.window = globalThis;
}

/** Expose Buffer globally */
globalThis.Buffer = Buffer;
