import { useEffect, useState } from "react";

import BootScreen from "./BootScreen";
import useBoot from "../hooks/useBoot";

/** Delay before the boot screen shows, so a quick boot doesn't flash it */
const REVEAL_DELAY = 300;

/** Renders the app once the boot downloads finish or are skipped */
export default function Boot({ children }) {
  const { isBooted, ...boot } = useBoot();
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setIsRevealed(true), REVEAL_DELAY);

    return () => clearTimeout(timeout);
  }, []);

  if (isBooted) return children;

  return isRevealed ? <BootScreen {...boot} /> : null;
}
