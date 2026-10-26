import { memo, useCallback, useMemo, useRef, useState } from "react";

import MoreTagsChip from "./MoreTagsChip";
import TagsList from "./TagsList";
import { formatNumber } from "../lib/utils";
import useChipFit from "../hooks/useChipFit";

/** The number of tag rows shown while collapsed */
const COLLAPSED_ROWS = 2;

/** The tag filters, fitted into two rows with a "+N" chip until expanded */
export default memo(function CollapsibleTags({
  accounts,
  tags,
  activeTag,
  selectTag,
  excluded,
  toggleExcluded,
  disabled,
}) {
  /** Whether every tag is shown */
  const [expanded, setExpanded] = useState(false);

  /** The invisible list measuring how many tags fit */
  const measureRef = useRef(null);

  /** The tags in display order, the active one first while collapsed */
  const orderedTags = useMemo(
    () =>
      !expanded && activeTag
        ? [activeTag, ...tags.filter((tag) => tag.id !== activeTag.id)]
        : tags,
    [expanded, activeTag, tags],
  );

  /** The number of tags that fit and the number left out */
  const { count, hidden } = useChipFit(
    measureRef,
    COLLAPSED_ROWS,
    orderedTags,
    accounts,
    expanded,
  );

  /** The tags shown */
  const shownTags = useMemo(
    () => (expanded ? orderedTags : orderedTags.slice(0, count)),
    [expanded, orderedTags, count],
  );

  /** The switch between showing every tag and the fitted rows */
  const toggleExpanded = useCallback(() => setExpanded((prev) => !prev), []);

  /** The props shared by the measuring and the visible list */
  const listProps = {
    accounts,
    activeTag,
    selectTag,
    excluded,
    toggleExcluded,
    disabled,
  };

  return (
    <div className="relative min-w-0">
      {/* Measuring list */}
      {!expanded ? (
        <div
          aria-hidden="true"
          inert
          className="invisible absolute inset-x-0 top-0 pointer-events-none"
        >
          <TagsList ref={measureRef} tags={orderedTags} {...listProps}>
            <MoreTagsChip label={`+${formatNumber(orderedTags.length)}`} />
          </TagsList>
        </div>
      ) : null}

      <TagsList tags={shownTags} {...listProps}>
        {expanded ? (
          <MoreTagsChip label="Show less" expanded onClick={toggleExpanded} />
        ) : hidden > 0 ? (
          <MoreTagsChip
            label={`+${formatNumber(hidden)}`}
            title={`Show ${formatNumber(hidden)} more tags`}
            expanded={false}
            onClick={toggleExpanded}
          />
        ) : null}
      </TagsList>
    </div>
  );
});
