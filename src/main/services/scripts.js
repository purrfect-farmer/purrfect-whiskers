import {
  SCRIPT_API,
  SCRIPT_CHANNEL,
  SCRIPT_EVENT,
  SCRIPT_HOST_MESSAGE,
} from "../../shared/constants/ipc";
import { checkRequest, toCount, toRunAccounts } from "../libs/scriptRuns";
import { app, dialog, shell, utilityProcess } from "electron";

import {
  exists,
  installScriptFromZip,
  isPlainName,
  resolveScript,
} from "../libs/scriptPackages";

import fs from "fs/promises";
import { validateAnswer } from "../../shared/lib/scriptPrompts";
import { validateValues } from "../../shared/lib/scriptFields";
import { once } from "events";
import path from "path";

export { listScripts } from "../libs/scriptPackages";

/** The process that runs a script */
const HOST_PATH = path.join(__dirname, "scriptHost.js");

/** How long a finished script process may linger before it is killed */
const EXIT_GRACE = 1_000;

/** How long a stopped script may clean up before it is killed */
const STOP_GRACE = 5_000;

/** The longest wait for a script's output to close after it exits */
const OUTPUT_CLOSE_TIMEOUT = 2_000;

/** The most output a run keeps for a reloaded window, in characters */
const MAX_KEPT_OUTPUT = 1_000_000;

/** The name of the default scripts folder in the documents folder */
const DEFAULT_FOLDER_NAME = "Purrfect Whiskers Scripts";

/** The package file making the scripts ES modules */
const PACKAGE_JSON = `${JSON.stringify(
  { name: "purrfect-whiskers-scripts", private: true, type: "module" },
  null,
  2,
)}\n`;

/** The example script copied into a new default folder */
const EXAMPLE_SCRIPT_DIR = path
  .join(__dirname, "../../resources/example-script")
  .replace("app.asar", "app.asar.unpacked");

/** The default scripts folder, created with an example on first use */
export async function getDefaultScriptsFolder() {
  /** The default scripts folder */
  const folder = path.join(app.getPath("documents"), DEFAULT_FOLDER_NAME);

  if (!(await exists(folder))) {
    await fs.mkdir(folder, { recursive: true });
    await fs.writeFile(path.join(folder, "package.json"), PACKAGE_JSON);
    await fs.cp(EXAMPLE_SCRIPT_DIR, path.join(folder, "example"), {
      recursive: true,
    });
  }

  return folder;
}

/** Opens a folder picker for the scripts folder */
export function pickScriptsFolder(defaultPath) {
  return dialog.showOpenDialog({
    defaultPath: defaultPath || undefined,
    properties: ["openDirectory"],
  });
}

/** Opens the folder of the script `name` in the file manager */
export function openScriptFolder(folder, name) {
  if (typeof folder !== "string" || folder === "" || !isPlainName(name)) {
    throw new Error("Invalid script");
  }

  return shell.openPath(path.join(folder, name));
}

/** Opens a zip picker and installs the chosen script package into `folder` */
export async function installScript(folder) {
  const result = await dialog.showOpenDialog({
    filters: [{ name: "Script package", extensions: ["zip"] }],
    properties: ["openFile"],
  });

  if (result.canceled) return { canceled: true };

  return installScriptFromZip(folder, result.filePaths[0]);
}

/** A runner of one script at a time in its own process */
export class ScriptRunner {
  /** The active run */
  run = null;

  /** Starts a script on accounts with options, sending events to `receiver` */
  async start({ folder, name, accounts, options } = {}, receiver) {
    if (this.run) throw new Error("A script is already running");

    /** The accounts the script runs on */
    const runAccounts = toRunAccounts(accounts);

    const {
      scriptDir,
      entry,
      options: fields,
    } = await resolveScript(folder, name);

    /** The options checked against the script's fields */
    const { values, errors } = validateValues(fields, options);

    /** The first invalid option */
    const firstError = Object.values(errors)[0];

    if (firstError) throw new Error(firstError);

    /** The process running the script */
    const child = utilityProcess.fork(HOST_PATH, [], {
      cwd: scriptDir,
      stdio: "pipe",
      env: { ...process.env, FORCE_COLOR: "3" },
      serviceName: `Script: ${name}`,
    });

    /** The run of this script */
    const run = {
      name,
      child,
      receiver,
      partitions: new Set(runAccounts.map((account) => account.partition)),
      pending: new Map(),
      promptTimers: new Map(),
      result: null,
      ended: false,
      stopping: false,
      exitTimer: null,
      killTimer: null,
      output: [],
      outputSize: 0,
    };

    this.run = run;

    /** Keeps and sends the process output until the run ends */
    const forwardOutput = (text) => {
      if (run.ended) return;

      this.keepOutput(run, text);
      this.emit(run, SCRIPT_EVENT.OUTPUT, { text });
    };

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", forwardOutput);
    child.stderr.on("data", forwardOutput);

    /** The close of both output streams */
    const outputClosed = Promise.race([
      Promise.all([once(child.stdout, "end"), once(child.stderr, "end")]),
      new Promise((resolve) => setTimeout(resolve, OUTPUT_CLOSE_TIMEOUT)),
    ]);

    child.once("spawn", () =>
      child.postMessage({
        type: SCRIPT_HOST_MESSAGE.START,
        scriptPath: entry,
        accounts: runAccounts,
        options: values,
      }),
    );
    child.on("message", (message) => this.handleMessage(run, message));
    child.once("exit", async (code) => {
      clearTimeout(run.exitTimer);
      clearTimeout(run.killTimer);
      await outputClosed;

      this.end(
        run,
        run.stopping
          ? { type: SCRIPT_EVENT.STOPPED }
          : (run.result ?? { type: SCRIPT_EVENT.EXIT, code }),
      );
    });
  }

  /** Handles a message from a script's process */
  handleMessage(run, message) {
    switch (message?.type) {
      case SCRIPT_HOST_MESSAGE.REQUEST:
        this.forwardRequest(run, message);
        break;

      case SCRIPT_HOST_MESSAGE.PROGRESS:
        this.emit(run, SCRIPT_EVENT.PROGRESS, {
          done: toCount(message.done),
          total: toCount(message.total),
        });
        break;

      case SCRIPT_HOST_MESSAGE.DONE:
        this.finish(run, { type: SCRIPT_EVENT.DONE });
        break;

      case SCRIPT_HOST_MESSAGE.ERROR:
        this.finish(run, {
          type: SCRIPT_EVENT.ERROR,
          message: String(message.message),
          stack: message.stack ? String(message.stack) : null,
        });
        break;
    }
  }

  /** Keeps a script's result and lets its process exit or be killed */
  finish(run, result) {
    run.result = result;
    run.exitTimer = setTimeout(() => run.child.kill(), EXIT_GRACE);
  }

  /** Sends a script's request to the renderer, or answers it with an error */
  forwardRequest(run, message) {
    if (!Number.isInteger(message.id)) return;

    const { request, error } = checkRequest(message, run.partitions);

    if (error) {
      this.reply(run, message.id, { error });
      return;
    }

    if (run.stopping && request.method === SCRIPT_API.PROMPT) {
      this.reply(run, request.id, { result: null });
      return;
    }

    run.pending.set(request.id, request);
    this.emit(run, SCRIPT_EVENT.REQUEST, request);

    if (request.expiresAt) {
      run.promptTimers.set(
        request.id,
        setTimeout(
          () => this.closePrompt(run, request.id),
          request.expiresAt - Date.now(),
        ),
      );
    }
  }

  /** Closes an open prompt with no answer */
  closePrompt(run, id) {
    clearTimeout(run.promptTimers.get(id));
    run.promptTimers.delete(id);

    if (!run.pending.delete(id)) return;

    this.reply(run, id, { result: null });
    this.emit(run, SCRIPT_EVENT.PROMPT_CLOSED, { id });
  }

  /** Answers a pending request with the renderer's result or error */
  respond(id, { result, error } = {}) {
    const run = this.run;
    const request = run?.pending.get(id);

    if (!request) return;

    run.pending.delete(id);
    clearTimeout(run.promptTimers.get(id));
    run.promptTimers.delete(id);

    if (error) {
      this.reply(run, id, { error: String(error) });
    } else if (request.method === SCRIPT_API.PROMPT && result !== null) {
      this.replyToPrompt(run, request, result);
    } else {
      this.reply(run, id, { result: result ?? null });
    }
  }

  /** Answers a prompt with its validated answer, or an error when invalid */
  replyToPrompt(run, request, answer) {
    this.reply(run, request.id, validateAnswer(request.args[0], answer));
  }

  /** Posts the answer of a request to the script's process */
  reply(run, id, payload) {
    if (!run.ended) {
      run.child.postMessage({
        type: SCRIPT_HOST_MESSAGE.RESPONSE,
        id,
        ...payload,
      });
    }
  }

  /**
   * The active run's name, output and state, re-attaching `receiver`.
   * Pending requests are sent to it again once it has the state.
   */
  attach(receiver) {
    const run = this.run;

    if (!run) return null;

    run.receiver = receiver;

    setImmediate(() => {
      for (const request of run.pending.values()) {
        this.emit(run, SCRIPT_EVENT.REQUEST, request);
      }
    });

    return {
      name: run.name,
      partitions: [...run.partitions],
      output: run.output.join(""),
      stopping: run.stopping,
    };
  }

  /** Keeps the latest output of a run, dropping the oldest past the limit */
  keepOutput(run, text) {
    run.output.push(text);
    run.outputSize += text.length;

    while (run.outputSize > MAX_KEPT_OUTPUT && run.output.length > 1) {
      run.outputSize -= run.output.shift().length;
    }
  }

  /**
   * Stops the active run: first by signalling the script and killing it
   * after a grace period, then at once on a second stop
   */
  stop() {
    const run = this.run;

    if (!run) return;

    if (run.stopping) {
      this.end(run, { type: SCRIPT_EVENT.STOPPED });
      run.child.kill();
      return;
    }

    run.stopping = true;
    run.child.postMessage({ type: SCRIPT_HOST_MESSAGE.ABORT });

    for (const request of run.pending.values()) {
      if (request.method === SCRIPT_API.PROMPT) {
        this.closePrompt(run, request.id);
      }
    }

    this.emit(run, SCRIPT_EVENT.STOPPING);

    run.killTimer = setTimeout(() => {
      this.end(run, { type: SCRIPT_EVENT.STOPPED });
      run.child.kill();
    }, STOP_GRACE);
  }

  /** Reports the end of a run once and frees the runner */
  end(run, { type, ...payload }) {
    if (run.ended) return;

    run.ended = true;
    run.pending.clear();

    for (const timer of run.promptTimers.values()) clearTimeout(timer);

    this.emit(run, type, payload);

    if (this.run === run) this.run = null;
  }

  /** Sends a run event to the renderer that started it */
  emit(run, type, payload = {}) {
    if (!run.receiver.isDestroyed()) {
      run.receiver.send(SCRIPT_CHANNEL, { type, ...payload });
    }
  }
}
