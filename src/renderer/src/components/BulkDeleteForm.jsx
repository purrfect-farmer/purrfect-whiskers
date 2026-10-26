import { Controller, FormProvider } from "react-hook-form";
import { memo } from "react";

import Alert from "./Alert";
import FormInputField from "./FormInputField";
import LabelToggle from "./LabelToggle";
import { Progress } from "./Progress";

/** The note under the backup toggle when it is on */
const BACKUP_ON_NOTE =
  "Saves the accounts to the backup folder before deleting; restore them " +
  "with Import. Accounts that can't be backed up are kept.";

/** The note under the backup toggle when it is off */
const BACKUP_OFF_NOTE = "The accounts are deleted without a backup.";

/** A form for deleting the selected accounts, with an optional backup */
export default memo(function BulkDeleteForm({
  id,
  methods,
  onSubmit,
  count,
  isBackingUp,
  target,
  progress,
}) {
  return (
    <FormProvider {...methods}>
      <form id={id} onSubmit={onSubmit} className="flex flex-col gap-2 min-w-0">
        <Alert variant={"danger"}>
          {count > 0
            ? `${count} account(s) will be deleted with all their data.`
            : "Select the accounts to delete."}{" "}
          This can't be undone.
        </Alert>

        <Controller
          name="backup"
          render={({ field }) => (
            <div className="flex flex-col gap-2 min-w-0">
              <LabelToggle
                name={field.name}
                checked={field.value}
                onBlur={field.onBlur}
                onChange={(event) => field.onChange(event.target.checked)}
              >
                Back up first
              </LabelToggle>
              <p className="text-neutral-500 dark:text-neutral-400">
                {field.value ? BACKUP_ON_NOTE : BACKUP_OFF_NOTE}
              </p>
            </div>
          )}
        />

        <FormInputField
          name="confirmation"
          label={`Type "delete" to confirm`}
          placeholder="delete"
        />

        {isBackingUp ? <Progress current={progress} max={target} /> : null}
      </form>
    </FormProvider>
  );
});
