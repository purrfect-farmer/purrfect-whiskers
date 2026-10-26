import { memo, useCallback } from "react";

import { BADGE_TONE } from "../lib/constants";
import SectionBadge from "./SectionBadge";
import SectionHeader from "./SectionHeader";
import { formatNumber } from "../lib/utils";

/** A titled group of found tags, with their count, a hint and All/None */
export default memo(function CleanerTagSection({
  title,
  ids,
  skippedIds,
  hint,
  onSetChecked,
  children,
}) {
  /** Whether every tag of the section is checked */
  const allChecked = ids.every((id) => !skippedIds.has(id));

  /** The handler for checking or unchecking the whole section */
  const toggleAll = useCallback(
    () => onSetChecked(ids, !allChecked),
    [onSetChecked, ids, allChecked],
  );

  return (
    <section className="flex flex-col gap-2 min-w-0">
      <div className="flex flex-col min-w-0">
        <SectionHeader
          title={title}
          badge={
            <SectionBadge tone={BADGE_TONE.BLUE}>
              {formatNumber(ids.length)}
            </SectionBadge>
          }
        >
          <button
            type="button"
            onClick={toggleAll}
            className="px-2 py-1 rounded-lg font-bold text-orange-500"
          >
            {allChecked ? "Select None" : "Select All"}
          </button>
        </SectionHeader>
        <p className="text-neutral-500 dark:text-neutral-400">{hint}</p>
      </div>
      {children}
    </section>
  );
});
