import { HiTag } from "react-icons/hi2";
import { LuFilterX } from "react-icons/lu";
import { TbTagOff } from "react-icons/tb";
import { UNTAGGED_TAG, countTagUsage } from "../lib/tags";
import { cn } from "../lib/utils";
import { memo, useMemo } from "react";

/** A list of tag filter buttons with their account counts */
export default memo(function TagsList({
  accounts,
  tags,
  activeTag,
  selectTag,
  excluded,
  toggleExcluded,
  disabled,
  ref,
  className,
  style,
  children,
}) {
  /** The number of accounts for each tag */
  const counts = useMemo(() => countTagUsage(accounts), [accounts]);

  return (
    <div
      ref={ref}
      style={style}
      className={cn("flex flex-wrap gap-1 empty:hidden", className)}
    >
      {tags.map((tag) => {
        /** Whether the tag is the active filter */
        const active = activeTag?.id === tag.id;
        /** Whether the active tag is excluded */
        const activeExcluded = active && excluded;
        /** The number of accounts with the tag */
        const count = counts.get(tag.id) || 0;

        /** The tag's icon */
        const Icon =
          tag.id === UNTAGGED_TAG.id && !activeExcluded ? TbTagOff : HiTag;

        /** The excluded name of the tag */
        const excludedName = tag.excludedName ?? `Not ${tag.name}`;

        /** The chip's text with its account count */
        const label = activeExcluded
          ? `${excludedName} (${accounts.length - count})`
          : `${tag.name} (${count})`;

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
              <span className="truncate">{label}</span>
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
      {children}
    </div>
  );
});
