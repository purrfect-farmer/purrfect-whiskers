import { memo } from "react";

import { cn } from "../lib/utils";

/** Solid marks the dialog's main action, neutral the steps leading to it */
const VARIANT_CLASSES = {
  solid: "bg-orange-500 text-white",
  neutral: "bg-neutral-100 dark:bg-neutral-700",
};

export default memo(function PrimaryButton({
  as: Component = "button",
  variant = "solid",
  ...props
}) {
  return (
    <Component
      {...props}
      className={cn(
        "px-4 py-2.5 rounded-xl",
        "w-full flex justify-center items-center gap-2",
        "font-bold",
        VARIANT_CLASSES[variant],
        "disabled:opacity-50",
        props.className
      )}
    />
  );
});
