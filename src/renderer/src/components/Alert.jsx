import {
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlineInformationCircle,
  HiOutlineXCircle,
} from "react-icons/hi2";

import { ALERT_VARIANT } from "../lib/constants";
import { cn } from "../lib/utils";

/** The icon of each alert variant */
const ALERT_ICONS = {
  [ALERT_VARIANT.INFO]: HiOutlineInformationCircle,
  [ALERT_VARIANT.WARNING]: HiOutlineExclamationTriangle,
  [ALERT_VARIANT.DANGER]: HiOutlineXCircle,
  [ALERT_VARIANT.SUCCESS]: HiOutlineCheckCircle,
};

/** The colours of each alert variant */
const ALERT_CLASSES = {
  [ALERT_VARIANT.INFO]: ["text-blue-800 dark:text-blue-900", "bg-blue-100"],
  [ALERT_VARIANT.WARNING]: [
    "text-orange-800 dark:text-orange-900",
    "bg-orange-100",
  ],
  [ALERT_VARIANT.DANGER]: ["text-red-800 dark:text-red-900", "bg-red-100"],
  [ALERT_VARIANT.SUCCESS]: [
    "text-green-800 dark:text-green-900",
    "bg-green-100",
  ],
};

/** An alert box with a variant's colors and icon */
export default function Alert({ as: Component = "div", variant, ...props }) {
  /** The icon of the variant */
  const Icon = ALERT_ICONS[variant];
  return (
    <Component
      {...props}
      className={cn(
        "px-4 py-2 rounded-xl",
        "flex items-center gap-4",
        ALERT_CLASSES[variant],
        props.className,
      )}
    >
      <Icon className={cn("shrink-0 size-6")} />
      <p className="grow min-w-0 min-h-0">{props.children}</p>
    </Component>
  );
}
