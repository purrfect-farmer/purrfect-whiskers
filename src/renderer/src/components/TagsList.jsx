import { HiTag } from "react-icons/hi2";
import { LuFilterX } from "react-icons/lu";
import { TbTagOff } from "react-icons/tb";
import { UNTAGGED_TAG, countTagUsage } from "../lib/tags";
import { cn } from "../lib/utils";
import { memo, useMemo } from "react";

/**
 * Tag filter chips. The active chip has a button that switches it
 * between showing the accounts with the tag and those without it.
 */
export default memo(function TagsList({
  accounts,
  tags,
  activeTag,
  selectTag,
  excluded,
  toggleExcluded,
  disabled,
}) {
  const counts = useMemo(() => countTagUsage(accounts), [accounts]);

  return (
    <div className="flex flex-wrap gap-1 empty:hidden">
      {tags.map((tag) => {
        const active = activeTag?.id === tag.id;
        const activeExcluded = active && excluded;
        const count = counts.get(tag.id) || 0;

        /** Untagged has its own icon, unless excluded to show tagged ones */
        const Icon =
          tag.id === UNTAGGED_TAG.id && !activeExcluded ? TbTagOff : HiTag;

        return (
          <div
            key={tag.id}
            className={cn(
              "flex min-w-0 max-w-full rounded-full",
              "has-[button:disabled]:opacity-60",
              activeExcluded
                ? "bg-red-500 text-white"
                : active
                  ? "bg-orange-500 text-white"
                  : "bg-neutral-100 dark:bg-neutral-700",
            )}
          >
            <button
              type="button"
              disabled={disabled}
              aria-pressed={active}
              onClick={() => selectTag(tag.id)}
              className="flex items-center gap-1 min-w-0 p-2"
            >
              <Icon
                className={cn(
                  "size-4 shrink-0",
                  active ? "text-white" : "text-orange-500",
                )}
              />
              <span className="truncate">
                {activeExcluded
                  ? `${tag.excludedName ?? `Not ${tag.name}`} (${accounts.length - count})`
                  : `${tag.name} (${count})`}
              </span>
            </button>

            {/* Include / Exclude */}
            {active ? (
              <button
                type="button"
                disabled={disabled}
                aria-pressed={excluded}
                title={excluded ? "Include Tag" : "Exclude Tag"}
                onClick={toggleExcluded}
                className="shrink-0 p-2 border-l border-white/40"
              >
                <LuFilterX className="size-4" />
              </button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
});
