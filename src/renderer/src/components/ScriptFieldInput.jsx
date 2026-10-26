import { Controller } from "react-hook-form";
import { FIELD_TYPE } from "../../../shared/lib/scriptFields";
import FormField from "./FormField";
import FormInputField from "./FormInputField";
import FormNumberField from "./FormNumberField";
import LabelToggle from "./LabelToggle";
import Select from "./Select";
import Textarea from "./Textarea";
import { memo } from "react";
import { safeField } from "../lib/utils";

/** The input of one script field, chosen by its type */
export default memo(function ScriptFieldInput({ field, disabled }) {
  const { key, type, label, description, placeholder } = field;

  switch (type) {
    case FIELD_TYPE.NUMBER:
      return (
        <FormNumberField
          name={key}
          label={label}
          description={description}
          min={field.min}
          max={field.max ?? Infinity}
          disabled={disabled}
        />
      );

    case FIELD_TYPE.TEXT:
    case FIELD_TYPE.SECRET:
      return (
        <FormInputField
          name={key}
          label={label}
          description={description}
          placeholder={placeholder ?? label}
          type={type === FIELD_TYPE.SECRET ? "password" : "text"}
          disabled={disabled}
        />
      );

    case FIELD_TYPE.TEXTAREA:
      return (
        <Controller
          name={key}
          render={({ field: control, fieldState }) => (
            <FormField
              label={label}
              description={description}
              error={fieldState.error?.message}
            >
              <Textarea
                {...safeField(control)}
                placeholder={placeholder ?? label}
                disabled={disabled}
              />
            </FormField>
          )}
        />
      );

    case FIELD_TYPE.BOOLEAN:
      return (
        <Controller
          name={key}
          render={({ field: control }) => (
            <div className="flex flex-col gap-2 min-w-0">
              <LabelToggle
                name={control.name}
                checked={control.value}
                disabled={disabled}
                onBlur={control.onBlur}
                onChange={(event) => control.onChange(event.target.checked)}
              >
                {label}
              </LabelToggle>
              {description ? (
                <p className="text-neutral-500 dark:text-neutral-400">
                  {description}
                </p>
              ) : null}
            </div>
          )}
        />
      );

    case FIELD_TYPE.SELECT:
      return (
        <Controller
          name={key}
          render={({ field: control, fieldState }) => (
            <FormField
              label={label}
              description={description}
              error={fieldState.error?.message}
            >
              <Select {...safeField(control)} disabled={disabled}>
                {field.required ? null : <option value="">None</option>}
                {field.choices.map((choice) => (
                  <option key={choice.value} value={choice.value}>
                    {choice.label}
                  </option>
                ))}
              </Select>
            </FormField>
          )}
        />
      );

    default:
      return null;
  }
});
