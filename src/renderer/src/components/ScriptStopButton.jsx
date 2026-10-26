import { LuCircleStop, LuSkull } from "react-icons/lu";

import IconButton from "./IconButton";
import { SCRIPT_STATUS } from "../lib/constants";
import { memo } from "react";
import useScriptRunStore from "../store/useScriptRunStore";

/** A compact Stop, or Kill Now while stopping, shown only during a run */
export default memo(function ScriptStopButton({ onStop }) {
  const status = useScriptRunStore((state) => state.status);

  if (status === SCRIPT_STATUS.RUNNING) {
    return (
      <IconButton title="Stop" onClick={onStop} className="gap-1 font-bold">
        <LuCircleStop className="size-5 text-red-500" />
        Stop
      </IconButton>
    );
  }

  return status === SCRIPT_STATUS.STOPPING ? (
    <IconButton title="Kill Now" onClick={onStop} className="gap-1 font-bold">
      <LuSkull className="size-5 text-red-500" />
      Kill Now
    </IconButton>
  ) : null;
});
