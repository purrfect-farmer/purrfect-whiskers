import AccountsReorderItem from "./AccountsReorderItem";
import Alert from "./Alert";
import { Reorder } from "motion/react";
import ReorderItem from "./ReorderItem";
import { cn } from "../lib/utils";
import useAppStore from "../store/useAppStore";

/** A list for reordering accounts by drag and drop */
export default function AccountsDragReorderList({ accounts }) {
  const setAccounts = useAppStore((state) => state.setAccounts);

  return (
    <>
      {/* Info Alert */}
      <Alert variant={"info"}>
        Drag an account by its handle to change its position. The order is saved
        automatically.
      </Alert>

      {/* Accounts List */}
      <Reorder.Group
        values={accounts}
        onReorder={setAccounts}
        className={cn(
          "flex flex-col gap-2",
          "max-h-96 overflow-auto -mx-2 px-2",
        )}
      >
        {accounts.map((item) => (
          <ReorderItem key={item.partition} value={item}>
            <AccountsReorderItem account={item} />
          </ReorderItem>
        ))}
      </Reorder.Group>
    </>
  );
}
