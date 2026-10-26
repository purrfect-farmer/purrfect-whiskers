import { HiOutlineBars3, HiOutlineSquares2X2 } from "react-icons/hi2";

import AccountsDragReorderList from "./AccountsDragReorderList";
import AccountsVirtualReorderList from "./AccountsVirtualReorderList";
import Alert from "./Alert";
import AppDialogContent from "./AppDialogContent";
import DialogCloseButton from "./DialogCloseButton";
import { LuArrowUpDown } from "react-icons/lu";
import { REORDER_MODE } from "../lib/constants";
import SegmentedControl from "./SegmentedControl";
import useAppStore from "../store/useAppStore";
import useSettingsStore from "../store/useSettingsStore";

/** The reorder modes, each with its list component */
const REORDER_MODES = [
  {
    value: REORDER_MODE.VIRTUAL,
    label: "Controls",
    icon: HiOutlineBars3,
    component: AccountsVirtualReorderList,
  },
  {
    value: REORDER_MODE.DRAG,
    label: "Drag",
    icon: HiOutlineSquares2X2,
    component: AccountsDragReorderList,
  },
];

/** A dialog for reordering accounts */
export default function AccountsReorderDialog() {
  const accounts = useAppStore((state) => state.accounts);

  const accountsReorderMode = useSettingsStore(
    (state) => state.accountsReorderMode,
  );
  const setAccountsReorderMode = useSettingsStore(
    (state) => state.setAccountsReorderMode,
  );

  /** The selected reorder mode */
  const mode =
    REORDER_MODES.find((item) => item.value === accountsReorderMode) ||
    REORDER_MODES[0];

  /** The list component of the selected mode */
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
          <SegmentedControl
            options={REORDER_MODES}
            value={mode.value}
            onChange={setAccountsReorderMode}
          />

          <ReorderList accounts={accounts} />
        </>
      )}

      <DialogCloseButton />
    </AppDialogContent>
  );
}
