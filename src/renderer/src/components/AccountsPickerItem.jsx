import AccountSummary from "./AccountSummary";
import Toggle from "./Toggle";
import { memo } from "react";

export default memo(function AccountsPickerItem({
  account,
  checked,
  disabled,
  onToggle,
  children,
}) {
  return (
    <AccountSummary
      as="label"
      interactive
      account={account}
      className="relative cursor-pointer has-[input:disabled]:opacity-60"
    >
      {children}
      <Toggle
        checked={checked}
        disabled={disabled}
        onChange={(ev) => onToggle(account.partition, ev.target.checked)}
      />
    </AccountSummary>
  );
});
