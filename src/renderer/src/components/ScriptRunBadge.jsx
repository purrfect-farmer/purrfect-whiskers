import useScriptRunStore, { selectIsRunning } from "../store/useScriptRunStore";

import { cn } from "../lib/utils";
import { memo } from "react";

/** A badge on the Scripts button: the waiting prompts, or a running dot */
export default memo(function ScriptRunBadge() {
  const isRunning = useScriptRunStore(selectIsRunning);
  const waiting = useScriptRunStore((state) => state.waiting);

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
        "absolute right-0.5 top-0.5 size-2.5 rounded-full",
        "bg-orange-500 ring-2 ring-white dark:ring-neutral-800",
        "animate-pulse",
      )}
    />
  ) : null;
});
