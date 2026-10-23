import AccountSummary from "./AccountSummary";
import { memo } from "react";

/**
 * The account row body shared by every reorder implementation - it carries no
 * reordering behaviour of its own, so a new implementation only has to supply
 * its own controls around it.
 */
export default memo(function AccountsReorderItem({ account, className }) {
  return <AccountSummary account={account} className={className} />;
});
