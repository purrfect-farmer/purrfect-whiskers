import useScriptRunStore from "../store/useScriptRunStore";

/** The latest progress not yet in the store, or null */
let pending = null;

/** The scheduled write */
let frame = null;

/** Writes the latest progress to the store */
export function flushScriptProgress() {
  cancelAnimationFrame(frame);
  frame = null;

  if (pending === null) return;

  useScriptRunStore.getState().setRunState({ progress: pending });
  pending = null;
}

/** Queues the script's progress, written to the store once per frame */
export function queueScriptProgress(done, total) {
  pending = { done, total };

  if (frame === null) frame = requestAnimationFrame(flushScriptProgress);
}

/** Drops any progress not yet written */
export function clearScriptProgress() {
  cancelAnimationFrame(frame);
  frame = null;
  pending = null;
}
