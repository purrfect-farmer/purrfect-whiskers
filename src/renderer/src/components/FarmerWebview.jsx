import {
  HiOutlineArrowLeft,
  HiOutlineArrowPath,
  HiOutlineArrowRight,
  HiOutlineXMark,
} from "react-icons/hi2";
import {
  getWhiskerData,
  loadAccountWebview,
  pickFarmerProxy,
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

/** A webview that runs the farmer for an account, with a toolbar */
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

  /** The whisker data of the account */
  const whiskerData = useMemo(
    () => getWhiskerData({ account, settings: { allowProxies, theme } }),
    [account, allowProxies, theme],
  );

  /** The callback that sends the whisker data to the webview */
  const sendWhiskerData = useEffectEvent(() => {
    callWebviewMethod((webview) =>
      sendHostMessage(webview, {
        action: WEBVIEW_ACTION.SET_WHISKER_DATA,
        data: whiskerData,
      }),
    );
  });

  /** The callback that replies with the whisker data */
  const replyWhiskerData = useEffectEvent((reply) => {
    reply({ action: WEBVIEW_ACTION.SET_WHISKER_DATA, data: whiskerData });
  });

  /** The callback that merges webview data into the account */
  const mergeAccountData = useEffectEvent((data) => {
    updateAccount({ ...data, partition });
  });

  /**
   * The callback that adopts the farmer's User-Agent
   * when the account has none
   */
  const adoptFarmerUserAgent = useEffectEvent((data) => {
    if (account.userAgent || !data?.userAgent) return;

    mergeAccountData({ userAgent: withWhiskerChromeVersion(data.userAgent) });
  });

  /** The callback that adopts the farmer's Telegram init data */
  const adoptTelegramInitData = useEffectEvent((data) => {
    if (typeof data?.telegramInitData !== "string") return;

    mergeAccountData({ telegramInitData: data.telegramInitData });
  });

  /** The callback that launches an account on request */
  const launchAccount = useEffectEvent((data, reply) => {
    reply({
      action: WEBVIEW_ACTION.RESPONSE_LAUNCH_ACCOUNT,
      data: launchAccountByRequest(
        data && typeof data === "object" ? data : null,
      ),
    });
  });

  /** Loads the account into the webview */
  useEffect(() => {
    const controller = new AbortController();

    loadAccountWebview(
      ref.current,
      { partition, extensionPath },
      controller.signal,
    );

    return () => controller.abort();
  }, [ref, partition, extensionPath]);

  /** Registers the webview message handlers */
  useEffect(
    () =>
      registerWebviewMessage(ref.current, {
        [WEBVIEW_ACTION.GET_WHISKER_DATA]: (_data, reply) =>
          replyWhiskerData(reply),
        [WEBVIEW_ACTION.SET_PROXY]: (data) =>
          mergeAccountData(pickFarmerProxy(data)),
        [WEBVIEW_ACTION.SET_USER_AGENT]: (data) => adoptFarmerUserAgent(data),
        [WEBVIEW_ACTION.SET_TELEGRAM_INIT_DATA]: (data) =>
          adoptTelegramInitData(data),
        [WEBVIEW_ACTION.LAUNCH_ACCOUNT]: (data, reply) =>
          launchAccount(data, reply),
      }),
    [ref],
  );

  /** Sends the whisker data when it changes */
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
