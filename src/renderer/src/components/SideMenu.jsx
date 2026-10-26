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

/** Toggle FullScreen */
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

/** Reload App */
const reloadApp = () => window.location.reload();

export default function SideMenu() {
  const { hasUpdate } = useAppVersion();
  const isUpdatingExtension = useExtensionStore(selectIsUpdating);
  const spiderDialog = useDialogState();
  const cleanerDialog = useDialogState();

  return (
    <div className="shrink-0 w-14 px-1.5 py-2 h-full flex flex-col gap-2 items-center overflow-y-auto">
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
      <button title="Reload App" className="p-2" onClick={reloadApp}>
        <HiOutlineArrowPath className="size-5 text-orange-500" />
      </button>
    </div>
  );
}
