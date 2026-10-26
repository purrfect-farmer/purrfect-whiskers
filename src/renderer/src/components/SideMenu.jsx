import {
  HiOutlineArrowPath,
  HiOutlineArrowsPointingOut,
  HiOutlineBars3,
  HiOutlineCog6Tooth,
  HiOutlinePuzzlePiece,
} from "react-icons/hi2";
import {
  LuArrowUpDown,
  LuDatabaseBackup,
  LuEraser,
  LuGlobeLock,
  LuListChecks,
  LuSquareTerminal,
  LuTags,
} from "react-icons/lu";

import AccountListDialog from "./AccountListDialog";
import AppInfoDialog from "./AppInfoDialog";
import BackupAndRestoreDialog from "./BackupAndRestoreDialog";
import BulkEditDialog from "./BulkEditDialog";
import CleanerDialog from "./CleanerDialog";
import { CleanerProvider } from "./CleanerProvider";
import { Dialog } from "radix-ui";
import { FaSpider } from "react-icons/fa";
import Icon from "../assets/images/icon.png";
import ImportAndExportAccountsDialog from "./ImportAndExportAccountsDialog";
import LoaderDialog from "./LoaderDialog";
import { MdOutlineBrowserUpdated } from "react-icons/md";
import ProxiesDialog from "./ProxiesDialog";
import SettingsDialog from "./SettingsDialog";
import ScriptPromptToast from "./ScriptPromptToast";
import ScriptRunBadge from "./ScriptRunBadge";
import ScriptsDialog from "./ScriptsDialog";
import SideMenuDialog from "./SideMenuDialog";
import SpiderDialog from "./SpiderDialog";
import { SpiderProvider } from "./SpiderProvider";
import TagsDialog from "./TagsDialog";
import { cn } from "../lib/utils";
import useAppVersion from "../hooks/useAppVersion";
import useExtensionStore, {
  selectIsUpdating,
} from "../store/useExtensionStore";
import useDialogState from "../hooks/useDialogState";
import useScriptRunStore, {
  selectSetDialogOpen,
} from "../store/useScriptRunStore";

/** The handler for toggling fullscreen */
const toggleFullScreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else if (document.exitFullscreen) {
    document.exitFullscreen();
  }
};

/** Spinner on the Settings button while the extension updates */
const EXTENSION_UPDATING_BADGE = (
  <span
    title="Updating extension"
    className={cn(
      "absolute -right-0.5 -top-0.5 rounded-full",
      "bg-white dark:bg-neutral-900 flex",
    )}
  >
    <HiOutlineArrowPath className="size-3.5 text-orange-500 animate-spin" />
  </span>
);

/** The badge of the Scripts button */
const SCRIPT_RUN_BADGE = <ScriptRunBadge />;

/** The handler for reloading the app */
const reloadApp = () => window.location.reload();

/** A side menu of buttons that open the app's dialogs */
export default function SideMenu() {
  /** Whether a newer app version is available */
  const { hasUpdate } = useAppVersion();
  /** Whether the extension is updating */
  const isUpdatingExtension = useExtensionStore(selectIsUpdating);
  /** The open state of the Spider dialog */
  const spiderDialog = useDialogState();
  /** The open state of the Cleaner dialog */
  const cleanerDialog = useDialogState();
  /** Whether the Scripts dialog is open */
  const isScriptsOpen = useScriptRunStore((state) => state.isDialogOpen);
  const setScriptsOpen = useScriptRunStore(selectSetDialogOpen);

  return (
    <div
      className={cn(
        "shrink-0 w-14 h-full px-1.5 py-2",
        "flex flex-col gap-2 items-center",
        "overflow-y-auto",
      )}
    >
      <SideMenuDialog title="Accounts" icon={HiOutlineBars3}>
        <AccountListDialog />
      </SideMenuDialog>

      <SideMenuDialog title="Tags" icon={LuTags}>
        <TagsDialog />
      </SideMenuDialog>

      <SideMenuDialog title="Bulk Edit" icon={LuListChecks}>
        <BulkEditDialog />
      </SideMenuDialog>

      <SideMenuDialog
        title="Scripts"
        icon={LuSquareTerminal}
        open={isScriptsOpen}
        onOpenChange={setScriptsOpen}
        badge={SCRIPT_RUN_BADGE}
      >
        <ScriptsDialog />
      </SideMenuDialog>
      <ScriptPromptToast />

      <SideMenuDialog
        title="Settings"
        icon={HiOutlineCog6Tooth}
        badge={isUpdatingExtension ? EXTENSION_UPDATING_BADGE : null}
      >
        <SettingsDialog />
      </SideMenuDialog>

      <SideMenuDialog title="Backup and Restore" icon={LuDatabaseBackup}>
        <BackupAndRestoreDialog />
      </SideMenuDialog>

      <SideMenuDialog title="Import and Export accounts" icon={LuArrowUpDown}>
        <ImportAndExportAccountsDialog />
      </SideMenuDialog>

      <SideMenuDialog
        title="Cleaner"
        icon={LuEraser}
        open={cleanerDialog.opened}
        onOpenChange={cleanerDialog.setOpened}
      >
        <CleanerProvider onLaunch={cleanerDialog.closeDialog}>
          <CleanerDialog />
        </CleanerProvider>
      </SideMenuDialog>

      <SideMenuDialog
        title="Spider"
        icon={FaSpider}
        open={spiderDialog.opened}
        onOpenChange={spiderDialog.setOpened}
      >
        <SpiderProvider active={spiderDialog.opened}>
          <SpiderDialog />
        </SpiderProvider>
      </SideMenuDialog>

      <SideMenuDialog title="Proxies" icon={LuGlobeLock}>
        <ProxiesDialog />
      </SideMenuDialog>

      {/* Fullscreen Toggle */}
      <button
        type="button"
        title="Toggle Fullscreen"
        className="p-2"
        onClick={toggleFullScreen}
      >
        <HiOutlineArrowsPointingOut className="size-5 text-orange-500" />
      </button>

      {/* App Icon */}
      <Dialog.Root>
        <Dialog.Trigger className="mt-auto size-10 shrink-0 relative flex">
          <img src={Icon} alt="Purrfect Whiskers" className="size-full" />

          {/* Latest Version Alert */}
          {hasUpdate ? (
            <span
              className={cn(
                "absolute rounded-full size-5 bg-red-500 text-white",
                "flex items-center justify-center",
                "-left-1 -top-1",
              )}
            >
              <MdOutlineBrowserUpdated className="size-4" />
            </span>
          ) : null}
        </Dialog.Trigger>
        <AppInfoDialog />
      </Dialog.Root>

      <SideMenuDialog title="Loader" icon={HiOutlinePuzzlePiece}>
        <LoaderDialog />
      </SideMenuDialog>

      {/* Reload */}
      <button
        type="button"
        title="Reload App"
        className="p-2"
        onClick={reloadApp}
      >
        <HiOutlineArrowPath className="size-5 text-orange-500" />
      </button>
    </div>
  );
}
