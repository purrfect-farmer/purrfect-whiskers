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
import {
  configureProxy,
  createWebview,
  registerWebviewMessage,
} from "../lib/partitions";
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
  const updateAccount = useAppStore((state) => state.updateAccount);
  const theme = useSettingsStore((state) => state.theme);
  const extensionPath = useSettingsStore((state) => state.extensionPath);
  const showWebviewToolbar = useSettingsStore(
    (state) => state.showWebviewToolbar
  );
  const {
    title,
    partition,
    proxyEnabled,
    proxyHost,
    proxyPort,
    proxyUsername,
    proxyPassword,
  } = account;
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

  /** Get Whisker Data */
  const getWhiskerData = useRefCallback(
    () => ({
      account,
      theme,
    }),
    [account, theme]
  );

  /** Send Whisker Data */
  const sendWhiskerData = useRefCallback(() => {
    callWebviewMethod((webview) =>
      webview.send("host-message", {
        action: "set-whisker-data",
        data: getWhiskerData(),
      })
    );
  }, [getWhiskerData, callWebviewMethod]);

  /** Update Proxy */
  const updateProxy = useRefCallback(
    (data) => {
      updateAccount({
        ...account,
        ...data,
      });
    },
    [account, updateAccount]
  );

  /** Initialize Webview */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    /** Create the <webview> element */
    const webview = createWebview(partition, extensionPath);

    /** Attach DOM Ready Event */
    webview.addEventListener("dom-ready", () => {
      /** Set as ready */
      webviewIsReadyRef.current = true;
    });

    /** IPC Message */
    registerWebviewMessage(webview, {
      "get-whisker-data": () => sendWhiskerData(),
      "set-proxy": (data) => updateProxy(data),
    });

    /** Append to container */
    container.appendChild(webview);

    /** Set Ref */
    webviewRef.current = webview;

    /** Cleanup on unmount */
    return () => {
      webview.remove();
      webviewIsReadyRef.current = false;
      webviewRef.current = null;
    };
  }, [partition, extensionPath, updateProxy, sendWhiskerData]);

  /** Configure Proxy */
  useEffect(() => {
    configureProxy(partition, {
      proxyEnabled,
      proxyHost,
      proxyPort,
      proxyUsername,
      proxyPassword,
    });
  }, [
    partition,
    proxyEnabled,
    proxyHost,
    proxyPort,
    proxyUsername,
    proxyPassword,
    configureProxy,
  ]);

  /** Send Whisker Data */
  useEffect(() => {
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

        {showWebviewToolbar ? (
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
        ) : null}
      </div>
      <div ref={containerRef} className="grow flex flex-col" />
    </div>
  );
});
