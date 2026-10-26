import useExtensionStore, {
  selectIsUpdating,
} from "../store/useExtensionStore";
import { EXTENSION_UPDATE_STATUS } from "../lib/constants";
import { HiArrowPath } from "react-icons/hi2";
import { IPC } from "../../../shared/constants/ipc";
import { cn } from "../lib/utils";
import { memo, useCallback, useEffect } from "react";
import { updateExtension } from "../lib/extensionUpdate";
import { useShallow } from "zustand/react/shallow";

/** The text of each update status */
const STATUS_TEXT = {
  [EXTENSION_UPDATE_STATUS.IDLE]: "Not checked yet",
  [EXTENSION_UPDATE_STATUS.CHECKING]: "Checking for updates...",
  [EXTENSION_UPDATE_STATUS.DOWNLOADING]: "Downloading update...",
  [EXTENSION_UPDATE_STATUS.UP_TO_DATE]: "Up to date",
  [EXTENSION_UPDATE_STATUS.UPDATED]: "Updated, reload accounts to use it",
  [EXTENSION_UPDATE_STATUS.FAILED]: "Update failed",
};

/** The classes of an action button */
const BUTTON_CLASS_NAME = cn(
  "grow px-4 py-2 rounded-xl font-bold",
  "bg-neutral-100 dark:bg-neutral-700",
  "hover:bg-orange-100 hover:text-orange-700",
  "dark:hover:bg-orange-200 dark:hover:text-orange-500",
  "disabled:opacity-50 disabled:cursor-not-allowed",
);

/** The handler for checking for and installing an update */
const checkAndUpdate = () => updateExtension();
/** The handler for reinstalling the extension */
const reinstall = () => updateExtension({ force: true });

/**
 * A section with the installed and latest extension versions,
 * and update and reinstall buttons
 */
export default memo(function ExtensionUpdateSection({ extensionPath }) {
  const { status, currentVersion, latestVersion, error, setUpdateState } =
    useExtensionStore(useShallow((state) => state));
  /** Whether an update is running */
  const isUpdating = useExtensionStore(selectIsUpdating);

  /** Reads the installed version when it's not known yet */
  useEffect(() => {
    if (currentVersion || !extensionPath) return;

    window.electron.ipcRenderer
      .invoke(IPC.GET_EXTENSION_VERSION, extensionPath)
      .then((version) => setUpdateState({ currentVersion: version }));
  }, [currentVersion, extensionPath, setUpdateState]);

  /** The text of the update status */
  const statusText =
    status === EXTENSION_UPDATE_STATUS.FAILED && error
      ? `${STATUS_TEXT[status]}: ${error}`
      : STATUS_TEXT[status];

  return (
    <div className="flex flex-col gap-2 min-w-0">
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1">
        <dt className="text-neutral-500 dark:text-neutral-400">Installed</dt>
        <dd className="min-w-0 break-words">{currentVersion || "None"}</dd>
        <dt className="text-neutral-500 dark:text-neutral-400">Latest</dt>
        <dd className="min-w-0 break-words">{latestVersion || "Unknown"}</dd>
      </dl>

      <p
        role="status"
        className={cn(
          "flex items-center gap-2 min-w-0 break-words",
          status === EXTENSION_UPDATE_STATUS.FAILED
            ? "text-red-500"
            : "text-neutral-500 dark:text-neutral-400",
        )}
      >
        {isUpdating ? (
          <HiArrowPath className="shrink-0 size-4 animate-spin text-orange-500" />
        ) : null}
        <span className="min-w-0">{statusText}</span>
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={checkAndUpdate}
          disabled={isUpdating}
          className={BUTTON_CLASS_NAME}
        >
          Update now
        </button>
        <button
          type="button"
          onClick={reinstall}
          disabled={isUpdating}
          className={BUTTON_CLASS_NAME}
        >
          Reinstall
        </button>
      </div>
    </div>
  );
});
