import useScriptRunStore, { selectIsRunning } from "../store/useScriptRunStore";

import IconButton from "./IconButton";
import { LuTrash2 } from "react-icons/lu";
import { clearScriptLog } from "../lib/scriptLog";
import { memo } from "react";

/** Whether the log has any line */
const selectHasLines = (state) => state.lines.length > 0;

/** A button clearing the script output, while no script runs */
export default memo(function ScriptLogClearButton() {
  const isRunning = useScriptRunStore(selectIsRunning);
  const hasLines = useScriptRunStore(selectHasLines);

  return (
    <IconButton
      title="Clear Output"
      disabled={isRunning || !hasLines}
      onClick={clearScriptLog}
    >
      <LuTrash2 className="size-4" />
    </IconButton>
  );
});
