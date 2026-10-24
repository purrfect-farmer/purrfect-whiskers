import { BOOT_STATUS, BOOT_STEP } from "../lib/constants";
import {
  ensureExtension,
  ensureUserAgents,
  resolveExtensionPath,
} from "../lib/boot";
import { useCallback, useEffect, useState } from "react";

import useSettingsStore from "../store/useSettingsStore";
import useStoreHydrated from "./useStoreHydrated";

/** Boot steps in the order they run, each resolving whether it succeeded */
const STEPS = [
  { id: BOOT_STEP.EXTENSION, run: ensureExtension },
  { id: BOOT_STEP.USER_AGENTS, run: ensureUserAgents },
];

const INITIAL_STATUSES = Object.freeze(
  Object.fromEntries(STEPS.map((step) => [step.id, BOOT_STATUS.PENDING])),
);

/** Turns a step's outcome into its status */
async function runStep(step, extensionPath) {
  try {
    return (await step.run(extensionPath))
      ? BOOT_STATUS.DONE
      : BOOT_STATUS.FAILED;
  } catch (error) {
    console.error(`Boot step "${step.id}" failed:`, error);
    return BOOT_STATUS.FAILED;
  }
}

/** Downloads the extension and User-Agent catalog when missing, never blocking the app */
export default function useBoot() {
  const hasHydrated = useStoreHydrated(useSettingsStore);
  const [statuses, setStatuses] = useState(INITIAL_STATUSES);
  const [attempt, setAttempt] = useState(0);
  const [isSkipped, setIsSkipped] = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;

    let cancelled = false;
    const setStatus = (id, status) => {
      if (!cancelled) {
        setStatuses((current) => ({ ...current, [id]: status }));
      }
    };

    (async () => {
      const extensionPath = await resolveExtensionPath();

      for (const step of STEPS) {
        if (cancelled) return;

        setStatus(step.id, BOOT_STATUS.RUNNING);
        setStatus(step.id, await runStep(step, extensionPath));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hasHydrated, attempt]);

  const statusList = Object.values(statuses);
  const isDone = statusList.every((status) => status === BOOT_STATUS.DONE);
  const hasFailed =
    !statusList.some((status) => status === BOOT_STATUS.RUNNING) &&
    statusList.includes(BOOT_STATUS.FAILED);

  const retry = useCallback(() => {
    setStatuses(INITIAL_STATUSES);
    setAttempt((current) => current + 1);
  }, []);

  const skip = useCallback(() => setIsSkipped(true), []);

  return {
    statuses,
    hasFailed,
    isBooted: isDone || isSkipped,
    retry,
    skip,
  };
}
