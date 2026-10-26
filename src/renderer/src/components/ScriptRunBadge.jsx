import useScriptRunStore, {
  selectIsRunning,
  selectWaiting,
} from "../store/useScriptRunStore";

import { LuLoaderCircle } from "react-icons/lu";
import { cn } from "../lib/utils";
import { memo } from "react";

/** The Scripts button badge: waiting prompts, or a spinner while running */
export default memo(function ScriptRunBadge() {
  const isRunning = useScriptRunStore(selectIsRunning);
  const waiting = useScriptRunStore(selectWaiting);

  if (waiting > 0) {
    return (
      <span
        title={`${waiting} prompt(s) waiting for input`}
        className={cn(
          "absolute -right-1 -top-1 min-w-4 h-4 px-1 rounded-full",
          "flex items-center justify-center",
          "bg-red-500 text-white text-[10px] font-bold leading-none",
          "animate-pulse",
        )}
      >
        {waiting}
      </span>
    );
  }

  return isRunning ? (
    <span
      title="A script is running"
      className={cn(
        "absolute -right-0.5 -top-0.5 rounded-full",
        "bg-white dark:bg-neutral-900 flex",
      )}
    >
      <LuLoaderCircle className="size-3.5 text-orange-500 animate-spin" />
    </span>
  ) : null;
});
