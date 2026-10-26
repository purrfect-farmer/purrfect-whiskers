import { useEffect, useState } from "react";

import BootScreen from "./BootScreen";
import useBoot from "../hooks/useBoot";

/** The delay before the boot screen shows, in milliseconds */
const REVEAL_DELAY = 300;

/** A gate that shows the boot screen until the app has booted */
export default function Boot({ children }) {
  const { isBooted, ...boot } = useBoot();
  /** Whether the boot screen is shown */
  const [isRevealed, setIsRevealed] = useState(false);

  /** Reveals the boot screen after the delay */
  useEffect(() => {
    const timeout = setTimeout(() => setIsRevealed(true), REVEAL_DELAY);

    return () => clearTimeout(timeout);
  }, []);

  if (isBooted) return children;

  return isRevealed ? <BootScreen {...boot} /> : null;
}
