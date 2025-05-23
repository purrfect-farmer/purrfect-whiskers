import { Dialog } from "radix-ui";
import { LuUserRoundPlus } from "react-icons/lu";
import { useCallback } from "react";

import AccountForm from "./AccountForm";
import useAppStore from "../store/useAppStore";
import { cn, uuid } from "../lib/utils";

export default function AddAccountDialog({ close }) {
  const addAccount = useAppStore((state) => state.addAccount);
  const launchPartition = useAppStore((state) => state.launchPartition);

  const createAccount = useCallback(
    (data) => {
      const partition = `persist:${uuid()}`;
      addAccount({ ...data, partition });
      launchPartition(partition);
      close();
    },
    [addAccount, launchPartition, close]
  );

  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 bg-black/30" />
      <Dialog.Content
        className={cn(
          "fixed top-1/2 left-1/2 w-[90vw] max-w-[450px]",
          "-translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6",
          "flex flex-col gap-2"
        )}
      >
        <LuUserRoundPlus className="size-10 mx-auto text-orange-500" />

        <div className="mb-2">
          <Dialog.Title className="text-lg font-turret-road text-orange-500 font-bold text-center">
            Add Account
          </Dialog.Title>
          <Dialog.Description className="text-center text-neutral-500">
            Create a new Account
          </Dialog.Description>
        </div>

        <AccountForm handleFormSubmit={createAccount} />

        <Dialog.Close
          className={cn("px-4 py-2.5 bg-orange-100 text-orange-800 rounded-xl")}
        >
          Close
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  );
}
