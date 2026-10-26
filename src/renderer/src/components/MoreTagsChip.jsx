import { cn } from "../lib/utils";
import { memo } from "react";

/** A chip at the end of the tag filters that shows or hides the rest */
export default memo(function MoreTagsChip({ label, title, expanded, onClick }) {
  return (
    <button
      type="button"
      title={title}
      aria-expanded={expanded}
      onClick={onClick}
      className={cn(
        "shrink-0 p-2 rounded-full font-bold",
        "bg-orange-100 text-orange-700",
        "dark:bg-orange-200 dark:text-orange-800",
      )}
    >
      {label}
    </button>
  );
});
