import { memo } from "react";

import { cn } from "../lib/utils";

/** The classes of each button variant */
const VARIANT_CLASSES = {
  solid: [
    "bg-orange-500 text-white",
    "disabled:bg-neutral-200 disabled:text-neutral-400",
    "dark:disabled:bg-neutral-700 dark:disabled:text-neutral-500",
  ],
  neutral: ["bg-neutral-100 dark:bg-neutral-700", "disabled:opacity-50"],
  danger: ["bg-red-500 text-white", "disabled:opacity-50"],
};

/** A full-width button for a dialog's actions */
export default memo(function PrimaryButton({
  as: Component = "button",
  variant = "solid",
  type = Component === "button" ? "button" : undefined,
  ...props
}) {
  return (
    <Component
      type={type}
      {...props}
      className={cn(
        "px-4 py-2.5 rounded-xl",
        "w-full flex justify-center items-center gap-2",
        "font-bold",
        VARIANT_CLASSES[variant],
        props.className,
      )}
    />
  );
});
