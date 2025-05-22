import { Dialog } from "radix-ui";
import { HiOutlineXCircle } from "react-icons/hi2";
import { MdOutlineEditNote } from "react-icons/md";
import { memo, useCallback, useEffect, useRef, useState } from "react";

import EditAccountDialog from "./EditAccountDialog";
import useAppStore from "../store/useAppStore";
import useSettingsStore from "../store/useSettingsStore";
import { cn } from "../lib/utils";

export default memo(function Webview({ account }) {
  const extensionPath = useSettingsStore((state) => state.extensionPath);
  const { title, partition } = account;
  const ref = useRef(null);
  const closePartition = useAppStore((state) => state.closePartition);

  const [openEditAccountDialog, setOpenEditAccountDialog] = useState(false);
  const closeEditAccountDialog = useCallback(
    () => setOpenEditAccountDialog(false),
    [setOpenEditAccountDialog]
  );

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    // Create the <webview> element
    const webview = document.createElement("webview");
    webview.setAttribute("partition", partition);
    webview.setAttribute("plugins", "true");
    webview.setAttribute("nodeintegration", "true");
    webview.setAttribute("allowpopups", "true");
    webview.setAttribute("disablewebsecurity", "true");
    webview.setAttribute(
      "useragent",
      "Mozilla/5.0 (Linux; Android 14; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.6778.135 Mobile Safari/537.36 Telegram-Android/11.6.1 (Samsung SM-G998B; Android 14; SDK 34; HIGH)"
    );
    webview.style.width = "100%";
    webview.style.height = "100%";

    // Load extension URL
    window.electron.ipcRenderer
      .invoke("setup-session", { partition, extensionPath })
      .then((extension) => {
        webview.src = extension
          ? extension.url + "index.html"
          : import.meta.env.VITE_DEFAULT_WEBVIEW_URL;
      })
      .catch(() => {
        webview.src = import.meta.env.VITE_DEFAULT_WEBVIEW_URL;
      });

    // Attach devtools handler
    webview.addEventListener("dom-ready", () => {
      webview.addEventListener("context-menu", () => {
        webview.openDevTools({ mode: "detach" });
      });
    });

    // Append to container
    container.appendChild(webview);

    // Cleanup on unmount
    return () => {
      webview.remove();
    };
  }, [partition, extensionPath]);

  return (
    <div key={partition} className={cn("grow flex flex-col shrink-0")}>
      <div className="flex items-center gap-2 p-1">
        {/* Title */}
        <div className="flex font-bold grow text-orange-500">{title}</div>

        {/* Edit Button */}
        <Dialog.Root
          open={openEditAccountDialog}
          onOpenChange={setOpenEditAccountDialog}
        >
          <Dialog.Trigger
            className={cn(
              "bg-neutral-100",
              "hover:bg-orange-100 hover:text-orange-700",
              "flex items-center justify-center",
              "p-2 px-3 rounded-xl shrink-0"
            )}
          >
            <MdOutlineEditNote className="size-4" />
          </Dialog.Trigger>
          <EditAccountDialog account={account} close={closeEditAccountDialog} />
        </Dialog.Root>

        {/* Close Button */}
        <button
          className={cn(
            "bg-neutral-100",
            "hover:bg-orange-100 hover:text-orange-700",
            "flex items-center justify-center",
            "p-2 px-3 rounded-xl shrink-0"
          )}
          onClick={() => closePartition(partition)}
        >
          <HiOutlineXCircle className="size-4" />
        </button>
      </div>
      <div ref={ref} className="grow flex flex-col" />
    </div>
  );
});
