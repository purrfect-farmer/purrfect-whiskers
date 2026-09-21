import AccountsReorderItem from "./AccountsReorderItem";
import Alert from "./Alert";
import { Reorder } from "motion/react";
import ReorderItem from "./ReorderItem";
import { cn } from "../lib/utils";
import useAppStore from "../store/useAppStore";

/**
 * Drag-and-drop reordering, via motion's Reorder.
 *
 * Note that this mounts every row - motion needs them all in the DOM to track
 * their layout - so it does not scale to thousands of accounts. See
 * AccountsVirtualReorderList for the virtualized alternative.
 */
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
