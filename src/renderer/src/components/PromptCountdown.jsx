import { BADGE_TONE } from "../lib/constants";
import { memo, useState } from "react";

import SectionBadge from "./SectionBadge";
import { formatDuration } from "../lib/utils";
import { useInterval } from "react-use";

/** The seconds left before a time, never below zero */
const getSecondsLeft = (time) =>
  Math.max(0, Math.ceil((time - Date.now()) / 1000));

/** The seconds left below which the countdown turns red */
const URGENT_SECONDS = 10;

/** A badge counting down the seconds until a prompt closes by itself */
export default memo(function PromptCountdown({ expiresAt }) {
  /** The seconds left */
  const [seconds, setSeconds] = useState(() => getSecondsLeft(expiresAt));

  /** The tick of the countdown, once a second until it reaches zero */
  useInterval(
    () => setSeconds(getSecondsLeft(expiresAt)),
    seconds > 0 ? 1000 : null,
  );

  return (
    <SectionBadge
      tone={seconds <= URGENT_SECONDS ? BADGE_TONE.RED : BADGE_TONE.PURPLE}
    >
      {formatDuration(seconds)}
    </SectionBadge>
  );
});
