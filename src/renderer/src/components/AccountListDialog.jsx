import { Dialog } from "radix-ui";
import { HiOutlineCheckBadge, HiOutlinePlus } from "react-icons/hi2";
import { LiaUser } from "react-icons/lia";
import { MdOutlineEditNote } from "react-icons/md";
import { Reorder } from "motion/react";
import { useMemo } from "react";

import AddAccountDialog from "./AddAccountDialog";
import EditAccountDialog from "./EditAccountDialog";
import ReorderItem from "./ReorderItem";
import useAppStore from "../store/useAppStore";
import useDialogState from "../hooks/useDialogState";
import useLaunchPartition from "../hooks/useLaunchPartition";
import useSettingsStore from "../store/useSettingsStore";
import { cn, extractInitDataUnsafe } from "../lib/utils";

const AccountEditDialog = ({ account }) => {
  const {
    opened: openEditAccountDialog,
    setOpened: setOpenEditAccountDialog,
    closeDialog: closeEditAccountDialog,
  } = useDialogState();

  return (
    <Dialog.Root
      open={openEditAccountDialog}
      onOpenChange={setOpenEditAccountDialog}
    >
      <Dialog.Trigger
        className={cn(
          "bg-neutral-100 dark:bg-neutral-700",
          "hover:bg-orange-100 hover:text-orange-700",
          "dark:hover:bg-orange-200 dark:hover:text-orange-500",
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

const AccountItem = ({ account, active, onClick }) => {
  const showAccountDetails = useSettingsStore(
    (state) => state.showAccountDetails
  );
  const user = useMemo(() => {
    if (account.telegramInitData) {
      return extractInitDataUnsafe(account.telegramInitData)["user"];
    } else {
      return null;
    }
  }, [account.telegramInitData]);

  const userFullName = useMemo(
    () =>
      user
        ? [user["first_name"], user["last_name"]].filter(Boolean).join(" ")
        : "",
    [user]
  );

  return (
    <div className="flex gap-2">
      <button
        key={account.partition}
        onClick={onClick}
        className={cn(
          "bg-neutral-100 dark:bg-neutral-700",
          "hover:bg-orange-100 hover:text-orange-700",
          "dark:hover:bg-orange-200 dark:hover:text-orange-500",
          "grow min-w-0 flex items-center gap-2",
          "rounded-xl text-left",
          "group",
          showAccountDetails ? "px-2 py-1" : "px-3 py-2"
        )}
      >
        {/* User  */}
        {showAccountDetails ? (
          user?.["photo_url"] ? (
            <img
              src={user?.["photo_url"]}
              className="size-8 shrink-0 rounded-full"
            />
          ) : (
            <div className="p-1 shrink-0">
              <LiaUser className="size-5" />
            </div>
          )
        ) : null}

        <div className="flex flex-col grow min-w-0">
          {/* Title */}
          <h1 className="font-bold truncate w-full">
            {account.title}
            {showAccountDetails && userFullName ? ` - ${userFullName}` : null}
          </h1>
          {/* Username */}
          {showAccountDetails && user?.["username"] ? (
            <h5
              className={cn(
                "truncate",
                "text-neutral-500 dark:text-neutral-400 group-hover:text-orange-800"
              )}
            >
              @{user["username"]}
            </h5>
          ) : null}
        </div>
        {active ? (
          <HiOutlineCheckBadge className="shrink-0 text-orange-500 size-4" />
        ) : null}
      </button>

      {/* Edit Dialog */}
      <AccountEditDialog account={account} />
    </div>
  );
};

export default function AccountListDialog() {
  const accounts = useAppStore((state) => state.accounts);
  const partitions = useAppStore((state) => state.partitions);
  const setAccounts = useAppStore((state) => state.setAccounts);
  const launchPartition = useLaunchPartition();

  const {
    opened: openAddAccountDialog,
    setOpened: setOpenAddAccountDialog,
    closeDialog: closeAddAccountDialog,
  } = useDialogState();

  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 bg-black/50" />
      <Dialog.Content
        onOpenAutoFocus={(ev) => ev.preventDefault()}
        className={cn(
          "fixed inset-y-0 left-0",
          "w-5/6 max-w-xs",
          "bg-white dark:bg-neutral-800",
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
            <Dialog.Description className="text-neutral-500 dark:text-neutral-400 leading-none">
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
                "dark:bg-orange-200 dark:text-orange-500",
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
                <AccountItem
                  account={item}
                  active={partitions.includes(item.partition)}
                  onClick={() => launchPartition(item.partition)}
                />
              </ReorderItem>
            ))}
          </Reorder.Group>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  );
}
