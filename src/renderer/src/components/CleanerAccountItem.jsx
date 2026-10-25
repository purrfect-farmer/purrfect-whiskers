import {
  SESSION_STATUS_COLORS,
  SESSION_STATUS_LABELS,
} from "../lib/sessionStatus";

import AccountSummary from "./AccountSummary";
import IconButton from "./IconButton";
import { LuPlay } from "react-icons/lu";
import Toggle from "./Toggle";
import { cn } from "../lib/utils";
import { memo } from "react";

/** A scanned account with its session status, toggle and launch button */
export default memo(function CleanerAccountItem({
  account,
  checked,
  disabled,
  onToggle,
  status,
  onLaunch,
}) {
  return (
    <div className="flex gap-2 min-w-0">
      <AccountSummary
        as="label"
        interactive
        account={account}
        className="relative cursor-pointer has-[input:disabled]:opacity-60"
      >
        <span
          className={cn(
            "min-w-0 truncate font-bold",
            SESSION_STATUS_COLORS[status],
          )}
        >
          {SESSION_STATUS_LABELS[status]}
        </span>

        <Toggle
          checked={checked}
          disabled={disabled}
          onChange={(ev) => onToggle(account.partition, ev.target.checked)}
        />
      </AccountSummary>

      <IconButton
        title="Launch account"
        aria-label={`Launch ${account.title}`}
        disabled={disabled}
        onClick={() => onLaunch(account.partition)}
      >
        <LuPlay className="size-4" />
      </IconButton>
    </div>
  );
});
