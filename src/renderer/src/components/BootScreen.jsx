import Alert from "./Alert";
import BootStepRow from "./BootStepRow";
import { BOOT_STEP } from "../lib/constants";
import Icon from "../assets/images/icon.png";
import PrimaryButton from "./PrimaryButton";
import { memo } from "react";

/** The label of each boot step */
const STEP_LABELS = {
  [BOOT_STEP.EXTENSION]: "Extension",
  [BOOT_STEP.USER_AGENTS]: "User-Agents",
};

/** A screen with the boot downloads and retry or continue on failure */
export default memo(function BootScreen({ statuses, hasFailed, retry, skip }) {
  return (
    <div className="min-h-dvh max-w-sm mx-auto p-4 flex flex-col gap-4 justify-center">
      <img src={Icon} className="size-32 max-w-full mx-auto" />
      <h1 className="text-3xl font-turret-road text-orange-500 text-center break-words">
        Purrfect Whiskers
      </h1>

      <ul className="flex flex-col gap-2">
        {Object.entries(STEP_LABELS).map(([id, label]) => (
          <BootStepRow key={id} label={label} status={statuses[id]} />
        ))}
      </ul>

      {hasFailed ? (
        <>
          <Alert variant={"warning"}>
            Some downloads failed. Retry, or continue and install the extension
            later from the side menu.
          </Alert>

          <div className="flex flex-wrap gap-2">
            <PrimaryButton autoFocus onClick={retry} className="grow w-auto">
              Retry
            </PrimaryButton>
            <PrimaryButton
              onClick={skip}
              className="grow w-auto bg-neutral-200 text-neutral-800 dark:bg-neutral-700 dark:text-white"
            >
              Continue anyway
            </PrimaryButton>
          </div>
        </>
      ) : null}
    </div>
  );
});
