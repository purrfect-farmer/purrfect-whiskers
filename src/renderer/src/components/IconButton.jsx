import { memo } from "react";

import { cn } from "../lib/utils";

export default memo(function IconButton(props) {
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
        props.className
      )}
    />
  );
});
