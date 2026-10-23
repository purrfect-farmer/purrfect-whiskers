import { createMirrorServer } from "./libs/mirror";

let mirror = null;

/** Start Server */
export async function startMirrorServer() {
  mirror = await createMirrorServer();

  return mirror.addresses;
}

/** Close Server */
export async function stopMirrorServer() {
  if (mirror) {
    await mirror.io.close();
    mirror = null;
  }
}
