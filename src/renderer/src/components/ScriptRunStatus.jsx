import Alert from "./Alert";
import { Progress } from "./Progress";
import { SCRIPT_STATUS } from "../lib/constants";
import { memo } from "react";

/** The details of a run under the Output header: progress or the failure */
export default memo(function ScriptRunStatus({
  status,
  error,
  target,
  progress,
}) {
  switch (status) {
    case SCRIPT_STATUS.READING:
      return <Progress current={progress} max={target} />;
    case SCRIPT_STATUS.FAILED:
      return <Alert variant={"danger"}>{error}</Alert>;
    default:
      return null;
  }
});
