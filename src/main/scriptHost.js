import { SCRIPT_EVENT } from "../shared/constants/ipc";
import { pathToFileURL } from "url";

/** Runs the script sent by the main process with its profiles */
process.parentPort.once("message", async ({ data }) => {
  const { scriptPath, profiles } = data;

  try {
    /** The script module */
    const script = await import(pathToFileURL(scriptPath).href);

    await script.default({ profiles });

    process.parentPort.postMessage({ type: SCRIPT_EVENT.DONE });
  } catch (error) {
    process.parentPort.postMessage({
      type: SCRIPT_EVENT.ERROR,
      message: error?.message ?? String(error),
      stack: error?.stack ?? null,
    });
  }
});
