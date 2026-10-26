import Alert from "./Alert";
import AppDialogContent from "./AppDialogContent";
import Dropzone from "./Dropzone";
import { HiOutlinePuzzlePiece } from "react-icons/hi2";
import { IPC } from "../../../shared/constants/ipc";
import toast from "react-hot-toast";
import { ALERT_VARIANT, EXTENSION_UPDATE_STATUS } from "../lib/constants";
import useAppStore from "../store/useAppStore";
import useExtensionStore from "../store/useExtensionStore";
import useSettingsStore from "../store/useSettingsStore";

/** The file types the dropzone accepts */
const ZIP_FILES = { "application/zip": [".zip"] };

/** The handler for installing a dropped extension zip */
async function installExtension([file]) {
  if (!file) return;

  const { extensionPath, setAutoUpdateExtension } = useSettingsStore.getState();
  const { accounts, closeAllAccounts, setAccounts } = useAppStore.getState();

  setAutoUpdateExtension(false);
  closeAllAccounts();

  try {
    await window.electron.ipcRenderer.invoke(
      IPC.INSTALL_EXTENSION,
      window.electron.webUtils.getPathForFile(file),
      extensionPath,
    );

    /** Resets the installed version and update status */
    useExtensionStore.getState().setUpdateState({
      status: EXTENSION_UPDATE_STATUS.IDLE,
      currentVersion: null,
    });

    toast.success("Successfully Installed Extension!");
  } catch (error) {
    console.error("Failed to install extension:", error);
    toast.error("Failed to Install Extension!");
  } finally {
    setAccounts(accounts);
  }
}

/** A dialog for installing the extension from a zip file */
export default function LoaderDialog() {
  return (
    <AppDialogContent
      title={"Load Extension"}
      description={"Install the extension from a zip file"}
      icon={HiOutlinePuzzlePiece}
    >
      <Alert variant={ALERT_VARIANT.WARNING} className="text-center">
        You are about to install the extension manually. This will disable
        auto-updates and replace the currently installed version.
      </Alert>

      <Dropzone
        accept={ZIP_FILES}
        onDrop={installExtension}
        fileLabel="extension file"
      />
    </AppDialogContent>
  );
}
