import { memo } from "react";

import { cn } from "../lib/utils";

export default memo(function PrimaryButton({
  as: Component = "button",
  ...props
}) {
  return (
    <Component
      {...props}
      className={cn(
        "px-4 py-2.5 bg-orange-500 text-white rounded-xl",
        "font-bold",
        "w-full",
        "disabled:opacity-50",
        props.className
      )}
    />
  );
});
