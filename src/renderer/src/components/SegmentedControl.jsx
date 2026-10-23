import { cn } from "../lib/utils";
import { memo } from "react";

const GRID_COLUMNS = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
};

/**
 * A row of mutually exclusive options
 * @param {{options: {value: string, label: string, icon?: Function}[], value: string, onChange: (value: string) => void, disabled?: boolean}} props
 */
export default memo(function SegmentedControl({
  options,
  value,
  onChange,
  disabled,
}) {
  return (
    <div className={cn("grid gap-2", GRID_COLUMNS[options.length])}>
      {options.map((option) => {
        const selected = option.value === value;
        const Icon = option.icon;

        return (
          <button
            key={option.value}
            type="button"
            title={option.label}
            disabled={disabled}
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex items-center justify-center gap-2 min-w-0",
              "p-2 rounded-xl font-bold disabled:opacity-50",
              selected
                ? "bg-orange-500 text-white"
                : [
                    "bg-neutral-100 dark:bg-neutral-700",
                    "hover:bg-orange-100 hover:text-orange-700",
                    "dark:hover:bg-orange-200 dark:hover:text-orange-500",
                  ],
            )}
          >
            {Icon ? (
              <Icon
                className={cn(
                  "size-4 shrink-0",
                  selected ? "text-white" : "text-orange-500",
                )}
              />
            ) : null}
            <span className="truncate">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
});
