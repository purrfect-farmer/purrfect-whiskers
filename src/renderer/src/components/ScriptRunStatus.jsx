import Alert from "./Alert";
import { Progress } from "./Progress";
import { SCRIPT_STATUS } from "../lib/constants";
import { memo } from "react";

/** The details of a run under the Output header: progress or the failure */
export default memo(function ScriptRunStatus({ status, error, progress }) {
  switch (status) {
    case SCRIPT_STATUS.RUNNING:
    case SCRIPT_STATUS.STOPPING:
      return progress.total > 0 ? (
        <Progress current={progress.done} max={progress.total} />
      ) : null;
    case SCRIPT_STATUS.FAILED:
      return <Alert variant={"danger"}>{error}</Alert>;
    default:
      return null;
  }
});
