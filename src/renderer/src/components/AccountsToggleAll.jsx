import LabelToggle from "./LabelToggle";
import { memo, useMemo } from "react";

/** A toggle that selects or clears every account in the visible list */
export default memo(function AccountsToggleAll({
  list,
  selected,
  toggleAllAccounts,
  disabled,
}) {
  /** Whether every visible account is selected */
  const allSelected = useMemo(
    () =>
      list.length > 0 &&
      list.every((account) => selected.has(account.partition)),
    [list, selected],
  );

  return (
    <LabelToggle
      disabled={disabled}
      checked={allSelected}
      onChange={(ev) => toggleAllAccounts(ev.target.checked, list)}
    >
      Toggle Accounts
    </LabelToggle>
  );
});
