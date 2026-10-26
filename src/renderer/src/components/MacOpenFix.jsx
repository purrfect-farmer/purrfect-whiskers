import { HiOutlineClipboard } from "react-icons/hi2";
import { cn, copyText } from "../lib/utils";
import { memo } from "react";

/** The command that lets macOS open an unsigned app */
const MAC_FIX_COMMAND = 'xattr -cr "/Applications/Purrfect Whiskers.app"';

/** A note with the Terminal command for when macOS won't open the app */
export default memo(function MacOpenFix() {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <p className="text-neutral-500 dark:text-neutral-400">
        If macOS won't open the new version, run this in Terminal:
      </p>

      <div
        className={cn(
          "flex items-center gap-2 min-w-0",
          "p-1 pl-3 rounded-lg",
          "bg-neutral-900 text-orange-100",
        )}
      >
        <code className="grow min-w-0 text-xs break-words">
          {MAC_FIX_COMMAND}
        </code>

        {/* Copy Button */}
        <button
          type="button"
          title="Copy command"
          onClick={() => copyText(MAC_FIX_COMMAND, "Command")}
          className={cn(
            "flex items-center justify-center shrink-0",
            "size-7 rounded-md",
            "bg-neutral-800 text-orange-300 hover:text-orange-100",
          )}
        >
          <HiOutlineClipboard className="size-4" />
        </button>
      </div>
    </div>
  );
});
