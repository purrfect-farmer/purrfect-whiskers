import { FormProvider, useWatch } from "react-hook-form";
import { HiOutlineQuestionMarkCircle, HiTag } from "react-icons/hi2";
import { memo, useMemo } from "react";

import CleanerTagItem from "./CleanerTagItem";
import SubmitButton from "./SubmitButton";
import { cn } from "../lib/utils";
import useTagsCleaner from "../hooks/useTagsCleaner";

/** A titled group of found tags */
const TagSection = ({ title, hint, children }) => (
  <section className="flex flex-col gap-2 min-w-0">
    <div className="flex flex-col">
      <h4 className="font-bold">{title}</h4>
      <p className="text-sm text-neutral-500 dark:text-neutral-400">{hint}</p>
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
            title={`Unused Tags (${unused.length})`}
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
            title={`Unknown Tags (${unknown.length})`}
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
          <p className="text-center text-neutral-500 dark:text-neutral-400">
            Every tag is in use and known.
          </p>
        )}
      </form>
    </FormProvider>
  );
}
