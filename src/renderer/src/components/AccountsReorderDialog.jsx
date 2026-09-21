import { HiOutlineBars3, HiOutlineSquares2X2 } from "react-icons/hi2";

import AccountsDragReorderList from "./AccountsDragReorderList";
import AccountsVirtualReorderList from "./AccountsVirtualReorderList";
import Alert from "./Alert";
import AppDialogContent from "./AppDialogContent";
import { Dialog } from "radix-ui";
import { LuArrowUpDown } from "react-icons/lu";
import { cn } from "../lib/utils";
import useAppStore from "../store/useAppStore";
import useSettingsStore from "../store/useSettingsStore";

/**
 * The available reorder implementations. Any component taking `{ accounts }`
 * and writing the new order back to the store can be added here.
 */
const REORDER_MODES = [
  {
    id: "virtual",
    name: "Controls",
    icon: HiOutlineBars3,
    component: AccountsVirtualReorderList,
  },
  {
    id: "drag",
    name: "Drag",
    icon: HiOutlineSquares2X2,
    component: AccountsDragReorderList,
  },
];

export default function AccountsReorderDialog() {
  const accounts = useAppStore((state) => state.accounts);

  const accountsReorderMode = useSettingsStore(
    (state) => state.accountsReorderMode,
  );
  const setAccountsReorderMode = useSettingsStore(
    (state) => state.setAccountsReorderMode,
  );

  const mode =
    REORDER_MODES.find((item) => item.id === accountsReorderMode) ||
    REORDER_MODES[0];

  const ReorderList = mode.component;

  return (
    <AppDialogContent
      title={"Reorder Accounts"}
      description={"Change account order"}
      icon={LuArrowUpDown}
    >
      {accounts.length === 0 ? (
        <Alert variant={"warning"}>
          No accounts added yet. Add an account to start reordering.
        </Alert>
      ) : (
        <>
          {/* Mode Toggle */}
          <div className="grid grid-cols-2 gap-2">
            {REORDER_MODES.map((item) => (
              <button
                key={item.id}
                title={item.name}
                onClick={() => setAccountsReorderMode(item.id)}
                className={cn(
                  "flex items-center justify-center gap-2",
                  "p-2 rounded-xl font-bold",
                  item.id === mode.id
                    ? "bg-orange-500 text-white"
                    : [
                        "bg-neutral-100 dark:bg-neutral-700",
                        "hover:bg-orange-100 hover:text-orange-700",
                        "dark:hover:bg-orange-200 dark:hover:text-orange-500",
                      ],
                )}
              >
                <item.icon
                  className={cn(
                    "size-4",
                    item.id === mode.id ? "text-white" : "text-orange-500",
                  )}
                />
                {item.name}
              </button>
            ))}
          </div>

          <ReorderList accounts={accounts} />
        </>
      )}

      {/* Close Dialog */}
      <Dialog.Close
        className={cn(
          "px-4 py-2.5 bg-orange-500 text-white rounded-xl",
          "mt-2 font-bold",
        )}
      >
        Close
      </Dialog.Close>
    </AppDialogContent>
  );
}
