import Alert from "./Alert";
import { Progress } from "./Progress";
import { ALERT_VARIANT, SCRIPT_STATUS } from "../lib/constants";
import { memo } from "react";
import useScriptRunStore from "../store/useScriptRunStore";

/** The details of the run under the Output header: progress or the failure */
export default memo(function ScriptRunStatus() {
  const status = useScriptRunStore((state) => state.status);
  const error = useScriptRunStore((state) => state.error);
  const progress = useScriptRunStore((state) => state.progress);

  switch (status) {
    case SCRIPT_STATUS.RUNNING:
    case SCRIPT_STATUS.STOPPING:
      return progress.total > 0 ? (
        <Progress current={progress.done} max={progress.total} />
      ) : null;
    case SCRIPT_STATUS.FAILED:
      return <Alert variant={ALERT_VARIANT.DANGER}>{error}</Alert>;
    default:
      return null;
  }
});
