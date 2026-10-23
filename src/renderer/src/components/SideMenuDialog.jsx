import { Dialog } from "radix-ui";
import { memo } from "react";

/** Side menu icon that opens a dialog */
export default memo(function SideMenuDialog({
  title,
  icon: Icon,
  open,
  onOpenChange,
  children,
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Trigger title={title} aria-label={title} className="p-2">
        <Icon className="size-5 text-orange-500" />
      </Dialog.Trigger>

      {children}
    </Dialog.Root>
  );
});
