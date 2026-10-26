import {
  Controller,
  FormProvider,
  useFormState,
  useWatch,
} from "react-hook-form";
import { memo, useCallback } from "react";

import AccountsPicker from "./AccountsPicker";
import Alert from "./Alert";
import Dropzone from "./Dropzone";
import FormField from "./FormField";
import { LuFileJson } from "react-icons/lu";
import SubmitButton from "./SubmitButton";
import TagsInput from "./TagsInput";

/** The file types the dropzone accepts */
const JSON_FILES = { "application/json": [".json"] };

/** The picked file, its skipped count or its error */
const PickedFile = memo(function PickedFile({ skippedCount }) {
  const file = useWatch({ name: "file" });
  const { errors } = useFormState({ name: "file" });

  if (errors.file) {
    return <p className="text-center text-red-500">{errors.file.message}</p>;
  }

  if (!file) return null;

  return (
    <div className="flex flex-col gap-1 min-w-0">
      <p className="flex items-center justify-center gap-2 min-w-0">
        <LuFileJson className="size-4 shrink-0 text-orange-500" />
        <span className="truncate font-bold">{file.name}</span>
        <span className="shrink-0">({file.accounts.length} accounts)</span>
      </p>

      {skippedCount > 0 ? (
        <p className="text-center text-neutral-500 dark:text-neutral-400">
          {skippedCount} account(s) already in the app will be skipped.
        </p>
      ) : null}
    </div>
  );
});

/** A form for importing accounts from a file */
export default memo(function AccountsImportForm({
  methods,
  onSubmit,
  pickFile,
  selector,
  skippedCount,
  isProcessing,
}) {
  /** The handler for a dropped file */
  const onDrop = useCallback(([file]) => pickFile(file), [pickFile]);

  /** The number of accounts to import */
  const importCount = selector.selectedAccounts.length;

  return (
    <FormProvider {...methods}>
      <form onSubmit={onSubmit} className="flex flex-col gap-2 min-w-0">
        <Alert variant={"warning"} className="text-center">
          You are about to import new accounts into the application. Their tags
          are not imported; choose the tags to give them below.
        </Alert>

        <Dropzone
          accept={JSON_FILES}
          onDrop={onDrop}
          disabled={isProcessing}
          fileLabel="accounts file"
        />

        <PickedFile skippedCount={skippedCount} />

        {selector.accounts.length > 0 ? (
          <AccountsPicker
            {...selector}
            showTags={false}
            disabled={isProcessing}
          />
        ) : null}

        {/* Tags */}
        <FormField label="Tags">
          <Controller
            name="tags"
            render={({ field }) => (
              <TagsInput
                value={field.value}
                onChange={field.onChange}
                disabled={isProcessing}
              />
            )}
          />
        </FormField>

        <SubmitButton
          pendingText="Importing..."
          disabled={isProcessing || importCount === 0}
        >
          Import ({importCount})
        </SubmitButton>
      </form>
    </FormProvider>
  );
});
