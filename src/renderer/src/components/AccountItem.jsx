import { AccountEditDialog } from "./AccountEditDialog";
import AccountSummary from "./AccountSummary";
import { HiOutlineCheckBadge } from "react-icons/hi2";
import { memo } from "react";

export const AccountItem = memo(function AccountItem({ account, onLaunch }) {
  return (
    <div className="flex gap-2">
      <AccountSummary
        as="button"
        interactive
        account={account}
        onClick={() => onLaunch(account.partition)}
      >
        {account.running ? (
          <HiOutlineCheckBadge className="shrink-0 text-orange-500 size-4" />
        ) : null}
      </AccountSummary>

      {/* Edit Dialog */}
      <AccountEditDialog account={account} />
    </div>
  );
});
