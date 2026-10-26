import { Controller, FormProvider } from "react-hook-form";
import { memo } from "react";

import FormField from "./FormField";
import TagsInput from "./TagsInput";

/** A tags input bound to a form field */
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

/** A form for adding and removing tags on the selected accounts */
export default memo(function BulkTagsForm({ id, methods, onSubmit }) {
  return (
    <FormProvider {...methods}>
      <form id={id} onSubmit={onSubmit} className="flex flex-col gap-2 min-w-0">
        <TagsField name="add" label="Add Tags" />
        <TagsField
          name="remove"
          label="Remove Tags"
          allowCreate={false}
          placeholder="Remove Tag"
        />
      </form>
    </FormProvider>
  );
});
