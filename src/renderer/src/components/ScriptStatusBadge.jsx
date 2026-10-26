import { SCRIPT_STATUS } from "../lib/constants";
import ElapsedTime from "./ElapsedTime";
import SectionBadge from "./SectionBadge";
import { memo } from "react";

/** The tone and text of each run state's badge */
const STATUS_BADGES = {
  [SCRIPT_STATUS.RUNNING]: { tone: "orange", text: "Running" },
  [SCRIPT_STATUS.STOPPING]: { tone: "amber", text: "Stopping" },
  [SCRIPT_STATUS.DONE]: { tone: "green", text: "Finished" },
  [SCRIPT_STATUS.FAILED]: { tone: "red", text: "Failed" },
  [SCRIPT_STATUS.STOPPED]: { tone: "neutral", text: "Stopped" },
};

/** A badge showing the state of a script run, with its time while running */
export default memo(function ScriptStatusBadge({ status, startedAt }) {
  /** The badge of the state */
  const badge = STATUS_BADGES[status];

  /** Whether the badge shows the time since the run started */
  const showsTime = status === SCRIPT_STATUS.RUNNING && startedAt !== null;

  return badge ? (
    <SectionBadge tone={badge.tone}>
      {badge.text}
      {showsTime ? (
        <>
          {" · "}
          <ElapsedTime since={startedAt} />
        </>
      ) : null}
    </SectionBadge>
  ) : null;
});
