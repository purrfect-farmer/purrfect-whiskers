import { HiOutlineChevronDown, HiOutlineChevronUp } from "react-icons/hi2";

import Input from "./Input";
import { NumberInputButton } from "./NumberInputButton";
import { useId } from "react";

/** A labelled number field with buttons for stepping its value up and down */
export const NumberInput = ({
  value,
  label,
  onChange,
  onStep,
  onBlur,
  disabled,
  readOnly = true,
  min = 1,
  max,
}) => {
  /** The id linking the label to the input */
  const id = useId();

  return (
    <div className="flex flex-col gap-2 min-w-0">
      <label htmlFor={id} className="text-neutral-500">
        {label}
      </label>

      <div className="flex gap-2 min-w-0">
        <Input
          id={id}
          type="number"
          min={min}
          max={max}
          value={value}
          readOnly={readOnly}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
        />

        <div className="flex flex-col gap-1 shrink-0">
          <NumberInputButton
            title={`Increase ${label}`}
            disabled={disabled}
            onClick={() => (onStep ? onStep(1) : onChange(parseInt(value) + 1))}
          >
            <HiOutlineChevronUp className="size-4 stroke-3" />
          </NumberInputButton>
          <NumberInputButton
            title={`Decrease ${label}`}
            disabled={disabled}
            onClick={() =>
              onStep ? onStep(-1) : onChange(parseInt(value) - 1)
            }
          >
            <HiOutlineChevronDown className="size-4 stroke-3" />
          </NumberInputButton>
        </div>
      </div>
    </div>
  );
};
