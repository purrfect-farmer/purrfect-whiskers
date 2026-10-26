import { memo, useState } from "react";

import { formatDuration } from "../lib/utils";
import { useInterval } from "react-use";

/** The whole seconds since a time, never below zero */
const getSecondsSince = (time) =>
  Math.max(0, Math.floor((Date.now() - time) / 1000));

/** The time passed since `since`, ticking once a second */
export default memo(function ElapsedTime({ since }) {
  /** The seconds passed */
  const [seconds, setSeconds] = useState(() => getSecondsSince(since));

  /** The tick of the timer, once a second */
  useInterval(() => setSeconds(getSecondsSince(since)), 1000);

  return <span className="tabular-nums">{formatDuration(seconds)}</span>;
});
