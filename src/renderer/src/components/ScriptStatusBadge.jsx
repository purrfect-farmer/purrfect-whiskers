import { SCRIPT_STATUS } from "../lib/constants";
import SectionBadge from "./SectionBadge";
import { memo } from "react";

/** The tone, text and pulse of each run state's badge */
const STATUS_BADGES = {
  [SCRIPT_STATUS.READING]: {
    tone: "amber",
    text: "Reading sessions",
    pulse: true,
  },
  [SCRIPT_STATUS.RUNNING]: { tone: "orange", text: "Running", pulse: true },
  [SCRIPT_STATUS.DONE]: { tone: "green", text: "Finished" },
  [SCRIPT_STATUS.FAILED]: { tone: "red", text: "Failed" },
  [SCRIPT_STATUS.STOPPED]: { tone: "neutral", text: "Stopped" },
};

/** A badge showing the state of a script run */
export default memo(function ScriptStatusBadge({ status }) {
  /** The badge of the state */
  const badge = STATUS_BADGES[status];

  return badge ? (
    <SectionBadge tone={badge.tone} pulse={badge.pulse}>
      {badge.text}
    </SectionBadge>
  ) : null;
});
