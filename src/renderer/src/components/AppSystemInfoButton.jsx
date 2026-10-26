import { HiOutlineClipboardDocumentList } from "react-icons/hi2";
import { IPC } from "../../../shared/constants/ipc";
import { cn, copyText } from "../lib/utils";
import { memo } from "react";
import useSettingsStore from "../store/useSettingsStore";

/** The text describing this install, for support requests */
async function buildSystemInfo(currentVersion) {
  const { invoke } = window.electron.ipcRenderer;
  const { versions } = window.electron.process;

  /** The OS and release format */
  const system = await invoke(IPC.GET_SYSTEM_INFO);
  /** The installed extension version, or null */
  const extensionVersion = await invoke(
    IPC.GET_EXTENSION_VERSION,
    useSettingsStore.getState().extensionPath,
  ).catch(() => null);

  return [
    `Purrfect Whiskers ${currentVersion ?? "unknown"}`,
    `Extension ${extensionVersion ?? "not installed"}`,
    `Electron ${versions.electron} · Chrome ${versions.chrome}`,
    `${system.os} (${system.arch})`,
  ].join("\n");
}

/** A button that copies the app, extension and OS versions */
export default memo(function AppSystemInfoButton({ currentVersion }) {
  return (
    <button
      type="button"
      onClick={async () =>
        copyText(await buildSystemInfo(currentVersion), "System info")
      }
      className={cn(
        "flex items-center justify-center gap-2 min-w-0",
        "px-3 py-2.5 rounded-xl font-bold",
        "bg-neutral-100 dark:bg-neutral-700",
        "hover:bg-orange-500 hover:text-white",
      )}
    >
      <HiOutlineClipboardDocumentList className="size-4 shrink-0" />
      <span className="truncate">Copy system info</span>
    </button>
  );
});
