import AccountSummary from "./AccountSummary";
import { memo } from "react";

/** The summary of an account in a reorder list */
export default memo(function AccountsReorderItem({ account, className }) {
  return <AccountSummary account={account} className={className} />;
});
