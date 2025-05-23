import { Dialog } from "radix-ui";
import { HiOutlineCheckBadge, HiOutlinePlus } from "react-icons/hi2";
import { MdOutlineEditNote } from "react-icons/md";
import { Reorder } from "motion/react";
import { useCallback, useState } from "react";

import AddAccountDialog from "./AddAccountDialog";
import EditAccountDialog from "./EditAccountDialog";
import ReorderItem from "./ReorderItem";
import useAppStore from "../store/useAppStore";
import { cn } from "../lib/utils";

const AccountEditDialog = ({ account }) => {
  const [openEditAccountDialog, setOpenEditAccountDialog] = useState(false);
  const closeEditAccountDialog = useCallback(
    () => setOpenEditAccountDialog(false),
    [setOpenEditAccountDialog]
  );

  return (
    <Dialog.Root
      open={openEditAccountDialog}
      onOpenChange={setOpenEditAccountDialog}
    >
      <Dialog.Trigger
        className={cn(
          "bg-neutral-100",
          "hover:bg-orange-100 hover:text-orange-700",
          "flex items-center justify-center",
          "px-3 rounded-xl shrink-0"
        )}
      >
        <MdOutlineEditNote className="size-4" />
      </Dialog.Trigger>
      <EditAccountDialog account={account} close={closeEditAccountDialog} />
    </Dialog.Root>
  );
};

export default function AccountListDialog() {
  const accounts = useAppStore((state) => state.accounts);
  const partitions = useAppStore((state) => state.partitions);
  const setAccounts = useAppStore((state) => state.setAccounts);
  const launchPartition = useAppStore((state) => state.launchPartition);

  const [openAddAccountDialog, setOpenAddAccountDialog] = useState(false);
  const closeAddAccountDialog = useCallback(
    () => setOpenAddAccountDialog(false),
    [setOpenAddAccountDialog]
  );

  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 bg-black/50" />
      <Dialog.Content
        onOpenAutoFocus={(ev) => ev.preventDefault()}
        className={cn(
          "fixed inset-y-0 left-0",
          "w-5/6 max-w-xs",
          "bg-white",
          "flex flex-col"
        )}
      >
        <div className="flex items-center gap-2 p-4">
          <div className="flex flex-col grow">
            <Dialog.Title
              className={cn(
                "leading-none font-bold font-turret-road",
                "text-lg text-orange-500"
              )}
            >
              Accounts
            </Dialog.Title>
            <Dialog.Description className="text-neutral-500 leading-none">
              Select an account
            </Dialog.Description>
          </div>

          {/* Add Account */}
          <Dialog.Root
            open={openAddAccountDialog}
            onOpenChange={setOpenAddAccountDialog}
          >
            <Dialog.Trigger
              title="Add Account"
              className={cn(
                "shrink-0",
                "bg-orange-100 text-orange-700",
                "flex items-center gap-2",
                "p-2 px-3 rounded-xl text-left",
                "font-bold"
              )}
            >
              <HiOutlinePlus className="size-5 text-orange-500" />
            </Dialog.Trigger>

            <AddAccountDialog close={closeAddAccountDialog} />
          </Dialog.Root>
        </div>

        <div className="flex flex-col px-4 pb-4 gap-2 grow overflow-auto">
          <Reorder.Group
            values={accounts}
            onReorder={(newOrder) => setAccounts(newOrder)}
            className="flex flex-col gap-2"
          >
            {accounts.map((item) => (
              <ReorderItem key={item.partition} value={item}>
                <div className="flex gap-2">
                  <button
                    key={item.partition}
                    onClick={() => launchPartition(item.partition)}
                    className={cn(
                      "bg-neutral-100",
                      "hover:bg-orange-100 hover:text-orange-700",
                      "grow flex items-center gap-2",
                      "p-2 px-3 rounded-xl text-left",
                      "font-bold"
                    )}
                  >
                    {item.title}{" "}
                    {partitions.includes(item.partition) ? (
                      <HiOutlineCheckBadge className="ms-auto text-orange-500 size-4" />
                    ) : null}
                  </button>

                  {/* Edit Dialog */}
                  <AccountEditDialog account={item} />
                </div>
              </ReorderItem>
            ))}
          </Reorder.Group>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  );
}
