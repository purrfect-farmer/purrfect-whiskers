import { Dialog } from "radix-ui";
import { HiOutlinePlus } from "react-icons/hi2";
import { Reorder } from "motion/react";
import { useMemo, useState } from "react";

import AddAccountDialog from "./AddAccountDialog";
import Input from "./Input";
import ReorderItem from "./ReorderItem";
import useAppStore from "../store/useAppStore";
import useDialogState from "../hooks/useDialogState";
import {
  cn,
  extractInitDataUnsafe,
  getTelegramUserFullName,
  searchIncludes,
} from "../lib/utils";
import { AccountItem } from "./AccountItem";

export default function AccountListDialog() {
  const [search, setSearch] = useState("");
  const accounts = useAppStore((state) => state.accounts);
  const setAccounts = useAppStore((state) => state.setAccounts);
  const launchAccount = useAppStore((state) => state.launchAccount);

  const list = useMemo(
    () =>
      search
        ? accounts.filter((item) => {
            const user = item.telegramInitData
              ? extractInitDataUnsafe(item.telegramInitData)["user"]
              : null;

            const fullName = user ? getTelegramUserFullName(user) : "";
            const username = user?.["username"] || "";
            const userId = user?.["id"] || "";

            return (
              searchIncludes(item.title, search) ||
              searchIncludes(fullName, search) ||
              searchIncludes(username, search) ||
              searchIncludes(userId, search)
            );
          })
        : accounts,
    [search, accounts]
  );

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
        <div className="p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="flex flex-col grow">
              {/* Title */}
              <Dialog.Title
                className={cn(
                  "leading-none font-bold font-turret-road",
                  "text-lg text-orange-500"
                )}
              >
                Accounts ({accounts.length})
              </Dialog.Title>

              {/* Description */}
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

          {/* Search Input */}
          <Input
            autoFocus
            type="search"
            placeholder={"Search"}
            value={search}
            onChange={(ev) => setSearch(ev.target.value)}
          />
        </div>

        {/* Account List */}
        <div className="flex flex-col px-4 pb-4 gap-2 grow overflow-auto">
          <Reorder.Group
            values={accounts}
            onReorder={(newOrder) => setAccounts(newOrder)}
            className="flex flex-col gap-2"
          >
            {list.map((item) => (
              <ReorderItem
                key={item.partition}
                value={item}
                disabled={Boolean(search)}
              >
                <AccountItem
                  account={item}
                  active={item.running}
                  onClick={() => launchAccount(item.partition)}
                />
              </ReorderItem>
            ))}
          </Reorder.Group>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  );
}
