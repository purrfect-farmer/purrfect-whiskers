import AnsiText from "./AnsiText";
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
export default memo(function ScriptLog({ lines }) {
  return (
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
  );
});
