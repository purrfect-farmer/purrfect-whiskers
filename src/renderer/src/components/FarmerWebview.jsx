import {
  HiOutlineArrowLeft,
  HiOutlineArrowPath,
  HiOutlineArrowRight,
  HiOutlineXMark,
} from "react-icons/hi2";
import {
  getWhiskerData,
  loadAccountWebview,
  registerWebviewMessage,
  sendHostMessage,
} from "../lib/partitions";
import { memo, useEffect, useEffectEvent, useMemo } from "react";

import { BsPinAngle } from "react-icons/bs";
import { RiPushpin2Fill } from "react-icons/ri";
import { WEBVIEW_ACTION } from "../../../shared/constants/ipc";
import WebviewButton from "./WebviewButton";
import { cn } from "../lib/utils";
import useAppStore from "../store/useAppStore";
import { withWhiskerChromeVersion } from "../lib/userAgent";
import useSettingsStore from "../store/useSettingsStore";
import useWebviewControls from "../hooks/useWebviewControls";

export default memo(function FarmerWebview({ account, pinned, togglePinned }) {
  const updateAccount = useAppStore((state) => state.updateAccount);
  const launchAccountByRequest = useAppStore(
    (state) => state.launchAccountByRequest,
  );
  const theme = useSettingsStore((state) => state.theme);
  const allowProxies = useSettingsStore((state) => state.allowProxies);
  const extensionPath = useSettingsStore((state) => state.extensionPath);
  const showWebviewToolbar = useSettingsStore(
    (state) => state.showWebviewToolbar,
  );
  const { partition } = account;
  const { ref, isLoading, goBack, goForward, reload, stop, callWebviewMethod } =
    useWebviewControls();

  /** Current Whisker Data */
  const whiskerData = useMemo(
    () => getWhiskerData({ account, settings: { allowProxies, theme } }),
    [account, allowProxies, theme],
  );

  /** Send Whisker Data */
  const sendWhiskerData = useEffectEvent(() => {
    callWebviewMethod((webview) =>
      sendHostMessage(webview, {
        action: WEBVIEW_ACTION.SET_WHISKER_DATA,
        data: whiskerData,
      }),
    );
  });

  /** Merges data sent by the webview into the account */
  const mergeAccountData = useEffectEvent((data) => {
    updateAccount({ ...data, partition });
  });

  /** Launch Account */
  const launchAccount = useEffectEvent((data, reply) => {
    reply({
      action: WEBVIEW_ACTION.RESPONSE_LAUNCH_ACCOUNT,
      data: launchAccountByRequest(
        data && typeof data === "object" ? data : null,
      ),
    });
  });

  /** Setup Webview */
  useEffect(() => {
    const controller = new AbortController();

    loadAccountWebview(
      ref.current,
      { partition, extensionPath },
      controller.signal,
    );

    return () => controller.abort();
  }, [ref, partition, extensionPath]);

  /** Register Core Events */
  useEffect(
    () =>
      registerWebviewMessage(ref.current, {
        [WEBVIEW_ACTION.GET_WHISKER_DATA]: () => sendWhiskerData(),
        [WEBVIEW_ACTION.SET_PROXY]: (data) => mergeAccountData(data),
        [WEBVIEW_ACTION.SET_USER_AGENT]: (data) =>
          mergeAccountData({
            userAgent: withWhiskerChromeVersion(data?.userAgent),
          }),
        [WEBVIEW_ACTION.SET_TELEGRAM_INIT_DATA]: (data) =>
          mergeAccountData(data),
        [WEBVIEW_ACTION.LAUNCH_ACCOUNT]: (data, reply) =>
          launchAccount(data, reply),
      }),
    [ref],
  );

  /** Send Whisker Data */
  useEffect(() => {
    sendWhiskerData();
  }, [whiskerData]);

  return (
    <div
      className={cn(
        "grow flex flex-col shrink-0",
        "divide-y dark:divide-neutral-700",
      )}
    >
      {/* Webiew Tag */}
      <webview
        allowpopups="true"
        className="grow"
        partition={partition}
        disablewebsecurity={"true"}
        webpreferences="webSecurity=no"
        ref={ref}
      />

      {/* Controls */}
      {showWebviewToolbar ? (
        <div className="p-2 flex shrink-0 justify-center gap-1">
          <div className="flex gap-1">
            {/* Pin Toggle */}
            <WebviewButton
              title="Toggle Pin"
              onClick={togglePinned}
              className={pinned && "text-orange-500"}
            >
              {pinned ? (
                <RiPushpin2Fill className="size-4" />
              ) : (
                <BsPinAngle className="size-4" />
              )}
            </WebviewButton>

            {/* Back */}
            <WebviewButton title="Go Back" onClick={goBack}>
              <HiOutlineArrowLeft className="size-4" />
            </WebviewButton>

            {/* Forward */}
            <WebviewButton title="Go Forward" onClick={goForward}>
              <HiOutlineArrowRight className="size-4" />
            </WebviewButton>

            {/* Stop */}
            {isLoading ? (
              <WebviewButton onClick={stop} title="Stop">
                <HiOutlineXMark className="size-4" />
              </WebviewButton>
            ) : (
              <WebviewButton onClick={reload} title="Refresh">
                <HiOutlineArrowPath className="size-4" />
              </WebviewButton>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
});
