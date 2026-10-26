import ScriptIcon from "./ScriptIcon";
import { memo } from "react";
import useScriptRunStore from "../store/useScriptRunStore";

/** The name and icon of the script whose output is shown */
export default memo(function ScriptOutputTitle({ scripts }) {
  const runName = useScriptRunStore((state) => state.runName);

  if (!runName) return null;

  /** The script of the output, when it is still in the folder */
  const script = scripts.find((item) => item.name === runName);

  return (
    <span className="flex items-center gap-1.5 min-w-0 font-bold">
      <ScriptIcon icon={script?.icon} className="size-4 rounded" />
      <span className="truncate">{script?.displayName ?? runName}</span>
    </span>
  );
});
