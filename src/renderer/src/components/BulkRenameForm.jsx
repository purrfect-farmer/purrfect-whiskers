import { Controller, FormProvider, useWatch } from "react-hook-form";
import { HiArrowLongRight } from "react-icons/hi2";
import { RENAME_MODE, buildTitle } from "../lib/titles";
import { memo } from "react";

import NumberedTitleFields from "./NumberedTitleFields";
import SegmentedControl from "./SegmentedControl";

/** The options of the rename mode control */
const MODE_OPTIONS = [
  { value: RENAME_MODE.NUMBERED, label: "Numbered" },
  { value: RENAME_MODE.AFFIX, label: "Prefix / Suffix" },
];

/** The fields the preview watches */
const PREVIEW_FIELDS = ["mode", "prefix", "suffix", "startNumber", "padding"];

/** A row showing a title and its new title */
const PreviewRow = ({ from, to }) => (
  <li className="flex items-center gap-2 min-w-0">
    <span className="truncate min-w-0 basis-1/2 text-right">{from}</span>
    <HiArrowLongRight className="size-4 shrink-0 text-orange-500" />
    <span className="truncate min-w-0 basis-1/2 font-bold">{to}</span>
  </li>
);

/** A preview of the first and last renamed accounts */
const RenamePreview = memo(function RenamePreview({ accounts }) {
  const [mode, prefix, suffix, startNumber, padding] = useWatch({
    name: PREVIEW_FIELDS,
  });

  if (accounts.length === 0) {
    return (
      <p className="text-center text-neutral-500 dark:text-neutral-400">
        Select the accounts to rename.
      </p>
    );
  }

  /** The rename values being previewed */
  const values = { mode, prefix, suffix, startNumber, padding };
  /** The first and last accounts being previewed */
  const lastIndex = accounts.length - 1;
  const first = accounts[0];
  const last = accounts[lastIndex];

  return (
    <ul className="flex flex-col gap-1 p-2 rounded-xl bg-neutral-100 dark:bg-neutral-700">
      <PreviewRow from={first.title} to={buildTitle(first, 0, values)} />
      {lastIndex > 1 ? <li className="text-center">…</li> : null}
      {lastIndex > 0 ? (
        <PreviewRow
          from={last.title}
          to={buildTitle(last, lastIndex, values)}
        />
      ) : null}
    </ul>
  );
});

/** The title fields of the chosen rename mode */
const RenameFields = memo(function RenameFields() {
  const mode = useWatch({ name: "mode" });

  return <NumberedTitleFields numbered={mode === RENAME_MODE.NUMBERED} />;
});

/** A form for renaming the selected accounts */
export default memo(function BulkRenameForm({
  id,
  methods,
  onSubmit,
  selectedAccounts,
}) {
  return (
    <FormProvider {...methods}>
      <form id={id} onSubmit={onSubmit} className="flex flex-col gap-2 min-w-0">
        <Controller
          name="mode"
          render={({ field }) => (
            <SegmentedControl
              options={MODE_OPTIONS}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />

        <RenameFields />

        <RenamePreview accounts={selectedAccounts} />
      </form>
    </FormProvider>
  );
});
