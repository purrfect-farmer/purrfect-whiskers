import AccountForm from "./AccountForm";
import AppDialogContent from "./AppDialogContent";
import DialogCloseButton from "./DialogCloseButton";
import { LuUserRoundPlus } from "react-icons/lu";
import { useCallback } from "react";
import useAppStore from "../store/useAppStore";
import { uuid } from "../lib/utils";

export default function AddAccountDialog({ close }) {
  const addAccount = useAppStore((state) => state.addAccount);
  const launchAccount = useAppStore((state) => state.launchAccount);

  /** Create Account */
  const createAccount = useCallback(
    (data) => {
      const partition = `persist:${uuid()}`;
      addAccount({ ...data, partition });
      launchAccount(partition);
      close();
    },
    [addAccount, launchAccount, close],
  );

  return (
    <AppDialogContent
      title={"Add Account"}
      description={"Create a new Account"}
      icon={LuUserRoundPlus}
    >
      <AccountForm handleFormSubmit={createAccount} />

      <DialogCloseButton variant="outline" />
    </AppDialogContent>
  );
}
