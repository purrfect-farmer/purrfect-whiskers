import { HiOutlineQuestionMarkCircle, HiTag } from "react-icons/hi2";
import { memo, useMemo } from "react";

import CleanerTagItem from "./CleanerTagItem";
import CleanerTagSection from "./CleanerTagSection";
import SubmitButton from "./SubmitButton";
import { formatNumber } from "../lib/utils";
import { summarizeTagRemoval } from "../lib/tags";
import { useWatch } from "react-hook-form";

/** The found tags, what removing them does, and the remove button */
export default memo(function CleanerFoundTags({
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
          <CleanerTagSection
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
          </CleanerTagSection>
        ) : null}

        {unknown.length > 0 ? (
          <CleanerTagSection
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
          </CleanerTagSection>
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
