import { Dialog } from "radix-ui";
import {
  HiOutlineArrowLeft,
  HiOutlineArrowPath,
  HiOutlineArrowRight,
  HiOutlineStop,
  HiOutlineXCircle,
} from "react-icons/hi2";
import { MdOutlineEditNote } from "react-icons/md";
import { memo, useCallback, useEffect, useRef } from "react";

import EditAccountDialog from "./EditAccountDialog";
import useAppStore from "../store/useAppStore";
import useDialogState from "../hooks/useDialogState";
import useRefCallback from "../hooks/useRefCallback";
import useSettingsStore from "../store/useSettingsStore";
import { cn } from "../lib/utils";

const WebviewButton = memo((props) => (
  <button
    {...props}
    className={cn(
      "bg-neutral-100 dark:bg-neutral-700",
      "hover:bg-orange-100 hover:text-orange-500",
      "dark:hover:bg-orange-200",
      "flex items-center justify-center",
      "p-2 rounded-full shrink-0",
      props.className
    )}
  />
));

export default memo(function Webview({ account }) {
  const theme = useSettingsStore((state) => state.theme);
  const extensionPath = useSettingsStore((state) => state.extensionPath);
  const { title, partition } = account;
  const containerRef = useRef(null);
  const webviewRef = useRef(null);
  const webviewIsReadyRef = useRef(false);
  const closePartition = useAppStore((state) => state.closePartition);

  /** Edit Account Dialog State */
  const {
    opened: openEditAccountDialog,
    setOpened: setOpenEditAccountDialog,
    closeDialog: closeEditAccountDialog,
  } = useDialogState();

  /** Call Webview Method */
  const callWebviewMethod = useCallback((callback) => {
    const webview = webviewRef.current;
    const webviewIsReady = webviewIsReadyRef.current;
    if (webview && webviewIsReady) {
      callback(webview);
    }
  }, []);

  /** Go Back */
  const goBack = useCallback(
    () => callWebviewMethod((webview) => webview.goBack()),
    [callWebviewMethod]
  );

  /** Go Forward */
  const goForward = useCallback(
    () => callWebviewMethod((webview) => webview.goForward()),
    [callWebviewMethod]
  );

  /** Stop Webview */
  const stop = useCallback(
    () => callWebviewMethod((webview) => webview.stop()),
    [callWebviewMethod]
  );

  /** Reload Webview */
  const reload = useCallback(
    () => callWebviewMethod((webview) => webview.reload()),
    [callWebviewMethod]
  );

  /** Send Whisker Data */
  const sendWhiskerData = useRefCallback(() => {
    callWebviewMethod((webview) =>
      webview.send("host-message", {
        action: "set-whisker-data",
        data: {
          account,
          theme,
        },
      })
    );
  }, [account, theme, callWebviewMethod]);

  /** Initialize Webview */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Create the <webview> element
    const webview = document.createElement("webview");

    webview.setAttribute("partition", partition);
    webview.setAttribute("plugins", "true");
    webview.setAttribute("nodeintegration", "true");
    webview.setAttribute("allowpopups", "true");
    webview.setAttribute(
      "webpreferences",
      "nodeIntegration, webSecurity=false, sandbox=false"
    );
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
      // Set as ready
      webviewIsReadyRef.current = true;

      // Send Account Data
      sendWhiskerData();
    });

    // Context Menu
    webview.addEventListener("context-menu", () => {
      webview.openDevTools({ mode: "detach" });
    });

    // IPC Message
    webview.addEventListener("ipc-message", (event) => {
      if (event.channel === "webview-message") {
        const { action } = event.args[0];

        if (action === "get-whisker-data") {
          sendWhiskerData();
        }
      }
    });

    // Append to container
    container.appendChild(webview);

    // Set Ref
    webviewRef.current = webview;

    // Cleanup on unmount
    return () => {
      webview.remove();
      webviewIsReadyRef.current = false;
      webviewRef.current = null;
    };
  }, [partition, extensionPath, sendWhiskerData]);

  /** Send Account Data */
  useEffect(() => {
    /** Send Current Data */
    sendWhiskerData();
  }, [account, theme]);

  return (
    <div
      key={partition}
      className={cn(
        "grow flex flex-col shrink-0",
        "divide-y dark:divide-neutral-700"
      )}
    >
      <div className="p-2 flex flex-col gap-2">
        {/* Title */}
        <h1 className="text-orange-500 truncate font-bold text-center">
          {title}
        </h1>

        <div className="flex shrink-0 justify-between gap-1">
          <div className="flex gap-1">
            {/* Back */}
            <WebviewButton title="Go Back" onClick={goBack}>
              <HiOutlineArrowLeft className="size-4" />
            </WebviewButton>

            {/* Forward */}
            <WebviewButton title="Go Forward" onClick={goForward}>
              <HiOutlineArrowRight className="size-4" />
            </WebviewButton>

            {/* Stop */}
            <WebviewButton title="Stop" onClick={stop}>
              <HiOutlineStop className="size-4" />
            </WebviewButton>

            {/* Reload */}
            <WebviewButton title="Reload" onClick={reload}>
              <HiOutlineArrowPath className="size-4" />
            </WebviewButton>
          </div>
          <div className="flex gap-1">
            {/* Edit Button */}
            <Dialog.Root
              open={openEditAccountDialog}
              onOpenChange={setOpenEditAccountDialog}
            >
              <Dialog.Trigger asChild title="Edit Account">
                <WebviewButton>
                  <MdOutlineEditNote className="size-4" />
                </WebviewButton>
              </Dialog.Trigger>
              <EditAccountDialog
                account={account}
                close={closeEditAccountDialog}
              />
            </Dialog.Root>

            {/* Close Button */}
            <WebviewButton
              title="Close Account"
              onClick={() => closePartition(partition)}
            >
              <HiOutlineXCircle className="size-4" />
            </WebviewButton>
          </div>
        </div>
      </div>
      <div ref={containerRef} className="grow flex flex-col" />
    </div>
  );
});
