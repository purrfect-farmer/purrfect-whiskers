import { Controller, FormProvider } from "react-hook-form";
import { memo } from "react";

import FormField from "./FormField";
import SubmitButton from "./SubmitButton";
import TagsInput from "./TagsInput";
import useBulkTagsForm from "../hooks/useBulkTagsForm";

/** A tags input bound to a react-hook-form field */
const TagsField = ({ name, label, allowCreate, placeholder }) => (
  <Controller
    name={name}
    render={({ field, fieldState }) => (
      <FormField label={label} error={fieldState.error?.message}>
        <TagsInput
          value={field.value}
          onChange={field.onChange}
          allowCreate={allowCreate}
          placeholder={placeholder}
        />
      </FormField>
    )}
  />
);

/** Adds and removes tags on the selected accounts at once */
export default memo(function BulkTagsForm({ selectedAccounts }) {
  const { methods, onSubmit } = useBulkTagsForm(selectedAccounts);

  return (
    <FormProvider {...methods}>
      <form onSubmit={onSubmit} className="flex flex-col gap-2 min-w-0">
        <TagsField name="add" label="Add Tags" />
        <TagsField
          name="remove"
          label="Remove Tags"
          allowCreate={false}
          placeholder="Remove Tag"
        />

        <SubmitButton
          pendingText="Applying..."
          disabled={selectedAccounts.length === 0}
        >
          Apply Tags ({selectedAccounts.length})
        </SubmitButton>
      </form>
    </FormProvider>
  );
});
