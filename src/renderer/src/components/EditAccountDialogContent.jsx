import { cn, getTelegramUser } from "../lib/utils";

import AccountForm from "./AccountForm";
import AppDialogContent from "./AppDialogContent";
import { HiOutlineTrash } from "react-icons/hi2";
import { LuUserRoundPen } from "react-icons/lu";
import TelegramUserCard from "./TelegramUserCard";
import { deleteAccount } from "../lib/accounts";
import { useCallback } from "react";
import useAppStore from "../store/useAppStore";

export default function EditAccountDialogContent({ account, close }) {
  const updateAccount = useAppStore((state) => state.updateAccount);

  const user = getTelegramUser(account);

  /** Save Account Data */
  const saveAccountData = useCallback(
    (data) => {
      updateAccount(data);
      close();
    },
    [updateAccount, close],
  );

  /** Delete Account */
  const removeAccount = useCallback(
    () => deleteAccount(account.partition),
    [account.partition],
  );

  return (
    <AppDialogContent
      title={"Modify Account"}
      description={"Update Account Data"}
      icon={LuUserRoundPen}
    >
      {user ? <TelegramUserCard user={user} /> : null}

      <AccountForm account={account} handleFormSubmit={saveAccountData} />

      <p className="text-center text-neutral-500 dark:text-neutral-400">OR</p>

      <button
        onClick={removeAccount}
        className={cn(
          "px-4 py-2.5 border border-red-500 text-red-500 rounded-xl",
          "flex items-center justify-center gap-2",
        )}
      >
        <HiOutlineTrash className="size-4" />
        Delete Account
      </button>
    </AppDialogContent>
  );
}
