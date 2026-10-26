import { useCallback, useEffect } from "react";

import useSettingsStore from "../store/useSettingsStore";

/** Whether a key press is Ctrl+E, or ⌘E on macOS */
const isToggleShortcut = (event) =>
  (event.ctrlKey || event.metaKey) &&
  !event.altKey &&
  !event.shiftKey &&
  event.key.toLowerCase() === "e";

/** A hook for showing only the Scripts output, toggled with Ctrl+E */
export default function useScriptOutputExpanded() {
  const expanded = useSettingsStore((state) => state.scriptOutputExpanded);
  const setExpanded = useSettingsStore(
    (state) => state.setScriptOutputExpanded,
  );

  /** Shows or hides everything but the output */
  const toggle = useCallback(
    () => setExpanded(!useSettingsStore.getState().scriptOutputExpanded),
    [setExpanded],
  );

  /** The keyboard shortcut, while the panel is open */
  useEffect(() => {
    /** The handler of key presses */
    const handleKeyDown = (event) => {
      if (!isToggleShortcut(event)) return;

      event.preventDefault();
      toggle();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggle]);

  return { expanded, toggle };
}
