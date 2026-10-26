import Toggle from "./Toggle";
import { cn } from "../lib/utils";
import { memo } from "react";

/** A found tag with a toggle choosing whether it is removed */
export default memo(function CleanerTagItem({
  id,
  icon: Icon,
  name,
  detail,
  checked,
  onToggle,
}) {
  return (
    <label
      className={cn(
        "flex items-center gap-2 p-2 rounded-xl cursor-pointer min-w-0",
        "bg-neutral-100 dark:bg-neutral-700",
        "has-[input:disabled]:opacity-60",
      )}
    >
      <Icon className="size-4 shrink-0 text-orange-500" />

      <span className="flex flex-col grow min-w-0">
        <span className="truncate">{name}</span>
        {detail ? (
          <span className="truncate text-xs text-neutral-500 dark:text-neutral-400">
            {detail}
          </span>
        ) : null}
      </span>

      <Toggle
        checked={checked}
        onChange={(ev) => onToggle(id, ev.target.checked)}
      />
    </label>
  );
});
