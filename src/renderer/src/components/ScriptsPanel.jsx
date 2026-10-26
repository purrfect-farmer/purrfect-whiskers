import {
  LuCircleStop,
  LuMaximize2,
  LuMinimize2,
  LuPlay,
  LuSkull,
} from "react-icons/lu";
import ScriptOptions, { SCRIPT_OPTIONS_FORM_ID } from "./ScriptOptions";
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";

import AccountsPicker from "./AccountsPicker";
import CachedSessionsButton from "./CachedSessionsButton";
import Alert from "./Alert";
import { cn } from "../lib/utils";
import IconButton from "./IconButton";
import PrimaryButton from "./PrimaryButton";
import { IPC } from "../../../shared/constants/ipc";
import { ALERT_VARIANT, SCRIPT_STATUS } from "../lib/constants";
import ScriptDetails from "./ScriptDetails";
import ScriptLog from "./ScriptLog";
import ScriptPicker from "./ScriptPicker";
import ScriptLogClearButton from "./ScriptLogClearButton";
import ScriptOutputTitle from "./ScriptOutputTitle";
import ScriptPromptSlot from "./ScriptPromptSlot";
import ScriptStopButton from "./ScriptStopButton";
import ScriptRunStatus from "./ScriptRunStatus";
import ScriptStatusBadge from "./ScriptStatusBadge";
import SectionHeader from "./SectionHeader";
import ScriptsFolderField from "./ScriptsFolderField";
import useScriptOutputExpanded from "../hooks/useScriptOutputExpanded";
import useScriptPackages from "../hooks/useScriptPackages";
import useScriptRunStore from "../store/useScriptRunStore";
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
  const { start, stop, answerPrompt } = runner;
  const status = useScriptRunStore((state) => state.status);

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

  /** Whether a run is going or stopping */
  const isBusy =
    status === SCRIPT_STATUS.RUNNING || status === SCRIPT_STATUS.STOPPING;

  /** The key resetting the options form when the script or its fields change */
  const optionsKey = useMemo(
    () => (script ? `${script.name}:${JSON.stringify(script.options)}` : null),
    [script],
  );

  /** Whether only the output is shown, and its toggle */
  const output = useScriptOutputExpanded();

  /** The chosen script's details, scrolled into view when one is picked */
  const detailsRef = useRef(null);

  /** The handler for picking a script, showing its details and options */
  const selectScript = useCallback(
    (name) => {
      setChosenScript(name);
      requestAnimationFrame(() =>
        detailsRef.current?.scrollIntoView({
          block: "start",
          behavior: "smooth",
        }),
      );
    },
    [setChosenScript],
  );

  /** The handler for opening a script's folder */
  const openScriptFolder = useCallback(
    (name) =>
      window.electron.ipcRenderer.invoke(IPC.OPEN_SCRIPT_FOLDER, folder, name),
    [folder],
  );

  /** The selected accounts, read when Run is pressed */
  const selectedAccountsRef = useRef(selectedAccounts);

  /** Keeps the selected accounts read by Run up to date */
  useLayoutEffect(() => {
    selectedAccountsRef.current = selectedAccounts;
  }, [selectedAccounts]);

  /** The handler for running the script with its options */
  const runScript = useCallback(
    (options) =>
      start(folder, script.name, selectedAccountsRef.current, options),
    [start, folder, script],
  );

  return (
    <div
      className={cn(
        "grid grow min-h-0 gap-4",
        "grid-rows-[minmax(0,1fr)]",
        output.expanded
          ? "grid-cols-[minmax(0,1fr)]"
          : "grid-cols-[minmax(0,2fr)_minmax(0,3fr)]",
      )}
    >
      {/* Setup: folder, script, options, Run and accounts */}
      <div
        ref={setControlsElement}
        className={cn(
          "flex flex-col gap-2 min-w-0 min-h-0",
          "overflow-x-hidden overflow-y-auto",
          "-mx-2 px-2",
          output.expanded && "hidden",
        )}
      >
        <Alert variant={ALERT_VARIANT.WARNING}>
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
          onSelect={selectScript}
          onRefresh={packages.refresh}
          onInstall={packages.install}
          onOpenFolder={openScriptFolder}
          isLoading={packages.isLoading}
          isInstalling={packages.isInstalling}
          disabled={isBusy}
        />

        <div ref={detailsRef} className="min-w-0">
          <ScriptDetails script={script} onOpenFolder={openScriptFolder} />
        </div>

        {script ? (
          <ScriptOptions
            key={optionsKey}
            script={script}
            disabled={isBusy}
            onRun={runScript}
          />
        ) : null}

        {/* Run or Stop, kept in view while the pane scrolls */}
        <div
          className={cn(
            "sticky top-0 bottom-0 z-10 -mx-2 px-2 py-1",
            "flex gap-2",
            "bg-white dark:bg-neutral-800",
          )}
        >
          {status === SCRIPT_STATUS.RUNNING ? (
            <PrimaryButton variant="neutral" className="min-w-0" onClick={stop}>
              <LuCircleStop className="size-5 text-red-500" />
              Stop
            </PrimaryButton>
          ) : status === SCRIPT_STATUS.STOPPING ? (
            <PrimaryButton variant="neutral" className="min-w-0" onClick={stop}>
              <LuSkull className="size-5 text-red-500" />
              Kill Now
            </PrimaryButton>
          ) : (
            <PrimaryButton
              type="submit"
              form={SCRIPT_OPTIONS_FORM_ID}
              disabled={!script || selectedAccounts.length === 0}
              className="min-w-0"
            >
              <LuPlay className="size-5" />
              Run ({selectedAccounts.length})
            </PrimaryButton>
          )}

          <CachedSessionsButton disabled={isBusy} />
        </div>

        <AccountsPicker
          {...selector}
          scrollParent={controlsElement}
          disabled={isBusy}
        />
      </div>

      {/* Prompt and output */}
      <div className="flex flex-col gap-2 min-w-0 min-h-0">
        {/* A waiting prompt, scrolling above the output when tall */}
        <div
          className={cn(
            "flex flex-col min-w-0 min-h-0 shrink empty:hidden",
            "overflow-x-hidden overflow-y-auto",
            "-mx-2 px-2",
          )}
        >
          <ScriptPromptSlot onAnswer={answerPrompt} />
        </div>

        <SectionHeader
          title="Output"
          badge={
            <>
              <ScriptOutputTitle scripts={scripts} />
              <ScriptStatusBadge />
            </>
          }
        >
          {output.expanded ? <ScriptStopButton onStop={stop} /> : null}
          <ScriptLogClearButton />
          <IconButton
            title={
              output.expanded
                ? "Show Everything (Ctrl+E)"
                : "Expand Output (Ctrl+E)"
            }
            aria-pressed={output.expanded}
            onClick={output.toggle}
          >
            {output.expanded ? (
              <LuMinimize2 className="size-4" />
            ) : (
              <LuMaximize2 className="size-4" />
            )}
          </IconButton>
        </SectionHeader>

        <ScriptRunStatus />

        <ScriptLog />
      </div>
    </div>
  );
}
