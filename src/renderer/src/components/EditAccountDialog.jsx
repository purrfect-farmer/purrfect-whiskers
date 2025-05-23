import { Dialog } from "radix-ui";
import { HiOutlineTrash } from "react-icons/hi2";
import { LuUserRoundPen } from "react-icons/lu";
import { useCallback } from "react";

import AccountForm from "./AccountForm";
import useAppStore from "../store/useAppStore";
import { cn } from "../lib/utils";

export default function EditAccountDialog({ account, close }) {
  const updateAccount = useAppStore((state) => state.updateAccount);
  const removeAccount = useAppStore((state) => state.removeAccount);
  const closePartition = useAppStore((state) => state.closePartition);

  /** Save Account Data */
  const saveAccountData = useCallback(
    (data) => {
      updateAccount(data);
      close();
    },
    [updateAccount, close]
  );

  /** Delete Account */
  const deleteAccount = useCallback(async () => {
    closePartition(account.partition);
    removeAccount(account.partition);
    await window.electron.ipcRenderer.invoke(
      "remove-session",
      account.partition
    );
  }, [account, removeAccount, closePartition]);

  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 bg-black/50" />
      <Dialog.Content
        className={cn(
          "fixed top-1/2 left-1/2 w-[90vw] max-w-[450px]",
          "-translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6",
          "flex flex-col gap-2"
        )}
      >
        <LuUserRoundPen className="size-10 mx-auto text-orange-500" />

        <div className="mb-2">
          <Dialog.Title className="text-lg font-turret-road text-orange-500 font-bold text-center">
            Edit Account
          </Dialog.Title>
          <Dialog.Description className="text-center text-neutral-500">
            Update account data
          </Dialog.Description>
        </div>

        <AccountForm account={account} handleFormSubmit={saveAccountData} />

        <p className="text-center text-neutral-500">OR</p>

        <button
          onClick={deleteAccount}
          className={cn(
            "px-4 py-2.5 border border-red-500 text-red-500 rounded-xl",
            "flex items-center justify-center gap-2"
          )}
        >
          <HiOutlineTrash className="size-4" />
          Delete Account
        </button>
      </Dialog.Content>
    </Dialog.Portal>
  );
}
