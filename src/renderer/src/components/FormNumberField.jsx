import { Controller } from "react-hook-form";
import { NumberInput } from "./NumberInput";
import { memo, useState } from "react";

/** Parses `value` as an integer clamped to `min`–`max` */
const toClampedInteger = (value, min, max) =>
  Math.max(min, Math.min(parseInt(value) || min, max));

/**
 * Keeps the typed text while focused, so the field can be cleared and
 * retyped. Each parsable value is stored clamped, and the text settles
 * on the stored value on blur.
 */
const NumberFieldControl = memo(function NumberFieldControl({
  field,
  label,
  min,
  max,
  disabled,
}) {
  const [draft, setDraft] = useState(null);

  const handleChange = (text) => {
    setDraft(text);

    if (!Number.isNaN(parseInt(text))) {
      field.onChange(toClampedInteger(text, min, max));
    }
  };

  const handleStep = (delta) => {
    setDraft(null);
    field.onChange(toClampedInteger(field.value + delta, min, max));
  };

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

/** A number input bound to a react-hook-form field, clamped to `min`–`max` */
export default memo(function FormNumberField({
  name,
  label,
  min = 1,
  max = Infinity,
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
          {fieldState.error ? (
            <p className="text-red-500">{fieldState.error.message}</p>
          ) : null}
        </div>
      )}
    />
  );
});
