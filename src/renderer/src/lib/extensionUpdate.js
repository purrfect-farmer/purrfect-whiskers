import { EXTENSION_UPDATE_STATUS } from "./constants";
import ExtensionUpdatedToast from "../components/ExtensionUpdatedToast";
import { IPC } from "../../../shared/constants/ipc";
import { createElement } from "react";
import toast from "react-hot-toast";
import useExtensionStore, {
  selectIsUpdating,
} from "../store/useExtensionStore";
import useSettingsStore from "../store/useSettingsStore";

/** How long the updated toast stays */
const UPDATED_TOAST_DURATION = 30_000;

/** Invoke a main process handler */
const invoke = (channel, ...args) =>
  window.electron.ipcRenderer.invoke(channel, ...args);

const setUpdateState = (state) =>
  useExtensionStore.getState().setUpdateState(state);

/** Download the latest extension and record its version */
async function downloadExtension(extensionPath) {
  setUpdateState({ status: EXTENSION_UPDATE_STATUS.DOWNLOADING });

  const { version } = await invoke(IPC.INSTALL_LATEST_EXTENSION, extensionPath);

  setUpdateState({
    status: EXTENSION_UPDATE_STATUS.UPDATED,
    currentVersion: version,
  });

  return version;
}

/** Install the latest extension without toasts, resolving whether it worked */
export async function installLatestExtension(extensionPath) {
  try {
    await downloadExtension(extensionPath);
    return true;
  } catch (error) {
    console.error("Failed to install extension:", error);
    setUpdateState({
      status: EXTENSION_UPDATE_STATUS.FAILED,
      error: error.message,
    });
    return false;
  }
}

/**
 * Check for a newer extension and install it, or reinstall the latest one
 * when `force` is set. `silent` hides the up-to-date toast.
 * Resolves whether it finished without an error.
 */
export async function updateExtension({ force = false, silent = false } = {}) {
  if (selectIsUpdating(useExtensionStore.getState())) return false;

  const { extensionPath } = useSettingsStore.getState();
  const toastId = `extension-update-${Date.now()}`;

  try {
    setUpdateState({ status: EXTENSION_UPDATE_STATUS.CHECKING, error: null });

    const { currentVersion, latestVersion, isOutdated } = await invoke(
      IPC.CHECK_EXTENSION_UPDATE,
      extensionPath,
    );

    setUpdateState({ currentVersion, latestVersion });

    if (isOutdated || force) {
      toast.loading("Updating extension...", { id: toastId });

      const version = await downloadExtension(extensionPath);

      toast.success(
        (t) => createElement(ExtensionUpdatedToast, { id: t.id, version }),
        { id: toastId, duration: UPDATED_TOAST_DURATION },
      );
    } else {
      setUpdateState({ status: EXTENSION_UPDATE_STATUS.UP_TO_DATE });

      if (!silent) toast.success("Extension is up to date");
    }

    return true;
  } catch (error) {
    console.error("Failed to update extension:", error);
    setUpdateState({
      status: EXTENSION_UPDATE_STATUS.FAILED,
      error: error.message,
    });
    toast.error("Failed to update extension", { id: toastId });

    return false;
  }
}
