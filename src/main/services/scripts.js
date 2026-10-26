import { SCRIPT_CHANNEL, SCRIPT_EVENT } from "../../shared/constants/ipc";
import { app, dialog, shell, utilityProcess } from "electron";

import {
  exists,
  installScriptFromZip,
  isPlainName,
  resolveScript,
} from "../libs/scriptPackages";

import fs from "fs/promises";
import { once } from "events";
import path from "path";

export { listScripts } from "../libs/scriptPackages";

/** The process that runs a script */
const HOST_PATH = path.join(__dirname, "scriptHost.js");

/** How long a finished script process may linger before it is killed */
const EXIT_GRACE = 1_000;

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

  /** Starts a script with the profiles, sending its events to `receiver` */
  async start({ folder, name, profiles } = {}, receiver) {
    if (this.run) throw new Error("A script is already running");
    if (!Array.isArray(profiles)) throw new Error("Invalid profiles");

    const { scriptDir, entry } = await resolveScript(folder, name);

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
      result: null,
      ended: false,
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

    /** The kill of a finished script left running by open handles */
    let exitTimer = null;

    child.once("spawn", () =>
      child.postMessage({ scriptPath: entry, profiles }),
    );
    child.on("message", (message) => {
      run.result = message;
      exitTimer = setTimeout(() => child.kill(), EXIT_GRACE);
    });
    child.once("exit", async (code) => {
      clearTimeout(exitTimer);
      await outputClosed;

      this.end(run, run.result ?? { type: SCRIPT_EVENT.EXIT, code });
    });
  }

  /** The active run's name and output so far, re-attaching `receiver` */
  attach(receiver) {
    const run = this.run;

    if (!run) return null;

    run.receiver = receiver;

    return { name: run.name, output: run.output.join("") };
  }

  /** Keeps the latest output of a run, dropping the oldest past the limit */
  keepOutput(run, text) {
    run.output.push(text);
    run.outputSize += text.length;

    while (run.outputSize > MAX_KEPT_OUTPUT && run.output.length > 1) {
      run.outputSize -= run.output.shift().length;
    }
  }

  /** Stops the active run */
  stop() {
    const run = this.run;

    if (!run) return;

    this.end(run, { type: SCRIPT_EVENT.STOPPED });
    run.child.kill();
  }

  /** Reports the end of a run once and frees the runner */
  end(run, { type, ...payload }) {
    if (run.ended) return;

    run.ended = true;
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
