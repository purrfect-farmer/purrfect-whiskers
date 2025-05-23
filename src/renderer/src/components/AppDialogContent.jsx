import { Dialog } from "radix-ui";
import { memo } from "react";

import { cn } from "../lib/utils";

export default memo(function ({ icon: Icon, title, description, children }) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 bg-black/50" />
      <Dialog.Content
        onOpenAutoFocus={(ev) => ev.preventDefault()}
        className={cn(
          "fixed top-1/2 left-1/2 w-[90vw] max-w-[450px]",
          "-translate-x-1/2 -translate-y-1/2",
          "flex flex-col gap-2",
          "rounded-2xl p-6",
          "bg-white"
        )}
      >
        <Icon className="size-10 mx-auto text-orange-500" />

        <div className="flex flex-col gap-px">
          <Dialog.Title className="text-xl font-bold font-turret-road text-orange-500 text-center">
            {title}
          </Dialog.Title>
          <Dialog.Description className="text-center text-neutral-500">
            {description}
          </Dialog.Description>
        </div>

        {children}
      </Dialog.Content>
    </Dialog.Portal>
  );
});
