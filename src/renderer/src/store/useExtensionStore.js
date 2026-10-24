import { EXTENSION_UPDATE_STATUS } from "../lib/constants";
import { create } from "zustand";

/** Progress of the extension update, kept for the app's run */
export default create((set) => ({
  status: EXTENSION_UPDATE_STATUS.IDLE,
  currentVersion: null,
  latestVersion: null,
  error: null,
  setUpdateState: (state) => set(state),
}));

/** Whether an update is checking or downloading */
export const selectIsUpdating = (state) =>
  state.status === EXTENSION_UPDATE_STATUS.CHECKING ||
  state.status === EXTENSION_UPDATE_STATUS.DOWNLOADING;
