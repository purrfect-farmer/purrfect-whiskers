import { createMirrorServer } from "./libs/mirror";

/** The running mirror server, or null */
let mirror = null;

/** Starts the mirror server, resolving with its addresses */
export async function startMirrorServer() {
  mirror = await createMirrorServer();

  return mirror.addresses;
}

/** Closes the mirror server */
export async function stopMirrorServer() {
  if (mirror) {
    await mirror.io.close();
    mirror = null;
  }
}
