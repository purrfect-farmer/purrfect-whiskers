import { HiTag } from "react-icons/hi2";
import { cn } from "../lib/utils";
import { memo, useMemo } from "react";

/** Counts the accounts carrying each tag */
function countTags(accounts) {
  const counts = new Map();

  for (const account of accounts) {
    for (const tagId of account.tags || []) {
      counts.set(tagId, (counts.get(tagId) || 0) + 1);
    }
  }

  return counts;
}

export default memo(function TagsList({
  accounts,
  tags,
  activeTag,
  selectTag,
  disabled,
}) {
  const counts = useMemo(() => countTags(accounts), [accounts]);

  return (
    <div className="flex flex-wrap gap-1 empty:hidden">
      {tags.map((tag) => {
        const active = activeTag?.id === tag.id;

        return (
          <button
            key={tag.id}
            disabled={disabled}
            onClick={() => selectTag(tag.id)}
            className={cn(
              "flex items-center gap-1 min-w-0 max-w-full",
              "p-2 rounded-full disabled:opacity-60",
              active
                ? "bg-orange-500 text-white"
                : "bg-neutral-100 dark:bg-neutral-700",
            )}
          >
            <HiTag
              className={cn(
                "size-4 shrink-0",
                active ? "text-white" : "text-orange-500",
              )}
            />
            <span className="truncate">
              {tag.name} ({counts.get(tag.id) || 0})
            </span>
          </button>
        );
      })}
    </div>
  );
});
