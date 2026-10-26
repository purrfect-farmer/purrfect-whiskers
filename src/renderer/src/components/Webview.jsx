import { HiOutlineGlobeAlt, HiOutlineXCircle } from "react-icons/hi2";
import { MdOutlineEditNote, MdOutlineFullscreen } from "react-icons/md";
import { memo, useMemo, useRef } from "react";

import AccountFlash from "./AccountFlash";
import Browser from "./Browser";
import { Dialog } from "radix-ui";
import Draggable from "react-draggable";
import EditAccountDialogContent from "./EditAccountDialogContent";
import FarmerWebview from "./FarmerWebview";
import WebviewButton from "./WebviewButton";
import { cn } from "../lib/utils";
import useAccount from "../hooks/useAccount";
import useAccountProxy from "../hooks/useAccountProxy";
import { useAppContext } from "../providers/AppProvider";
import useAppStore from "../store/useAppStore";
import useBrowser from "../hooks/useBrowser";
import useDialogState from "../hooks/useDialogState";
import useElementFullscreen from "../hooks/useElementFullscreen";
import usePinnable from "../hooks/usePinnable";
import useSettingsStore from "../store/useSettingsStore";

/** A window for the account in a partition */
export default memo(function Webview({ partition, pageIndex }) {
  /** The account in the partition */
  const account = useAccount(partition);

  if (!account) return null;

  return <AccountWindow account={account} pageIndex={pageIndex} />;
});

/** A window with an account's toolbar, farmer webview and browser */
const AccountWindow = memo(function AccountWindow({ account, pageIndex }) {
  const { title, partition } = account;
  /** The ref of the window container */
  const containerRef = useRef(null);

  const { currentPage } = useAppContext();
  const rows = useSettingsStore((state) => state.rows);
  const closeAccount = useAppStore((state) => state.closeAccount);

  /** The account's browser state */
  const browser = useBrowser(partition);
  /** The pinned state and position of the window */
  const { pinned, position, togglePinned, handleDrag } = usePinnable();
  /** The fullscreen state of the window */
  const { isFullscreen, toggleFullscreen } = useElementFullscreen(containerRef);

  /** Keeps a pinned window in view across pages */
  const pinnedStyle = useMemo(
    () => ({
      "--pinned-translation": pinned
        ? `${(currentPage - pageIndex) * rows * 100}%`
        : 0,
    }),
    [pinned, currentPage, pageIndex, rows],
  );

  /** The open state of the edit account dialog */
  const {
    opened: openEditAccountDialog,
    setOpened: setOpenEditAccountDialog,
    closeDialog: closeEditAccountDialog,
  } = useDialogState();

  useAccountProxy(account);

  return (
    <div className="grow flex flex-col relative min-w-0">
      {pinned && (
        <div className="grow flex flex-col gap-2 justify-center items-center p-4">
          <h1 className="text-xl text-orange-500 max-w-full truncate">
            {title}
          </h1>
          <p>This account is currently pinned</p>
        </div>
      )}
      <div
        className={cn(
          "grow flex flex-col",
          pinned
            ? [
                "transition-transform duration-500",
                "translate-y-(--pinned-translation)",
                "z-999 absolute inset-0",
                "pointer-events-none",
              ]
            : null,
        )}
        style={pinnedStyle}
      >
        <Draggable
          handle=".draggable-handle"
          disabled={!pinned}
          nodeRef={containerRef}
          position={position}
          onDrag={handleDrag}
        >
          <div
            ref={containerRef}
            className={cn(
              "relative grow flex flex-col shrink-0",
              "divide-y dark:divide-neutral-700",
              "bg-white dark:bg-neutral-800 dark:text-white",
              pinned
                ? ["border border-orange-500", "pointer-events-auto"]
                : null,
            )}
          >
            <div className="flex justify-between px-2 min-w-0">
              <div className="flex gap-1 py-2 shrink-0">
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
                  onClick={toggleFullscreen}
                  className={isFullscreen && "text-orange-500"}
                >
                  <MdOutlineFullscreen className="size-4" />
                </WebviewButton>
              </div>

              {/* Title */}
              <div
                role="button"
                className={cn(
                  "draggable-handle",
                  "flex justify-center items-center grow min-w-0 px-2",
                )}
              >
                <h1
                  title={title}
                  className={cn(
                    "text-orange-500 truncate font-bold text-center grow min-w-0",
                  )}
                >
                  {title}
                </h1>
              </div>

              <div className="flex gap-1 py-2 shrink-0">
                {/* Edit Dialog */}
                <Dialog.Root
                  open={openEditAccountDialog}
                  onOpenChange={setOpenEditAccountDialog}
                >
                  {/* Edit Button */}
                  <Dialog.Trigger
                    disabled={isFullscreen}
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
                <FarmerWebview
                  pinned={pinned}
                  togglePinned={togglePinned}
                  account={account}
                />

                {/* Browser */}
                {browser.enabled ? (
                  <Browser browser={browser} partition={partition} />
                ) : null}
              </div>
            </div>

            {/* Flash when asked to open */}
            <AccountFlash partition={partition} />
          </div>
        </Draggable>
      </div>
    </div>
  );
});
