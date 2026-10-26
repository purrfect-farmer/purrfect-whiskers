import useExtensionStore, {
  selectIsUpdating,
} from "../store/useExtensionStore";
import { BADGE_TONE, EXTENSION_UPDATE_STATUS } from "../lib/constants";
import { HiArrowPath } from "react-icons/hi2";
import SectionBadge from "./SectionBadge";
import { IPC } from "../../../shared/constants/ipc";
import { cn } from "../lib/utils";
import { memo, useCallback, useEffect } from "react";
import { updateExtension } from "../lib/extensionUpdate";
import { useShallow } from "zustand/react/shallow";

/** The text and badge tone of each update status */
const STATUS_BADGES = {
  [EXTENSION_UPDATE_STATUS.IDLE]: {
    text: "Not checked yet",
    tone: BADGE_TONE.NEUTRAL,
  },
  [EXTENSION_UPDATE_STATUS.CHECKING]: {
    text: "Checking",
    tone: BADGE_TONE.PURPLE,
  },
  [EXTENSION_UPDATE_STATUS.DOWNLOADING]: {
    text: "Downloading",
    tone: BADGE_TONE.PURPLE,
  },
  [EXTENSION_UPDATE_STATUS.UP_TO_DATE]: {
    text: "Up to date",
    tone: BADGE_TONE.GREEN,
  },
  [EXTENSION_UPDATE_STATUS.UPDATED]: {
    text: "Updated, reload accounts to use it",
    tone: BADGE_TONE.BLUE,
  },
  [EXTENSION_UPDATE_STATUS.FAILED]: {
    text: "Update failed",
    tone: BADGE_TONE.RED,
  },
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

  /** The badge of the update status */
  const badge = STATUS_BADGES[status];

  return (
    <div className="flex flex-col gap-2 min-w-0">
      <div className="flex flex-wrap items-center gap-2 min-w-0">
        <SectionBadge tone={BADGE_TONE.NEUTRAL}>
          Installed {currentVersion || "none"}
        </SectionBadge>
        <SectionBadge tone={BADGE_TONE.NEUTRAL}>
          Latest {latestVersion || "unknown"}
        </SectionBadge>
        <span role="status" className="flex items-center gap-1 min-w-0">
          {isUpdating ? (
            <HiArrowPath
              className={cn("shrink-0 size-4", "animate-spin text-orange-500")}
            />
          ) : null}
          <SectionBadge tone={badge.tone}>{badge.text}</SectionBadge>
        </span>
      </div>

      {status === EXTENSION_UPDATE_STATUS.FAILED && error ? (
        <p className="min-w-0 break-words text-red-500">{error}</p>
      ) : null}

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
