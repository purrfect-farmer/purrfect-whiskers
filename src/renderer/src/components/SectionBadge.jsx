import { cn } from "../lib/utils";
import { memo } from "react";

/** The colours of each badge tone */
const TONE_CLASSES = {
  neutral:
    "bg-neutral-200 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300",
  orange:
    "bg-orange-100 text-orange-700 dark:bg-orange-200 dark:text-orange-800",
  green: "bg-green-100 text-green-700 dark:bg-green-200 dark:text-green-800",
  red: "bg-red-100 text-red-700 dark:bg-red-200 dark:text-red-800",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-200 dark:text-amber-800",
};

/** A small pill next to a section title, for a count or a state */
export default memo(function SectionBadge({
  tone = "neutral",
  pulse = false,
  children,
}) {
  return (
    <span
      className={cn(
        "flex items-center gap-1 min-w-0",
        "px-2 py-0.5 rounded-full font-bold",
        TONE_CLASSES[tone],
      )}
    >
      {pulse ? (
        <span
          className={cn(
            "size-1.5 shrink-0 rounded-full",
            "bg-current animate-pulse",
          )}
        />
      ) : null}
      <span className="truncate">{children}</span>
    </span>
  );
});
