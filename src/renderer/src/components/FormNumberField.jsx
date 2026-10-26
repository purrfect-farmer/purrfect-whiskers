import { Controller } from "react-hook-form";
import { NumberInput } from "./NumberInput";
import { memo, useState } from "react";

/** A parser for an integer clamped to `min`–`max` */
const toClampedInteger = (value, min, max) =>
  Math.max(min, Math.min(parseInt(value) || min, max));

/** A number input that keeps the typed text while it has focus */
const NumberFieldControl = memo(function NumberFieldControl({
  field,
  label,
  min,
  max,
  disabled,
}) {
  /** The text typed while the input has focus */
  const [draft, setDraft] = useState(null);

  /** The handler for typed text, showing the clamped value when out of range */
  const handleChange = (text) => {
    /** The typed number */
    const typed = parseInt(text);

    if (Number.isNaN(typed)) {
      setDraft(text);
      return;
    }

    /** The typed number within `min`–`max` */
    const value = toClampedInteger(text, min, max);

    setDraft(value === typed ? text : null);
    field.onChange(value);
  };

  /** The handler for the step buttons */
  const handleStep = (delta) => {
    setDraft(null);
    field.onChange(toClampedInteger(field.value + delta, min, max));
  };

  /** The handler for leaving the input */
  const handleBlur = () => {
    setDraft(null);
    field.onBlur();
  };

  return (
    <NumberInput
      label={label}
      value={draft ?? field.value}
      min={min}
      max={Number.isFinite(max) ? max : undefined}
      readOnly={false}
      disabled={disabled}
      onChange={handleChange}
      onStep={handleStep}
      onBlur={handleBlur}
    />
  );
});

/** A number input bound to a form field */
export default memo(function FormNumberField({
  name,
  label,
  min = 1,
  max = Infinity,
  description,
  disabled,
}) {
  return (
    <Controller
      name={name}
      render={({ field, fieldState }) => (
        <div className="flex flex-col gap-2 min-w-0">
          <NumberFieldControl
            field={field}
            label={label}
            min={min}
            max={max}
            disabled={disabled}
          />
          {description ? (
            <p className="text-neutral-500 dark:text-neutral-400">
              {description}
            </p>
          ) : null}
          {fieldState.error ? (
            <p className="text-red-500">{fieldState.error.message}</p>
          ) : null}
        </div>
      )}
    />
  );
});
