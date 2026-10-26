import { BADGE_TONE } from "../lib/constants";
import { cn } from "../lib/utils";
import { memo } from "react";

/** The colours of each badge tone */
const TONE_CLASSES = {
  [BADGE_TONE.NEUTRAL]: [
    "bg-neutral-200 text-neutral-700",
    "dark:bg-neutral-700 dark:text-neutral-300",
  ],
  [BADGE_TONE.ORANGE]: [
    "bg-orange-100 text-orange-700",
    "dark:bg-orange-200 dark:text-orange-800",
  ],
  [BADGE_TONE.BLUE]: [
    "bg-sky-100 text-sky-700",
    "dark:bg-sky-200 dark:text-sky-800",
  ],
  [BADGE_TONE.GREEN]: [
    "bg-green-100 text-green-700",
    "dark:bg-green-200 dark:text-green-800",
  ],
  [BADGE_TONE.RED]: [
    "bg-red-100 text-red-700",
    "dark:bg-red-200 dark:text-red-800",
  ],
  [BADGE_TONE.PURPLE]: [
    "bg-purple-100 text-purple-700",
    "dark:bg-purple-200 dark:text-purple-800",
  ],
};

/** A small pill next to a section title, for a count or a state */
export default memo(function SectionBadge({
  tone = BADGE_TONE.NEUTRAL,
  children,
}) {
  return (
    <span
      className={cn(
        "flex items-center min-w-0",
        "px-2 py-0.5 rounded-full font-bold",
        TONE_CLASSES[tone],
      )}
    >
      <span className="truncate">{children}</span>
    </span>
  );
});
