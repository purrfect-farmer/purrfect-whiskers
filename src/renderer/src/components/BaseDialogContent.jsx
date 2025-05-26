import { Dialog } from "radix-ui";

import { cn } from "../lib/utils";

export default function BaseDialogContent({ children, ...props }) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 bg-black/50" />
      <Dialog.Content
        onOpenAutoFocus={(ev) => ev.preventDefault()}
        {...props}
        className={cn(
          "fixed top-1/2 left-1/2 w-[90vw] max-w-[450px]",
          "-translate-x-1/2 -translate-y-1/2",
          "flex flex-col gap-2",
          "rounded-2xl p-6",
          "bg-white dark:bg-neutral-800",
          props.className
        )}
      >
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  );
}
