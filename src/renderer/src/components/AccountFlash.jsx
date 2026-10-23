import { FLASH_DURATION } from "../lib/constants";
import { cn } from "../lib/utils";
import { memo } from "react";
import useFlashStore from "../store/useFlashStore";

const FLASH_STYLE = { animationDuration: `${FLASH_DURATION}ms` };

/**
 * Light blue border that pulses over an account's window when the account
 * is asked to open. Each flash remounts the border, restarting it.
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
        "shadow-[inset_0_0_16px_var(--color-sky-300)]",
        "animate-account-flash motion-reduce:animate-account-fade",
      )}
    />
  );
});
