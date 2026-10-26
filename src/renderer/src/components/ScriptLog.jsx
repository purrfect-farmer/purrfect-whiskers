import AnsiText from "./AnsiText";
import IconButton from "./IconButton";
import { LuTrash2 } from "react-icons/lu";
import { Virtuoso } from "react-virtuoso";
import { cn } from "../lib/utils";
import { memo } from "react";

/** The key of a log line */
const computeItemKey = (_, line) => line.id;

/** The content of a log line */
const itemContent = (_, line) => (
  <div className="px-2 font-mono text-xs whitespace-pre-wrap break-all">
    {line.text ? <AnsiText text={line.text} /> : " "}
  </div>
);

/** The output of a script run, filling its column and following new lines */
export default memo(function ScriptLog({ lines, onClear, disabled }) {
  return (
    <div className="flex flex-col gap-2 min-w-0 grow">
      <div className="flex items-center gap-2">
        <label className="grow min-w-0 text-neutral-500">
          Log ({lines.length})
        </label>
        <IconButton
          title="Clear Log"
          disabled={disabled || lines.length === 0}
          onClick={onClear}
        >
          <LuTrash2 className="size-4" />
        </IconButton>
      </div>

      <div
        className={cn(
          "relative grow min-h-64 rounded-xl",
          "bg-neutral-100 dark:bg-neutral-900",
        )}
      >
        <div className="absolute inset-0 py-2">
          <Virtuoso
            style={{ height: "100%" }}
            data={lines}
            followOutput="auto"
            computeItemKey={computeItemKey}
            itemContent={itemContent}
          />
        </div>
      </div>
    </div>
  );
});
