import {
  SCRIPT_CHANNEL,
  SCRIPT_EVENT,
  SCRIPT_HOST_MESSAGE,
} from "../../shared/constants/ipc";
import { toCount, toResponse, toRunAccounts } from "../libs/scriptRuns";

import { ScriptRequests } from "./scriptRequests";
import { checkPathValues } from "../libs/scriptPaths";
import { once } from "events";
import path from "path";
import { resolveScript } from "../libs/scriptPackages";
import { utilityProcess } from "electron";
import { validateValues } from "../../shared/lib/scriptFields";

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
      displayName,
      options: fields,
    } = await resolveScript(folder, name);

    /** The options checked against the script's fields */
    const { values, errors } = validateValues(fields, options);

    /** The first invalid option */
    const firstError = Object.values(errors)[0];

    if (firstError) throw new Error(firstError);

    /** The first path option not found on disk */
    const pathError = await checkPathValues(fields, values);

    if (pathError) throw new Error(pathError);

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
      startedAt: Date.now(),
      displayName,
      child,
      receiver,
      partitions: new Set(runAccounts.map((account) => account.partition)),
      result: null,
      ended: false,
      stopping: false,
      exitTimer: null,
      killTimer: null,
      output: [],
      outputSize: 0,
    };

    run.requests = new ScriptRequests(run, (type, payload) =>
      this.emit(run, type, payload),
    );

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
        run.requests.forward(message);
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

  /** Answers a pending request of the active run */
  respond(payload) {
    const response = toResponse(payload);

    if (response) this.run?.requests.respond(response);
  }

  /** The active run's name, output and state, re-attached to `receiver` */
  attach(receiver) {
    const run = this.run;

    if (!run) return null;

    run.receiver = receiver;

    setImmediate(() => run.requests.resend());

    return {
      name: run.name,
      partitions: [...run.partitions],
      output: run.output.join(""),
      stopping: run.stopping,
      startedAt: run.startedAt,
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

  /** Stops the active run, killing it at once on a second stop */
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

    run.requests.closePrompts();

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
    run.requests.dispose();

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
