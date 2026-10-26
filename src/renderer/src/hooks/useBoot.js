import { BOOT_STATUS, BOOT_STEP } from "../lib/constants";
import {
  ensureExtension,
  ensureUserAgents,
  resolveExtensionPath,
} from "../lib/boot";
import { useCallback, useEffect, useState } from "react";

import useSettingsStore from "../store/useSettingsStore";
import useStoreHydrated from "./useStoreHydrated";

/** The boot steps in run order, each resolving whether it succeeded */
const STEPS = [
  { id: BOOT_STEP.EXTENSION, run: ensureExtension },
  { id: BOOT_STEP.USER_AGENTS, run: ensureUserAgents },
];

/** The initial status of each boot step */
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

/** A hook for downloading the extension and User-Agents when missing */
export default function useBoot() {
  /** Whether the settings have loaded */
  const hasHydrated = useStoreHydrated(useSettingsStore);
  /** The status of each boot step */
  const [statuses, setStatuses] = useState(INITIAL_STATUSES);
  /** The number of the boot attempt */
  const [attempt, setAttempt] = useState(0);
  /** Whether the boot was skipped */
  const [isSkipped, setIsSkipped] = useState(false);

  /** The run of the boot steps */
  useEffect(() => {
    if (!hasHydrated) return;

    /** Whether the run was cancelled */
    let cancelled = false;
    /** The setter of a step's status */
    const setStatus = (id, status) => {
      if (!cancelled) {
        setStatuses((current) => ({ ...current, [id]: status }));
      }
    };

    (async () => {
      /** The path of the extension */
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

  /** The list of step statuses */
  const statusList = Object.values(statuses);
  /** Whether every step is done */
  const isDone = statusList.every((status) => status === BOOT_STATUS.DONE);
  /** Whether a step failed and none is running */
  const hasFailed =
    !statusList.some((status) => status === BOOT_STATUS.RUNNING) &&
    statusList.includes(BOOT_STATUS.FAILED);

  /** The retry of the boot */
  const retry = useCallback(() => {
    setStatuses(INITIAL_STATUSES);
    setAttempt((current) => current + 1);
  }, []);

  /** The skip of the boot */
  const skip = useCallback(() => setIsSkipped(true), []);

  return {
    statuses,
    hasFailed,
    isBooted: isDone || isSkipped,
    retry,
    skip,
  };
}
