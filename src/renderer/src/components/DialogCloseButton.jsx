import { Dialog } from "radix-ui";
import { cn } from "../lib/utils";
import { memo } from "react";

/** The classes of each button variant */
const VARIANT_CLASSES = {
  neutral: "bg-neutral-100 dark:bg-neutral-700",
  outline: "border border-orange-500 text-orange-500",
};

/** A button that closes the surrounding dialog */
export default memo(function DialogCloseButton({
  variant = "neutral",
  className,
  children = "Close",
}) {
  return (
    <Dialog.Close
      className={cn(
        "px-4 py-2.5 rounded-xl font-bold",
        VARIANT_CLASSES[variant],
        className,
      )}
    >
      {children}
    </Dialog.Close>
  );
});
