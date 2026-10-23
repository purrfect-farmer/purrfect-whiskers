import { cn, getTelegramUser, getTelegramUserFullName } from "../lib/utils";

import { HiTag } from "react-icons/hi2";
import { LiaUser } from "react-icons/lia";
import { memo } from "react";
import useSettingsStore from "../store/useSettingsStore";

/**
 * An account's avatar, title, Telegram name and tag marker.
 * `interactive` adds hover styles; `children` render at the end.
 */
export default memo(function AccountSummary({
  as: Component = "div",
  account,
  interactive = false,
  className,
  children,
  ...props
}) {
  const showAccountDetails = useSettingsStore(
    (state) => state.showAccountDetails,
  );

  const user = showAccountDetails ? getTelegramUser(account) : null;
  const userFullName = user ? getTelegramUserFullName(user) : "";

  const mutedClassName = cn(
    "text-neutral-500 dark:text-neutral-400",
    interactive && "group-hover:text-orange-900",
  );

  return (
    <Component
      {...props}
      className={cn(
        "bg-neutral-100 dark:bg-neutral-700",
        "grow min-w-0 flex items-center gap-2",
        "rounded-xl text-left",
        interactive && [
          "group",
          "hover:bg-orange-100 hover:text-orange-700",
          "dark:hover:bg-orange-200 dark:hover:text-orange-500",
        ],
        showAccountDetails ? "px-2 py-1" : "px-3 py-2",
        className,
      )}
    >
      {/* User */}
      {showAccountDetails ? (
        user?.["photo_url"] ? (
          <img
            src={user["photo_url"]}
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
          {userFullName ? (
            <span className={mutedClassName}>({userFullName})</span>
          ) : null}
        </h1>

        {/* Username */}
        {user?.["username"] ? (
          <h5 className={cn("truncate", mutedClassName)}>
            @{user["username"]}
          </h5>
        ) : null}
      </div>

      {account.tags?.length ? (
        <HiTag className="shrink-0 text-orange-500" />
      ) : null}

      {children}
    </Component>
  );
});
