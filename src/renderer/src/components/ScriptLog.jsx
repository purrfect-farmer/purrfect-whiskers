import AnsiText from "./AnsiText";
import { Virtuoso } from "react-virtuoso";
import { cn } from "../lib/utils";
import useScriptRunStore, { selectPrompt } from "../store/useScriptRunStore";

import { memo } from "react";

/** The key of a log line */
const computeItemKey = (_, line) => line.id;

/** The content of a log line */
const itemContent = (_, line) => (
  <div className="px-2 font-mono text-xs whitespace-pre-wrap break-all">
    {line.text ? <AnsiText text={line.text} /> : " "}
  </div>
);

/** Whether a prompt is open, which makes the log compact */
const selectIsCompact = (state) => selectPrompt(state) !== null;

/** The terminal-style output of the script run, following new lines */
export default memo(function ScriptLog() {
  const lines = useScriptRunStore((state) => state.lines);
  const isCompact = useScriptRunStore(selectIsCompact);

  return (
    <div
      className={cn(
        "relative grow rounded-xl",
        isCompact ? "min-h-32" : "min-h-64",
        "bg-black text-neutral-100",
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
