import Input from "./Input";
import { Controller } from "react-hook-form";
import FormField from "./FormField";
import { memo } from "react";
import { safeField } from "../lib/utils";

/** A text input bound to a form field */
export default memo(function FormInputField({
  name,
  label,
  placeholder = label,
  className,
  disabled,
  children,
}) {
  return (
    <Controller
      name={name}
      render={({ field, fieldState }) => {
        /** The text input */
        const input = (
          <Input
            {...safeField(field)}
            autoComplete="off"
            placeholder={placeholder}
            disabled={disabled}
          />
        );

        return (
          <FormField
            label={label}
            error={fieldState.error?.message}
            className={className}
          >
            {children ? (
              <div className="flex gap-2 min-w-0">
                {input}
                {children}
              </div>
            ) : (
              input
            )}
          </FormField>
        );
      }}
    />
  );
});
