import { BADGE_TONE, SCRIPT_STATUS } from "../lib/constants";
import ElapsedTime from "./ElapsedTime";
import SectionBadge from "./SectionBadge";
import { memo } from "react";
import useScriptRunStore from "../store/useScriptRunStore";

/** The tone and text of each run state's badge */
const STATUS_BADGES = {
  [SCRIPT_STATUS.RUNNING]: { tone: BADGE_TONE.ORANGE, text: "Running" },
  [SCRIPT_STATUS.STOPPING]: { tone: BADGE_TONE.PURPLE, text: "Stopping" },
  [SCRIPT_STATUS.DONE]: { tone: BADGE_TONE.GREEN, text: "Finished" },
  [SCRIPT_STATUS.FAILED]: { tone: BADGE_TONE.RED, text: "Failed" },
  [SCRIPT_STATUS.STOPPED]: { tone: BADGE_TONE.NEUTRAL, text: "Stopped" },
};

/** A badge showing the state of the script run, with its time while running */
export default memo(function ScriptStatusBadge() {
  const status = useScriptRunStore((state) => state.status);
  const startedAt = useScriptRunStore((state) => state.startedAt);

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
