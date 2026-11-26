import AccountSummary from "./AccountSummary";
import { TG_GET_STEP } from "../lib/constants";
import { cn } from "../lib/utils";
import { memo } from "react";

/** The label of each transfer step */
const STEP_LABELS = {
  [TG_GET_STEP.CONNECT]: "Connecting...",
  [TG_GET_STEP.REMOVE_2FA]: "Removing 2FA...",
  [TG_GET_STEP.CLEAN]: "Cleaning...",
  [TG_GET_STEP.SEND_PHONE]: "Sending number...",
  [TG_GET_STEP.AWAIT_CODE]: "Waiting for code...",
  [TG_GET_STEP.SEND_CODE]: "Sending code...",
  [TG_GET_STEP.TERMINATE_DEVICES]: "Removing devices...",
  [TG_GET_STEP.LOGOUT]: "Logging out...",
};

/** The status text and colour of an account's transfer */
function getStatus({ step, outcome }) {
  if (outcome?.success) return { text: "Transferred", color: "text-green-500" };
  if (outcome) {
    return { text: outcome.error || "Failed", color: "text-red-500" };
  }
  if (step) return { text: STEP_LABELS[step], color: "text-orange-500" };

  return { text: "Waiting", color: "text-neutral-500 dark:text-neutral-400" };
}

/** A row showing one account's transfer status */
export default memo(function TgGetAccountItem({ account, step, outcome }) {
  /** The status text and colour */
  const status = getStatus({ step, outcome });

  return (
    <AccountSummary account={account}>
      <span className={cn("min-w-0 truncate font-bold", status.color)}>
        {status.text}
      </span>
    </AccountSummary>
  );
});
