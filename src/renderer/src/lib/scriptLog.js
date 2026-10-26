import { MAX_SCRIPT_LOG_LINES } from "./constants";
import useScriptRunStore from "../store/useScriptRunStore";

/** The text received but not yet split into lines */
let pending = "";

/** The id of the next line */
let nextId = 0;

/** The scheduled flush */
let frame = null;

/** Moves the complete pending lines into the log */
function flush() {
  cancelAnimationFrame(frame);
  frame = null;

  const parts = pending.split("\n");

  pending = parts.pop();

  if (parts.length === 0) return;

  /** The new lines */
  const added = parts.map((text) => ({ id: nextId++, text }));

  /** The log with the new lines */
  const next = useScriptRunStore.getState().lines.concat(added);

  useScriptRunStore.getState().setRunState({
    lines:
      next.length > MAX_SCRIPT_LOG_LINES
        ? next.slice(-MAX_SCRIPT_LOG_LINES)
        : next,
  });
}

/** Adds received text to the log, flushed once per frame */
export function appendScriptLog(text) {
  pending += text;

  if (frame === null) frame = requestAnimationFrame(flush);
}

/** Flushes everything pending, including an unfinished line */
export function endScriptLog() {
  if (pending !== "") pending += "\n";

  flush();
}

/** Removes every line */
export function clearScriptLog() {
  cancelAnimationFrame(frame);
  frame = null;
  pending = "";
  useScriptRunStore.getState().setRunState({ lines: [] });
}
