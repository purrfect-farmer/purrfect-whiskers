import { Dialog } from "radix-ui";
import { LuUserRoundPlus } from "react-icons/lu";
import { useCallback } from "react";

import AccountForm from "./AccountForm";
import AppDialogContent from "./AppDialogContent";
import useAppStore from "../store/useAppStore";
import useLaunchPartition from "../hooks/useLaunchPartition";
import { cn, uuid } from "../lib/utils";

export default function AddAccountDialog({ close }) {
  const addAccount = useAppStore((state) => state.addAccount);
  const launchPartition = useLaunchPartition();

  /** Create Account */
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
    <AppDialogContent
      title={"Add Account"}
      description={"Create a new Account"}
      icon={LuUserRoundPlus}
    >
      <AccountForm handleFormSubmit={createAccount} />

      <Dialog.Close
        className={cn(
          "px-4 py-2.5 border border-orange-500 text-orange-500 font-bold rounded-xl"
        )}
      >
        Close
      </Dialog.Close>
    </AppDialogContent>
  );
}
