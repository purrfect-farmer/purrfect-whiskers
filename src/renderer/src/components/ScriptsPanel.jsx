import { LuCircleStop, LuPlay } from "react-icons/lu";
import { useCallback, useMemo, useState } from "react";

import AccountsPicker from "./AccountsPicker";
import Alert from "./Alert";
import { cn } from "../lib/utils";
import PrimaryButton from "./PrimaryButton";
import { SCRIPT_STATUS } from "../lib/constants";
import ScriptLog from "./ScriptLog";
import ScriptPicker from "./ScriptPicker";
import ScriptRunStatus from "./ScriptRunStatus";
import ScriptsFolderField from "./ScriptsFolderField";
import useScriptPackages from "../hooks/useScriptPackages";
import useScriptsFolder from "../hooks/useScriptsFolder";

/** The content of the Scripts dialog: controls beside the output */
export default function ScriptsPanel({
  selector,
  runner,
  chosenScript,
  setChosenScript,
}) {
  const { folder, isDefault } = useScriptsFolder();
  const { selectedAccounts } = selector;
  const { status, start, stop } = runner;

  /** The scripts in the folder and their install action */
  const packages = useScriptPackages(folder, setChosenScript);
  const { scripts } = packages;

  /** The chosen script, when it is still in the folder */
  const script = useMemo(
    () => scripts.find((item) => item.name === chosenScript) ?? null,
    [scripts, chosenScript],
  );

  /** The controls pane, whose scrollbar the account list uses */
  const [controlsElement, setControlsElement] = useState(null);

  /** Whether a run is reading sessions or running */
  const isBusy =
    status === SCRIPT_STATUS.READING || status === SCRIPT_STATUS.RUNNING;

  /** The handler for running the script */
  const runScript = useCallback(
    () => start(folder, script.name, selectedAccounts),
    [start, folder, script, selectedAccounts],
  );

  return (
    <div
      className={cn(
        "grid grow min-h-0 gap-4",
        "grid-rows-[minmax(0,1fr)]",
        "grid-cols-[minmax(0,2fr)_minmax(0,3fr)]",
      )}
    >
      {/* Controls */}
      <div
        ref={setControlsElement}
        className={cn(
          "flex flex-col gap-2 min-w-0 min-h-0",
          "overflow-x-hidden overflow-y-auto",
          "-mx-2 px-2",
        )}
      >
        <Alert variant={"warning"}>
          Scripts run with full access to your accounts and computer. Only run
          scripts you trust.
        </Alert>

        <ScriptsFolderField
          folder={folder}
          isDefault={isDefault}
          disabled={isBusy}
        />

        <ScriptPicker
          scripts={scripts}
          selected={script}
          onSelect={setChosenScript}
          onRefresh={packages.refresh}
          onInstall={packages.install}
          isLoading={packages.isLoading}
          isInstalling={packages.isInstalling}
          disabled={isBusy}
        />

        {/* Run or Stop, kept in view while the pane scrolls */}
        <div
          className={cn(
            "sticky top-0 bottom-0 z-10 -mx-2 px-2 py-1",
            "bg-white dark:bg-neutral-800",
          )}
        >
          {status === SCRIPT_STATUS.RUNNING ? (
            <PrimaryButton variant="neutral" onClick={stop}>
              <LuCircleStop className="size-5 text-red-500" />
              Stop
            </PrimaryButton>
          ) : (
            <PrimaryButton
              disabled={isBusy || !script || selectedAccounts.length === 0}
              onClick={runScript}
            >
              <LuPlay className="size-5" />
              Run ({selectedAccounts.length})
            </PrimaryButton>
          )}
        </div>

        <AccountsPicker
          {...selector}
          scrollParent={controlsElement}
          defaultTagsShown={false}
          disabled={isBusy}
        />
      </div>

      {/* Output */}
      <div className="flex flex-col gap-2 min-w-0 min-h-0">
        <ScriptRunStatus
          status={status}
          error={runner.error}
          target={runner.target}
          progress={runner.progress}
        />

        <ScriptLog
          lines={runner.log.lines}
          onClear={runner.log.clear}
          disabled={isBusy}
        />
      </div>
    </div>
  );
}
