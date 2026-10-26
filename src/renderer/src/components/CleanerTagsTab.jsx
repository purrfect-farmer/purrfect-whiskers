import { FormProvider, useWatch } from "react-hook-form";
import { HiOutlineQuestionMarkCircle, HiTag } from "react-icons/hi2";
import { memo, useMemo } from "react";

import Alert from "./Alert";
import CleanerTagItem from "./CleanerTagItem";
import SubmitButton from "./SubmitButton";
import { cn, formatNumber } from "../lib/utils";
import SectionBadge from "./SectionBadge";
import SectionHeader from "./SectionHeader";
import useTagsCleaner from "../hooks/useTagsCleaner";

/** A titled group of found tags, with their count and a hint */
const TagSection = ({ title, count, hint, children }) => (
  <section className="flex flex-col gap-2 min-w-0">
    <div className="flex flex-col">
      <SectionHeader
        title={title}
        badge={<SectionBadge tone="blue">{formatNumber(count)}</SectionBadge>}
      />
      <p className="text-neutral-500 dark:text-neutral-400">{hint}</p>
    </div>
    {children}
  </section>
);

/** The found tags and the remove button */
const FoundTags = memo(function FoundTags({
  unused,
  unknown,
  foundIds,
  toggleTag,
}) {
  /** The unchecked tag ids */
  const skipped = useWatch({ name: "skipped" });
  /** The set of unchecked tag ids */
  const skippedIds = useMemo(() => new Set(skipped), [skipped]);

  /** The number of tags to remove */
  const removeCount = foundIds.filter((id) => !skippedIds.has(id)).length;

  return (
    <>
      <div
        className={cn(
          "flex flex-col gap-4",
          "max-h-96 overflow-auto -mx-2 px-2",
        )}
      >
        {unused.length > 0 ? (
          <TagSection
            title="Unused Tags"
            count={unused.length}
            hint="Not on any account"
          >
            {unused.map((tag) => (
              <CleanerTagItem
                key={tag.id}
                id={tag.id}
                icon={HiTag}
                name={tag.name}
                checked={!skippedIds.has(tag.id)}
                onToggle={toggleTag}
              />
            ))}
          </TagSection>
        ) : null}

        {unknown.length > 0 ? (
          <TagSection
            title="Unknown Tags"
            count={unknown.length}
            hint="On accounts but not in your tag list"
          >
            {unknown.map((tag) => (
              <CleanerTagItem
                key={tag.id}
                id={tag.id}
                icon={HiOutlineQuestionMarkCircle}
                name={tag.id}
                detail={`On ${tag.count} account(s)`}
                checked={!skippedIds.has(tag.id)}
                onToggle={toggleTag}
              />
            ))}
          </TagSection>
        ) : null}
      </div>

      <SubmitButton pendingText="Removing..." disabled={removeCount === 0}>
        Remove ({removeCount})
      </SubmitButton>
    </>
  );
});

/** The Cleaner tab for removing unused and unknown tags */
export default function CleanerTagsTab() {
  const { methods, onSubmit, unused, unknown, foundIds, toggleTag } =
    useTagsCleaner();

  return (
    <FormProvider {...methods}>
      <form onSubmit={onSubmit} className="flex flex-col gap-2 min-w-0">
        {foundIds.length > 0 ? (
          <FoundTags
            unused={unused}
            unknown={unknown}
            foundIds={foundIds}
            toggleTag={toggleTag}
          />
        ) : (
          <Alert variant={"success"}>
            All clean! Every tag is on at least one account, and every tag on
            your accounts is in your tag list.
          </Alert>
        )}
      </form>
    </FormProvider>
  );
}
