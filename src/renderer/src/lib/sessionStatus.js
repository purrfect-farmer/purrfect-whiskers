import { SESSION_STATUS } from "../../../shared/constants/sessionStatus";

/** Human readable name for each status */
export const SESSION_STATUS_LABELS = {
  [SESSION_STATUS.ACTIVE]: "Active",
  [SESSION_STATUS.NO_SESSION]: "No session",
  [SESSION_STATUS.LOGGED_OUT]: "Logged out",
  [SESSION_STATUS.DEACTIVATED]: "Deactivated",
  [SESSION_STATUS.ERROR]: "Error",
  [SESSION_STATUS.NO_RESPONSE]: "No response",
};

/** Text colour for each status */
export const SESSION_STATUS_COLORS = {
  [SESSION_STATUS.ACTIVE]: "text-green-500 dark:text-green-400",
  [SESSION_STATUS.NO_SESSION]: "text-neutral-500 dark:text-neutral-400",
  [SESSION_STATUS.LOGGED_OUT]: "text-orange-500 dark:text-orange-400",
  [SESSION_STATUS.DEACTIVATED]: "text-red-500 dark:text-red-400",
  [SESSION_STATUS.ERROR]: "text-amber-500 dark:text-amber-400",
  [SESSION_STATUS.NO_RESPONSE]: "text-amber-500 dark:text-amber-400",
};

/** Statuses of accounts that can no longer farm, selected for cleaning */
export const BROKEN_SESSION_STATUSES = new Set([
  SESSION_STATUS.NO_SESSION,
  SESSION_STATUS.LOGGED_OUT,
  SESSION_STATUS.DEACTIVATED,
]);
