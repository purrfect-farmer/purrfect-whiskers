import useScriptRunStore, { selectIsRunning } from "../store/useScriptRunStore";

import { LuLoaderCircle } from "react-icons/lu";
import { cn } from "../lib/utils";
import { memo } from "react";

/** The running script's status line, set with api.setStatus */
export default memo(function ScriptStatusText() {
  const isRunning = useScriptRunStore(selectIsRunning);
  const text = useScriptRunStore((state) => state.statusText);

  return isRunning && text ? (
    <div
      role="status"
      title={text}
      className={cn(
        "flex items-center gap-2 min-w-0",
        "px-3 py-2 rounded-xl",
        "bg-neutral-100 dark:bg-neutral-700",
      )}
    >
      <LuLoaderCircle
        className={cn("size-4 shrink-0", "text-orange-500 animate-spin")}
      />
      <span className="truncate min-w-0">{text}</span>
    </div>
  ) : null;
});
