import Alert from "./Alert";
import { Progress } from "./Progress";
import { SCRIPT_STATUS } from "../lib/constants";
import { memo } from "react";

/** The alert variant and text of each finished run state */
const STATUS_ALERTS = {
  [SCRIPT_STATUS.DONE]: { variant: "success", text: "The script finished." },
  [SCRIPT_STATUS.STOPPED]: {
    variant: "warning",
    text: "The script was stopped.",
  },
};

/** The state of a script run, with progress while sessions are read */
export default memo(function ScriptRunStatus({
  status,
  error,
  target,
  progress,
}) {
  switch (status) {
    case SCRIPT_STATUS.READING:
      return (
        <>
          <p className="text-center">Reading Telegram sessions...</p>
          <Progress current={progress} max={target} />
        </>
      );
    case SCRIPT_STATUS.RUNNING:
      return <p className="text-center text-orange-500">Running...</p>;
    case SCRIPT_STATUS.FAILED:
      return <Alert variant={"danger"}>Failed: {error}</Alert>;
    case SCRIPT_STATUS.DONE:
    case SCRIPT_STATUS.STOPPED:
      return (
        <Alert variant={STATUS_ALERTS[status].variant}>
          {STATUS_ALERTS[status].text}
        </Alert>
      );
    default:
      return null;
  }
});
