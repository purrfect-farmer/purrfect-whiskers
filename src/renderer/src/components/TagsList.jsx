import { HiTag } from "react-icons/hi2";
import { LuFilterX } from "react-icons/lu";
import { UNTAGGED_TAG } from "../lib/tags";
import { cn } from "../lib/utils";
import { memo, useMemo } from "react";

/** Counts the accounts carrying each tag, and those without any */
function countTags(accounts) {
  const counts = new Map([[UNTAGGED_TAG.id, 0]]);

  for (const account of accounts) {
    if (!account.tags?.length) {
      counts.set(UNTAGGED_TAG.id, counts.get(UNTAGGED_TAG.id) + 1);
    }

    for (const tagId of account.tags || []) {
      counts.set(tagId, (counts.get(tagId) || 0) + 1);
    }
  }

  return counts;
}

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
  const counts = useMemo(() => countTags(accounts), [accounts]);

  return (
    <div className="flex flex-wrap gap-1 empty:hidden">
      {tags.map((tag) => {
        const active = activeTag?.id === tag.id;
        const activeExcluded = active && excluded;
        const count = counts.get(tag.id) || 0;

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
              <HiTag
                className={cn(
                  "size-4 shrink-0",
                  active ? "text-white" : "text-orange-500",
                )}
              />
              <span className="truncate">
                {activeExcluded
                  ? `Not ${tag.name} (${accounts.length - count})`
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
