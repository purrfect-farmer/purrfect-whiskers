import { useCallback, useState } from "react";

const ORIGIN = { x: 0, y: 0 };

/** Pinned state and drag position of a floating window */
export default function usePinnable() {
  const [pinned, setPinned] = useState(false);
  const [position, setPosition] = useState(ORIGIN);

  const togglePinned = useCallback(() => {
    setPinned((prev) => !prev);
    setPosition(ORIGIN);
  }, []);

  const handleDrag = useCallback((_event, { x, y }) => {
    setPosition({ x, y });
  }, []);

  return { pinned, position, togglePinned, handleDrag };
}
