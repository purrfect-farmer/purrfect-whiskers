import {
  HiArrowPath,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineXCircle,
} from "react-icons/hi2";
import { BOOT_STATUS } from "../lib/constants";
import { cn } from "../lib/utils";
import { memo } from "react";

const STATUS_ICONS = {
  [BOOT_STATUS.PENDING]: HiOutlineClock,
  [BOOT_STATUS.RUNNING]: HiArrowPath,
  [BOOT_STATUS.DONE]: HiOutlineCheckCircle,
  [BOOT_STATUS.FAILED]: HiOutlineXCircle,
};

const STATUS_TEXT = {
  [BOOT_STATUS.PENDING]: "Waiting",
  [BOOT_STATUS.RUNNING]: "Checking",
  [BOOT_STATUS.DONE]: "Ready",
  [BOOT_STATUS.FAILED]: "Unavailable",
};

const STATUS_COLORS = {
  [BOOT_STATUS.PENDING]: "text-neutral-400",
  [BOOT_STATUS.RUNNING]: "text-orange-500",
  [BOOT_STATUS.DONE]: "text-green-500",
  [BOOT_STATUS.FAILED]: "text-red-500",
};

/** One download the app checks for on boot, with its status */
export default memo(function BootStepRow({ label, status }) {
  const Icon = STATUS_ICONS[status];

  return (
    <li
      className={cn(
        "flex items-center gap-3 px-4 py-2 rounded-xl",
        "bg-neutral-100 dark:bg-neutral-800",
      )}
    >
      <Icon
        className={cn(
          "shrink-0 size-5",
          STATUS_COLORS[status],
          status === BOOT_STATUS.RUNNING && "animate-spin",
        )}
      />
      <span className="grow min-w-0 break-words">{label}</span>
      <span className={cn("shrink-0", STATUS_COLORS[status])}>
        {STATUS_TEXT[status]}
      </span>
    </li>
  );
});
