import { SCRIPT_STATUS } from "../lib/constants";
import { create } from "zustand";

/** The progress of a run before the script reports any */
export const NO_PROGRESS = Object.freeze({ done: 0, total: 0 });

/** The log of a run before any output */
const NO_LINES = [];

/** The state of the script run, read by each part of the UI that shows it */
export default create((set) => ({
  /** The state of the current run */
  status: SCRIPT_STATUS.IDLE,
  /** The message of the last failure */
  error: null,
  /** The script's status line, or null */
  statusText: null,
  /** The progress the script reported */
  progress: NO_PROGRESS,
  /** The folder name of the script whose output is shown, or null */
  runName: null,
  /** The time the current run started, or null */
  startedAt: null,
  /** The log lines, each with a stable id */
  lines: NO_LINES,
  /** The prompts waiting for an answer, oldest first */
  prompts: [],
  /** Whether the Scripts dialog is open */
  isDialogOpen: false,
  /** Merges changes into the run state */
  setRunState: (state) => set(state),
  /** Opens or closes the Scripts dialog */
  setDialogOpen: (isDialogOpen) => set({ isDialogOpen }),
}));

/** Whether a run is going or stopping */
export const selectIsRunning = (state) =>
  state.status === SCRIPT_STATUS.RUNNING ||
  state.status === SCRIPT_STATUS.STOPPING;

/** The oldest waiting prompt, or null */
export const selectPrompt = (state) => state.prompts[0] ?? null;

/** The number of waiting prompts */
export const selectWaiting = (state) => state.prompts.length;

/** The opener of the Scripts dialog */
export const selectSetDialogOpen = (state) => state.setDialogOpen;
