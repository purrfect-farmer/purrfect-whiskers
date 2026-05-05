import { HiOutlineGlobeAlt, HiOutlineXCircle } from "react-icons/hi2";
import { MdOutlineEditNote, MdOutlineFullscreen } from "react-icons/md";
import { RiDraggable, RiPushpin2Fill } from "react-icons/ri";
import { memo, useCallback, useEffect, useId, useRef, useState } from "react";

import Browser from "./Browser";
import { BsPinAngle } from "react-icons/bs";
import { Dialog } from "radix-ui";
import Draggable from "react-draggable";
import EditAccountDialogContent from "./EditAccountDialogContent";
import FarmerWebview from "./FarmerWebview";
import WebviewButton from "./WebviewButton";
import { cn } from "../lib/utils";
import { configureProxy } from "../lib/partitions";
import { useAppContext } from "../providers/AppProvider";
import useAppStore from "../store/useAppStore";
import useBrowser from "../hooks/useBrowser";
import useDialogState from "../hooks/useDialogState";
import useSettingsStore from "../store/useSettingsStore";

export default memo(function Webview({ account, pageIndex }) {
  const dragHandleClass = "draggable-handle-" + useId();
  const { currentPage } = useAppContext();
  const {
    title,
    partition,
    proxyEnabled,
    proxyHost,
    proxyPort,
    proxyUsername,
    proxyPassword,
  } = account;

  const [pinned, setPinned] = useState(false);
  const [position, setPosition] = useState({
    x: 0,
    y: 0,
  });
  const browser = useBrowser(partition);
  const containerRef = useRef();
  const [isDesktop, setIsDesktop] = useState(false);
  const allowProxies = useSettingsStore((state) => state.allowProxies);
  const closeAccount = useAppStore((state) => state.closeAccount);

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

  const togglePinned = () => {
    setPinned((prev) => !prev);
    setPosition({
      x: 0,
      y: 0,
    });
  };

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
    <div className="grow flex flex-col relative">
      {pinned && (
        <div className="grow flex flex-col gap-2 justify-center items-center">
          <h1 className="text-xl text-orange-500">{title}</h1>
          <p>This account is current pinned</p>
        </div>
      )}
      <div
        className={cn(
          "grow flex flex-col absolute inset-0",
          pinned
            ? [
                "transition-transform duration-500",
                "translate-y-(--current-page)",
                "z-999",
              ]
            : null,
        )}
        style={{
          "--current-page": pinned ? `${(currentPage - pageIndex) * 100}%` : 0,
        }}
      >
        <Draggable
          handle={`.${dragHandleClass}`}
          disabled={!pinned}
          nodeRef={containerRef}
          position={position}
          onDrag={(e, { x, y }) =>
            setPosition({
              x,
              y,
            })
          }
        >
          <div
            ref={containerRef}
            className={cn(
              "grow flex flex-col shrink-0",
              "divide-y dark:divide-neutral-700",
              "bg-white dark:bg-neutral-800 dark:text-white",
              pinned ? "border border-orange-500" : null,
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
              </div>

              {/* Title */}
              <h1
                className={cn(
                  "text-orange-500 truncate font-bold text-center grow min-w-0",
                )}
              >
                {title}
              </h1>

              <div className="flex gap-1">
                {/* Drag */}
                <WebviewButton
                  title="Drag"
                  disabled={!pinned}
                  className={dragHandleClass}
                >
                  <RiDraggable className="size-4" />
                </WebviewButton>

                {/* Edit Dialog */}
                <Dialog.Root
                  open={openEditAccountDialog}
                  onOpenChange={setOpenEditAccountDialog}
                >
                  {/* Edit Button */}
                  <Dialog.Trigger
                    disabled={isDesktop}
                    asChild
                    title="Edit Account"
                  >
                    <WebviewButton>
                      <MdOutlineEditNote className="size-4" />
                    </WebviewButton>
                  </Dialog.Trigger>

                  {/* Account Dialog */}
                  <EditAccountDialogContent
                    account={account}
                    close={closeEditAccountDialog}
                  />
                </Dialog.Root>

                {/* Close Button */}
                <WebviewButton
                  title="Close Account"
                  onClick={() => closeAccount(partition)}
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
                  "transition-transform duration-500",
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
        </Draggable>
      </div>
    </div>
  );
});
