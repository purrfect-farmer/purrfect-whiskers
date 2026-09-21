import {
  cn,
  extractInitDataUnsafe,
  getTelegramUserFullName,
} from "../lib/utils";

import Alert from "./Alert";
import AppDialogContent from "./AppDialogContent";
import { Dialog } from "radix-ui";
import { HiTag } from "react-icons/hi2";
import { LiaUser } from "react-icons/lia";
import { LuArrowUpDown } from "react-icons/lu";
import { Reorder } from "motion/react";
import ReorderItem from "./ReorderItem";
import useAppStore from "../store/useAppStore";
import { useMemo } from "react";
import useSettingsStore from "../store/useSettingsStore";

function ReorderAccountItem({ account }) {
  const showAccountDetails = useSettingsStore(
    (state) => state.showAccountDetails,
  );

  const user = useMemo(() => {
    if (account.telegramInitData) {
      return extractInitDataUnsafe(account.telegramInitData)["user"];
    } else {
      return null;
    }
  }, [account.telegramInitData]);

  const userFullName = useMemo(
    () => (user ? getTelegramUserFullName(user) : ""),
    [user],
  );

  return (
    <ReorderItem value={account}>
      <div
        className={cn(
          "bg-neutral-100 dark:bg-neutral-700",
          "grow min-w-0 flex items-center gap-2",
          "rounded-xl text-left",
          showAccountDetails ? "px-2 py-1" : "px-3 py-2",
        )}
      >
        {/* User */}
        {showAccountDetails ? (
          user?.["photo_url"] ? (
            <img
              src={user?.["photo_url"]}
              className="size-8 shrink-0 rounded-full"
              loading="lazy"
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
            {account.title}{" "}
            {showAccountDetails && userFullName ? (
              <span className="text-neutral-500 dark:text-neutral-400">
                ({userFullName})
              </span>
            ) : null}
          </h1>

          {/* Username */}
          {showAccountDetails && user?.["username"] ? (
            <h5 className="truncate text-neutral-500 dark:text-neutral-400">
              @{user["username"]}
            </h5>
          ) : null}
        </div>

        {account.tags?.length ? (
          <HiTag className="shrink-0 text-orange-500" />
        ) : null}
      </div>
    </ReorderItem>
  );
}

export default function AccountsReorderDialog() {
  const accounts = useAppStore((state) => state.accounts);
  const setAccounts = useAppStore((state) => state.setAccounts);

  return (
    <AppDialogContent
      title={"Reorder Accounts"}
      description={"Drag to reorder accounts"}
      icon={LuArrowUpDown}
    >
      {accounts.length === 0 ? (
        <Alert variant={"warning"}>
          No accounts added yet. Add an account to start reordering.
        </Alert>
      ) : (
        <>
          {/* Info Alert */}
          <Alert variant={"info"}>
            Drag an account by its handle to change its position. The order is
            saved automatically.
          </Alert>

          {/* Accounts List */}
          <Reorder.Group
            values={accounts}
            onReorder={setAccounts}
            className={cn(
              "flex flex-col gap-2",
              "max-h-96 overflow-auto -mx-2 px-2",
            )}
          >
            {accounts.map((item) => (
              <ReorderAccountItem key={item.partition} account={item} />
            ))}
          </Reorder.Group>
        </>
      )}

      {/* Close Dialog */}
      <Dialog.Close
        className={cn(
          "px-4 py-2.5 bg-orange-500 text-white rounded-xl",
          "mt-2 font-bold",
        )}
      >
        Close
      </Dialog.Close>
    </AppDialogContent>
  );
}
