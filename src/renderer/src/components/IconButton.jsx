import { memo } from "react";

import { cn } from "../lib/utils";

/** A square button for an icon, highlighted while `active` */
export default memo(function IconButton({
  active = false,
  className,
  ...props
}) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "bg-neutral-100 dark:bg-neutral-700",
        "hover:bg-orange-100 hover:text-orange-700",
        "dark:hover:bg-orange-200 dark:hover:text-orange-500",
        "flex items-center justify-center shrink-0",
        "p-2.5 rounded-xl",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        active && [
          "bg-orange-100 text-orange-700",
          "dark:bg-orange-200 dark:text-orange-500",
        ],
        className,
      )}
    />
  );
});
