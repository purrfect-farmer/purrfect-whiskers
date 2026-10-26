import { useCallback, useState } from "react";

/** The default drag position */
const ORIGIN = { x: 0, y: 0 };

/** A hook for the pinned state and drag position of a floating window */
export default function usePinnable() {
  /** Whether the window is pinned */
  const [pinned, setPinned] = useState(false);
  /** The drag position */
  const [position, setPosition] = useState(ORIGIN);

  /** The toggle of the pinned state */
  const togglePinned = useCallback(() => {
    setPinned((prev) => !prev);
    setPosition(ORIGIN);
  }, []);

  /** The handler of a drag */
  const handleDrag = useCallback((_event, { x, y }) => {
    setPosition({ x, y });
  }, []);

  return { pinned, position, togglePinned, handleDrag };
}
