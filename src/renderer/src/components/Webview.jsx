import { Dialog } from "radix-ui";
import { HiOutlineGlobeAlt, HiOutlineXCircle } from "react-icons/hi2";
import { MdOutlineEditNote } from "react-icons/md";
import { memo, useEffect, useState } from "react";

import Browser from "./Browser";
import EditAccountDialog from "./EditAccountDialog";
import FarmerWebview from "./FarmerWebview";
import WebviewButton from "./WebviewButton";
import useAppStore from "../store/useAppStore";
import useDialogState from "../hooks/useDialogState";
import useSettingsStore from "../store/useSettingsStore";
import { cn } from "../lib/utils";
import { configureProxy } from "../lib/partitions";

export default memo(function Webview({ account }) {
  const {
    title,
    partition,
    proxyEnabled,
    proxyHost,
    proxyPort,
    proxyUsername,
    proxyPassword,
  } = account;

  const [showBrowser, setShowBrowser] = useState(false);
  const allowProxies = useSettingsStore((state) => state.allowProxies);
  const closePartition = useAppStore((state) => state.closePartition);

  /** Edit Account Dialog State */
  const {
    opened: openEditAccountDialog,
    setOpened: setOpenEditAccountDialog,
    closeDialog: closeEditAccountDialog,
  } = useDialogState();

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

  return (
    <div
      key={partition}
      className={cn(
        "grow flex flex-col shrink-0",
        "divide-y dark:divide-neutral-700"
      )}
    >
      <div className="flex gap-2 items-center justify-between p-2">
        {/* Toggle Browser */}
        <WebviewButton
          title="Toggle Browser"
          onClick={() => setShowBrowser((prev) => !prev)}
          className={showBrowser && "text-orange-500"}
        >
          <HiOutlineGlobeAlt className="size-4" />
        </WebviewButton>

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
            <Dialog.Trigger asChild title="Edit Account">
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
      <div className="grow flex flex-col overflow-clip">
        <div
          className={cn(
            "grow grid grid-rows-1 grid-flow-col auto-cols-[100%] translate-3d",
            "transition-transform duration-500",
            "-translate-x-(--translate)"
          )}
          style={{
            "--translate": showBrowser ? "100%" : "0%",
          }}
        >
          {/* Farmer Webview */}
          <FarmerWebview account={account} />

          {/* Browser */}
          <Browser account={account} />
        </div>
      </div>
    </div>
  );
});
