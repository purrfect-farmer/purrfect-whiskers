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
  LuGlobeLock,
  LuTags,
} from "react-icons/lu";

import AccountListDialog from "./AccountListDialog";
import AppInfoDialog from "./AppInfoDialog";
import BackupAndRestoreDialog from "./BackupAndRestoreDialog";
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
import useDialogState from "../hooks/useDialogState";

/** Toggle FullScreen */
const toggleFullScreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else if (document.exitFullscreen) {
    document.exitFullscreen();
  }
};

/** Reload App */
const reloadApp = () => window.location.reload();

export default function SideMenu() {
  const { hasUpdate } = useAppVersion();
  const spiderDialog = useDialogState();

  return (
    <div className="shrink-0 w-14 px-1.5 py-2 h-full flex flex-col gap-2 items-center overflow-y-auto">
      <SideMenuDialog title="Accounts" icon={HiOutlineBars3}>
        <AccountListDialog />
      </SideMenuDialog>

      <SideMenuDialog title="Tags" icon={LuTags}>
        <TagsDialog />
      </SideMenuDialog>

      <SideMenuDialog title="Settings" icon={HiOutlineCog6Tooth}>
        <SettingsDialog />
      </SideMenuDialog>

      <SideMenuDialog title="Backup and Restore" icon={LuDatabaseBackup}>
        <BackupAndRestoreDialog />
      </SideMenuDialog>

      <SideMenuDialog title="Import and Export accounts" icon={LuArrowUpDown}>
        <ImportAndExportAccountsDialog />
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
