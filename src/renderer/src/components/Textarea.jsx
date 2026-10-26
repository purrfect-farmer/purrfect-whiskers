import { memo } from "react";

import { cn } from "../lib/utils";

/** A styled multi-line text input */
export default memo(function Textarea(props) {
  return (
    <textarea
      rows={4}
      {...props}
      className={cn(
        "bg-neutral-100 dark:bg-neutral-700 w-full",
        "p-2.5 rounded-xl font-bold min-h-0 min-w-0 resize-y",
        "focus:outline-hidden focus:ring-3 focus:ring-orange-300",
        "disabled:opacity-50",
        props.className,
      )}
    />
  );
});
