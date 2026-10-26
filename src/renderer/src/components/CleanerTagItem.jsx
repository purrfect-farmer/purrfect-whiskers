import { memo, useCallback, useId, useState } from "react";

import { HiOutlineChevronDown } from "react-icons/hi2";
import Toggle from "./Toggle";
import { cn } from "../lib/utils";

/** The most account titles listed under an unknown tag */
const MAX_LISTED_ACCOUNTS = 20;

/** The accounts carrying a tag, listed under its row */
const TagAccounts = memo(function TagAccounts({ accounts }) {
  /** The accounts shown */
  const listed = accounts.slice(0, MAX_LISTED_ACCOUNTS);
  /** The number of accounts left out */
  const rest = accounts.length - listed.length;

  return (
    <ul
      className={cn(
        "flex flex-col gap-1 min-w-0 pl-8 pr-2 pb-2",
        "text-neutral-500 dark:text-neutral-400",
      )}
    >
      {listed.map((account) => (
        <li key={account.partition} className="truncate">
          {account.title}
        </li>
      ))}
      {rest > 0 ? <li>and {rest} more</li> : null}
    </ul>
  );
});

/** A found tag with a toggle, and the accounts carrying it when known */
export default memo(function CleanerTagItem({
  id,
  icon: Icon,
  name,
  detail,
  accounts = null,
  checked,
  onToggle,
}) {
  /** The id linking the name to the toggle */
  const inputId = useId();

  /** Whether the accounts are shown */
  const [expanded, setExpanded] = useState(false);

  /** The handler for showing or hiding the accounts */
  const toggleExpanded = useCallback(() => setExpanded((value) => !value), []);

  /** The handler for the toggle */
  const toggle = useCallback(
    (ev) => onToggle(id, ev.target.checked),
    [id, onToggle],
  );

  return (
    <div
      className={cn(
        "flex flex-col min-w-0 rounded-xl",
        "bg-neutral-100 dark:bg-neutral-700",
      )}
    >
      <div className="flex items-center gap-2 p-2 min-w-0">
        <Icon className="size-4 shrink-0 text-orange-500" />

        <label
          htmlFor={inputId}
          className="flex flex-col grow min-w-0 cursor-pointer"
        >
          <span className="truncate">{name}</span>
          <span
            className={cn(
              "truncate text-xs",
              "text-neutral-500 dark:text-neutral-400",
            )}
          >
            {detail}
          </span>
        </label>

        {accounts ? (
          <button
            type="button"
            title={expanded ? "Hide accounts" : "Show accounts"}
            aria-expanded={expanded}
            onClick={toggleExpanded}
            className={cn(
              "shrink-0 p-1.5 rounded-lg",
              "hover:bg-neutral-200 dark:hover:bg-neutral-600",
            )}
          >
            <HiOutlineChevronDown
              className={cn(
                "size-4 transition-transform",
                expanded && "rotate-180",
              )}
            />
          </button>
        ) : null}

        <label className="flex shrink-0 cursor-pointer">
          <Toggle id={inputId} checked={checked} onChange={toggle} />
        </label>
      </div>

      {accounts && expanded ? <TagAccounts accounts={accounts} /> : null}
    </div>
  );
});
