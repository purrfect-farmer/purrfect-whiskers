import { memo, useEffect, useState } from "react";

import { formatDuration } from "../lib/utils";

/** The whole seconds since a time, never below zero */
const getSecondsSince = (time) =>
  Math.max(0, Math.floor((Date.now() - time) / 1000));

/** The time passed since `since`, ticking once a second */
export default memo(function ElapsedTime({ since }) {
  /** The seconds passed */
  const [seconds, setSeconds] = useState(() => getSecondsSince(since));

  /** The tick of the timer */
  useEffect(() => {
    setSeconds(getSecondsSince(since));

    const timer = setInterval(() => setSeconds(getSecondsSince(since)), 1000);

    return () => clearInterval(timer);
  }, [since]);

  return <span className="tabular-nums">{formatDuration(seconds)}</span>;
});
