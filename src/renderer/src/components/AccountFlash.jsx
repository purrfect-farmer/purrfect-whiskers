import {
  FLASH_BLINKS,
  FLASH_BLINK_DURATION,
  FLASH_DURATION,
} from "../lib/constants";

import { cn } from "../lib/utils";
import { memo } from "react";
import useFlashStore from "../store/useFlashStore";

const FLASH_STYLE = {
  "--flash-blink": `${FLASH_BLINK_DURATION}ms`,
  "--flash-blinks": FLASH_BLINKS,
  "--flash-duration": `${FLASH_DURATION}ms`,
};

/**
 * Light blue border that blinks rapidly over an account's window when the
 * account is asked to open. Each flash remounts the border, restarting it.
 * With reduced motion it shows steadily, then fades.
 */
export default memo(function AccountFlash({ partition }) {
  const flashKey = useFlashStore((state) =>
    state.partition === partition ? state.key : 0,
  );

  if (!flashKey) return null;

  return (
    <span
      key={flashKey}
      aria-hidden="true"
      style={FLASH_STYLE}
      className={cn(
        "pointer-events-none absolute inset-0 z-10",
        "border-2 border-sky-400",
        "account-flash",
      )}
    />
  );
});
