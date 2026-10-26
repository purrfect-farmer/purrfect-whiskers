import { SCRIPT_API, SCRIPT_HOST_MESSAGE } from "../shared/constants/ipc";

import { pathToFileURL } from "url";

/** The requests waiting for an answer from the app, by id */
const pending = new Map();

/** The id of the last request */
let lastRequestId = 0;

/** The abort of the run, signalled when the user stops it */
const abortController = new AbortController();

/** Sends a message to the main process */
const send = (message) => process.parentPort.postMessage(message);

/** A request to the app, resolving with its answer */
function request(method, ...args) {
  const id = ++lastRequestId;

  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    send({ type: SCRIPT_HOST_MESSAGE.REQUEST, id, method, args });
  });
}

/** The functions a script calls to ask the app for data or input */
const api = Object.freeze({
  getSession: (partition) => request(SCRIPT_API.GET_SESSION, partition),
  getBackup: (partition) => request(SCRIPT_API.GET_BACKUP, partition),
  getTags: () => request(SCRIPT_API.GET_TAGS),
  prompt: (prompt) => request(SCRIPT_API.PROMPT, prompt),
  confirm: async (title) =>
    (await request(SCRIPT_API.PROMPT, { title })) !== null,
  progress: (done, total) =>
    send({ type: SCRIPT_HOST_MESSAGE.PROGRESS, done, total }),
});

/** Runs the script with the selected accounts and options */
async function run({ scriptPath, accounts, options }) {
  try {
    /** The script module */
    const script = await import(pathToFileURL(scriptPath).href);

    await script.default({
      accounts,
      options,
      api,
      signal: abortController.signal,
    });

    send({ type: SCRIPT_HOST_MESSAGE.DONE });
  } catch (error) {
    send({
      type: SCRIPT_HOST_MESSAGE.ERROR,
      message: error?.message ?? String(error),
      stack: error?.stack ?? null,
    });
  }
}

/** The handler of each message from the main process */
process.parentPort.on("message", ({ data }) => {
  switch (data?.type) {
    case SCRIPT_HOST_MESSAGE.START:
      run(data);
      break;

    case SCRIPT_HOST_MESSAGE.RESPONSE: {
      const request = pending.get(data.id);

      if (!request) break;

      pending.delete(data.id);

      if (data.error) {
        request.reject(new Error(data.error));
      } else {
        request.resolve(data.result ?? null);
      }
      break;
    }

    case SCRIPT_HOST_MESSAGE.ABORT:
      abortController.abort();
      break;
  }
});
