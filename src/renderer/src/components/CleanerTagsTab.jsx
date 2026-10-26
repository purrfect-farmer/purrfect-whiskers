import { FormProvider, useWatch } from "react-hook-form";
import { HiOutlineQuestionMarkCircle, HiTag } from "react-icons/hi2";
import { memo, useMemo } from "react";

import Alert from "./Alert";
import CleanerTagItem from "./CleanerTagItem";
import SectionBadge from "./SectionBadge";
import SectionHeader from "./SectionHeader";
import SubmitButton from "./SubmitButton";
import { formatNumber } from "../lib/utils";
import { summarizeTagRemoval } from "../lib/tags";
import useTagsCleaner from "../hooks/useTagsCleaner";

/** A titled group of found tags, with their count, a hint and All/None */
const TagSection = ({
  title,
  ids,
  skippedIds,
  hint,
  onSetChecked,
  children,
}) => {
  /** Whether every tag of the section is checked */
  const allChecked = ids.every((id) => !skippedIds.has(id));

  return (
    <section className="flex flex-col gap-2 min-w-0">
      <div className="flex flex-col min-w-0">
        <SectionHeader
          title={title}
          badge={
            <SectionBadge tone="blue">{formatNumber(ids.length)}</SectionBadge>
          }
        >
          <button
            type="button"
            onClick={() => onSetChecked(ids, !allChecked)}
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
};

/** The found tags, what removing them does, and the remove button */
const FoundTags = memo(function FoundTags({
  unused,
  unknown,
  unknownAccounts,
  foundIds,
  toggleTag,
  setTagsChecked,
}) {
  /** The unchecked tag ids */
  const skipped = useWatch({ name: "skipped" });
  /** The set of unchecked tag ids */
  const skippedIds = useMemo(() => new Set(skipped), [skipped]);

  /** The ids of each section */
  const unusedIds = useMemo(() => unused.map((tag) => tag.id), [unused]);
  const unknownIds = useMemo(() => unknown.map((tag) => tag.id), [unknown]);

  /** The number of tags to remove */
  const removeCount = foundIds.filter((id) => !skippedIds.has(id)).length;

  /** What removing the checked tags does */
  const summary = useMemo(
    () =>
      summarizeTagRemoval({
        unused,
        unknown,
        unknownAccounts,
        skipped: skippedIds,
      }),
    [unused, unknown, unknownAccounts, skippedIds],
  );

  return (
    <>
      <div className="flex flex-col gap-4 max-h-96 overflow-auto -mx-2 px-2">
        {unused.length > 0 ? (
          <TagSection
            title="Unused Tags"
            ids={unusedIds}
            skippedIds={skippedIds}
            hint="In your tag list, but not on any account"
            onSetChecked={setTagsChecked}
          >
            {unused.map((tag) => (
              <CleanerTagItem
                key={tag.id}
                id={tag.id}
                icon={HiTag}
                name={tag.name}
                detail="On no account"
                checked={!skippedIds.has(tag.id)}
                onToggle={toggleTag}
              />
            ))}
          </TagSection>
        ) : null}

        {unknown.length > 0 ? (
          <TagSection
            title="Unknown Tags"
            ids={unknownIds}
            skippedIds={skippedIds}
            hint="On accounts, but not in your tag list"
            onSetChecked={setTagsChecked}
          >
            {unknown.map((tag) => (
              <CleanerTagItem
                key={tag.id}
                id={tag.id}
                icon={HiOutlineQuestionMarkCircle}
                name={tag.id}
                detail={`On ${formatNumber(tag.count)} account(s)`}
                accounts={unknownAccounts.get(tag.id)}
                checked={!skippedIds.has(tag.id)}
                onToggle={toggleTag}
              />
            ))}
          </TagSection>
        ) : null}
      </div>

      <p className="text-center text-neutral-500 dark:text-neutral-400">
        {summary}
      </p>

      <SubmitButton pendingText="Removing..." disabled={removeCount === 0}>
        Remove ({removeCount})
      </SubmitButton>
    </>
  );
});

/** The Cleaner tab for removing unused and unknown tags */
export default function CleanerTagsTab() {
  const {
    methods,
    onSubmit,
    unused,
    unknown,
    unknownAccounts,
    foundIds,
    toggleTag,
    setTagsChecked,
    tagCount,
    accountCount,
  } = useTagsCleaner();

  return (
    <FormProvider {...methods}>
      <form onSubmit={onSubmit} className="flex flex-col gap-2 min-w-0">
        {foundIds.length > 0 ? (
          <FoundTags
            unused={unused}
            unknown={unknown}
            unknownAccounts={unknownAccounts}
            foundIds={foundIds}
            toggleTag={toggleTag}
            setTagsChecked={setTagsChecked}
          />
        ) : (
          <Alert variant={"success"}>
            All clean! Checked {formatNumber(tagCount)} tag(s) and{" "}
            {formatNumber(accountCount)} account(s): every tag is on an account,
            and every tag on an account is in your tag list.
          </Alert>
        )}
      </form>
    </FormProvider>
  );
}
