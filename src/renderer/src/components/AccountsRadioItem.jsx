import AccountSummary from "./AccountSummary";
import { HiCheckCircle } from "react-icons/hi2";
import { cn } from "../lib/utils";
import { memo } from "react";

/** A row that selects one account on click, shown with a check when picked */
export default memo(function AccountsRadioItem({
  account,
  checked,
  disabled,
  onToggle,
}) {
  return (
    <AccountSummary
      as="button"
      type="button"
      interactive
      account={account}
      disabled={disabled}
      onClick={() => onToggle(account.partition, !checked)}
      className={cn(
        "w-full cursor-pointer disabled:opacity-60",
        checked && "ring-2 ring-orange-500 ring-inset",
      )}
    >
      {/* Selected mark */}
      {checked ? (
        <HiCheckCircle className="size-5 shrink-0 text-orange-500" />
      ) : null}
    </AccountSummary>
  );
});
