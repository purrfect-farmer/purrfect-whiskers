import { useCallback, useMemo, useRef, useState } from "react";

import { MAX_SCRIPT_LOG_LINES } from "../lib/constants";

const NO_LINES = [];

/** A hook for the lines of a script log, flushed once per frame */
export default function useScriptLog() {
  /** The log lines, each with a stable id */
  const [lines, setLines] = useState(NO_LINES);

  /** The text received but not yet split into lines */
  const pendingRef = useRef("");

  /** The id of the next line */
  const nextIdRef = useRef(0);

  /** The scheduled flush */
  const frameRef = useRef(null);

  /** The move of the complete pending lines into the log */
  const flush = useCallback(() => {
    cancelAnimationFrame(frameRef.current);
    frameRef.current = null;

    const parts = pendingRef.current.split("\n");

    pendingRef.current = parts.pop();

    if (parts.length === 0) return;

    const added = parts.map((text) => ({ id: nextIdRef.current++, text }));

    setLines((prev) => {
      const next = prev.concat(added);

      return next.length > MAX_SCRIPT_LOG_LINES
        ? next.slice(-MAX_SCRIPT_LOG_LINES)
        : next;
    });
  }, []);

  /** The addition of received text to the log */
  const append = useCallback(
    (text) => {
      pendingRef.current += text;

      if (frameRef.current === null) {
        frameRef.current = requestAnimationFrame(flush);
      }
    },
    [flush],
  );

  /** The flush of everything pending, including an unfinished line */
  const end = useCallback(() => {
    if (pendingRef.current !== "") pendingRef.current += "\n";

    flush();
  }, [flush]);

  /** The removal of every line */
  const clear = useCallback(() => {
    cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    pendingRef.current = "";
    setLines(NO_LINES);
  }, []);

  return useMemo(
    () => ({ lines, append, end, clear }),
    [lines, append, end, clear],
  );
}
