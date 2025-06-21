import { Dialog } from "radix-ui";
import { HiOutlineGlobeAlt, HiOutlineXCircle } from "react-icons/hi2";
import { MdOutlineEditNote, MdOutlineFullscreen } from "react-icons/md";
import { memo, useCallback, useEffect, useRef, useState } from "react";

import Browser from "./Browser";
import EditAccountDialog from "./EditAccountDialog";
import FarmerWebview from "./FarmerWebview";
import WebviewButton from "./WebviewButton";
import useAppStore from "../store/useAppStore";
import useBrowser from "../hooks/useBrowser";
import useDialogState from "../hooks/useDialogState";
import useSettingsStore from "../store/useSettingsStore";
import { cn } from "../lib/utils";
import { configureProxy } from "../lib/partitions";

export default memo(function Webview({ account }) {
  const browser = useBrowser();
  const {
    title,
    partition,
    proxyEnabled,
    proxyHost,
    proxyPort,
    proxyUsername,
    proxyPassword,
  } = account;

  const containerRef = useRef();
  const [isDesktop, setIsDesktop] = useState(false);
  const allowProxies = useSettingsStore((state) => state.allowProxies);
  const closePartition = useAppStore((state) => state.closePartition);

  /** Edit Account Dialog State */
  const {
    opened: openEditAccountDialog,
    setOpened: setOpenEditAccountDialog,
    closeDialog: closeEditAccountDialog,
  } = useDialogState();

  /** Toggle FullScreen */
  const toggleFullScreen = useCallback(() => {
    const container = containerRef.current;
    if (!document.fullscreenElement) {
      if (container) {
        container.requestFullscreen();
      }
    } else if (document.fullscreenElement === container) {
      document.exitFullscreen();
    }
  }, []);

  /** Configure Proxy */
  useEffect(() => {
    configureProxy(partition, {
      allowProxies,
      proxyEnabled,
      proxyHost,
      proxyPort,
      proxyUsername,
      proxyPassword,
    });
  }, [
    partition,
    allowProxies,
    proxyEnabled,
    proxyHost,
    proxyPort,
    proxyUsername,
    proxyPassword,
    configureProxy,
  ]);

  /** Watch Fullscreen */
  useEffect(() => {
    const handleFullscreenChange = () =>
      setIsDesktop(document.fullscreenElement === containerRef.current);

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [setIsDesktop]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "grow flex flex-col shrink-0",
        "divide-y dark:divide-neutral-700",
        "bg-white dark:bg-neutral-800 dark:text-white"
      )}
    >
      <div className="flex gap-2 items-center justify-between p-2">
        <div className="flex gap-1">
          {/* Toggle Browser */}
          <WebviewButton
            title="Toggle Browser"
            onClick={browser.toggle}
            className={browser.shown && "text-orange-500"}
          >
            <HiOutlineGlobeAlt className="size-4" />
          </WebviewButton>

          {/* Toggle Fullscreen */}
          <WebviewButton
            title="Toggle Fullscreen"
            onClick={toggleFullScreen}
            className={isDesktop && "text-orange-500"}
          >
            <MdOutlineFullscreen className="size-4" />
          </WebviewButton>
        </div>

        {/* Title */}
        <h1 className="text-orange-500 truncate font-bold text-center">
          {title}
        </h1>

        <div className="flex gap-1">
          {/* Edit Dialog */}
          <Dialog.Root
            open={openEditAccountDialog}
            onOpenChange={setOpenEditAccountDialog}
          >
            {/* Edit Button */}
            <Dialog.Trigger disabled={isDesktop} asChild title="Edit Account">
              <WebviewButton>
                <MdOutlineEditNote className="size-4" />
              </WebviewButton>
            </Dialog.Trigger>

            {/* Account Dialog */}
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

      {/* Farmer and Browser */}
      <div className="grow flex flex-col overflow-hidden">
        <div
          className={cn(
            "-translate-x-(--translate) translate-3d",
            "grow grid w-[200%] gap-0  grid-cols-2",
            "transition-transform duration-500"
          )}
          style={{
            "--translate": browser.shown ? "50%" : "0%",
          }}
        >
          {/* Farmer Webview */}
          <FarmerWebview browser={browser} account={account} />

          {/* Browser */}
          {browser.enabled ? (
            <Browser
              browser={browser}
              account={account}
              isDesktop={isDesktop}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
});
