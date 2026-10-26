import { memo, useEffect, useState } from "react";

import SectionBadge from "./SectionBadge";

/** The seconds left before a time, never below zero */
const getSecondsLeft = (time) =>
  Math.max(0, Math.ceil((time - Date.now()) / 1000));

/** The seconds left below which the countdown turns red */
const URGENT_SECONDS = 10;

/** A badge counting down the seconds until a prompt closes by itself */
export default memo(function PromptCountdown({ expiresAt }) {
  /** The seconds left */
  const [seconds, setSeconds] = useState(() => getSecondsLeft(expiresAt));

  /** The tick of the countdown, once a second */
  useEffect(() => {
    const timer = setInterval(
      () => setSeconds(getSecondsLeft(expiresAt)),
      1000,
    );

    return () => clearInterval(timer);
  }, [expiresAt]);

  /** The whole minutes left */
  const minutes = Math.floor(seconds / 60);

  /** The seconds left past the minutes, as two digits */
  const remainder = String(seconds % 60).padStart(2, "0");

  /** The minutes and seconds left, as m:ss */
  const label = `${minutes}:${remainder}`;

  return (
    <SectionBadge tone={seconds <= URGENT_SECONDS ? "red" : "amber"}>
      {label}
    </SectionBadge>
  );
});
