import { SCRIPT_STATUS } from "../lib/constants";
import { create } from "zustand";

/** The state of the script run shown outside the Scripts dialog */
export default create((set) => ({
  /** The state of the current run */
  status: SCRIPT_STATUS.IDLE,
  /** The number of prompts waiting for an answer */
  waiting: 0,
  /** The title of the oldest waiting prompt */
  promptTitle: null,
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

/** The opener of the Scripts dialog */
export const selectSetDialogOpen = (state) => state.setDialogOpen;
