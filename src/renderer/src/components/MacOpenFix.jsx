import { FaApple } from "react-icons/fa";
import { HiOutlineClipboard } from "react-icons/hi2";
import { cn, copyText } from "../lib/utils";
import { memo } from "react";

/** The command that lets macOS open an unsigned app */
const MAC_FIX_COMMAND = 'xattr -cr "/Applications/Purrfect Whiskers.app"';

/** The Terminal command for when macOS won't open the app */
export default memo(function MacOpenFix() {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 min-w-0",
        "p-3 rounded-lg",
        "bg-white dark:bg-neutral-800",
      )}
    >
      <div className="flex items-start gap-2 min-w-0">
        <FaApple className="size-4 shrink-0 text-neutral-500" />
        <div className="flex flex-col gap-0.5 min-w-0">
          <h5 className="font-bold">&ldquo;App is damaged&rdquo; on macOS?</h5>
          <p className="text-neutral-500 dark:text-neutral-400">
            Run this once in Terminal after installing, then open the app again.
          </p>
        </div>
      </div>

      <div
        className={cn(
          "flex items-center gap-2 min-w-0",
          "p-1.5 pl-3 rounded-lg",
          "bg-neutral-100 dark:bg-neutral-700",
        )}
      >
        <code className="grow min-w-0 break-words text-xs font-mono">
          {MAC_FIX_COMMAND}
        </code>

        {/* Copy Button */}
        <button
          type="button"
          title="Copy command"
          onClick={() => copyText(MAC_FIX_COMMAND, "Command")}
          className={cn(
            "flex items-center justify-center shrink-0",
            "size-7 rounded-full",
            "bg-white dark:bg-neutral-600",
            "hover:bg-orange-500 hover:text-white",
          )}
        >
          <HiOutlineClipboard className="size-4" />
        </button>
      </div>
    </div>
  );
});
