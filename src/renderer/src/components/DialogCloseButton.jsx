import { Dialog } from "radix-ui";
import { cn } from "../lib/utils";
import { memo } from "react";

const VARIANT_CLASSES = {
  solid: "bg-orange-500 text-white mt-2",
  outline: "border border-orange-500 text-orange-500",
};

/** Closes the surrounding dialog */
export default memo(function DialogCloseButton({
  variant = "solid",
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
