import {
  HiOutlineArrowLeft,
  HiOutlineArrowPath,
  HiOutlineArrowRight,
  HiOutlineStop,
} from "react-icons/hi2";
import { memo, useCallback, useEffect, useRef } from "react";

import WebviewButton from "./WebviewButton";
import useAppStore from "../store/useAppStore";
import useRefCallback from "../hooks/useRefCallback";
import useSettingsStore from "../store/useSettingsStore";
import { cn } from "../lib/utils";
import {
  createWebview,
  getWhiskerData,
  registerWebviewMessage,
} from "../lib/partitions";

export default memo(function ({ account }) {
  const updateAccount = useAppStore((state) => state.updateAccount);
  const theme = useSettingsStore((state) => state.theme);
  const allowProxies = useSettingsStore((state) => state.allowProxies);
  const extensionPath = useSettingsStore((state) => state.extensionPath);
  const showWebviewToolbar = useSettingsStore(
    (state) => state.showWebviewToolbar
  );
  const { partition } = account;
  const containerRef = useRef(null);
  const webviewRef = useRef(null);
  const webviewIsReadyRef = useRef(false);

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

  /** Get Current Whisker Data */
  const getCurrentWhiskerData = useRefCallback(
    () =>
      getWhiskerData({
        account,
        settings: {
          allowProxies,
          theme,
        },
      }),
    [account, allowProxies, theme]
  );

  /** Send Whisker Data */
  const sendWhiskerData = useRefCallback(() => {
    callWebviewMethod((webview) =>
      webview.send("host-message", {
        action: "set-whisker-data",
        data: getCurrentWhiskerData(),
      })
    );
  }, [getCurrentWhiskerData, callWebviewMethod]);

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

  /** Update Telegram InitData */
  const updateTelegramInitData = useRefCallback(
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
      "set-telegram-init-data": (data) => updateTelegramInitData(data),
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
  }, [
    partition,
    extensionPath,
    updateProxy,
    updateTelegramInitData,
    sendWhiskerData,
  ]);

  /** Send Whisker Data */
  useEffect(() => {
    sendWhiskerData();
  }, [account, allowProxies, theme]);

  return (
    <div
      key={partition}
      className={cn(
        "grow flex flex-col shrink-0",
        "divide-y dark:divide-neutral-700"
      )}
    >
      <div ref={containerRef} className="grow flex flex-col" />

      {/* Controls */}
      {showWebviewToolbar ? (
        <div className="p-2 flex shrink-0 justify-center gap-1">
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
        </div>
      ) : null}
    </div>
  );
});
