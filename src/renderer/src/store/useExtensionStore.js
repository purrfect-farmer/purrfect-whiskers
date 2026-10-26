import { EXTENSION_UPDATE_STATUS } from "../lib/constants";
import { create } from "zustand";

/** Progress of the extension update, kept for the app's run */
export default create((set) => ({
  /** The update status */
  status: EXTENSION_UPDATE_STATUS.IDLE,
  /** The installed version */
  currentVersion: null,
  /** The latest version */
  latestVersion: null,
  /** The last update error */
  error: null,
  /** Merges changes into the update state */
  setUpdateState: (state) => set(state),
}));

/** Whether an update is checking or downloading */
export const selectIsUpdating = (state) =>
  state.status === EXTENSION_UPDATE_STATUS.CHECKING ||
  state.status === EXTENSION_UPDATE_STATUS.DOWNLOADING;
