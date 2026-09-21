import {
  cn,
  extractInitDataUnsafe,
  getTelegramUserFullName,
} from "../lib/utils";

import { HiTag } from "react-icons/hi2";
import { LiaUser } from "react-icons/lia";
import { useMemo } from "react";
import useSettingsStore from "../store/useSettingsStore";

/**
 * The account row body shared by every reorder implementation - it carries no
 * reordering behaviour of its own, so a new implementation only has to supply
 * its own controls around it.
 */
export default function AccountsReorderItem({ account, className }) {
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
    <div
      className={cn(
        "bg-neutral-100 dark:bg-neutral-700",
        "grow min-w-0 flex items-center gap-2",
        "rounded-xl text-left",
        showAccountDetails ? "px-2 py-1" : "px-3 py-2",
        className,
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
  );
}
