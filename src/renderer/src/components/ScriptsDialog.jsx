import AppDialogContent from "./AppDialogContent";
import { LuSquareTerminal } from "react-icons/lu";
import ScriptsPanel from "./ScriptsPanel";
import useAccountsSelector from "../hooks/useAccountsSelector";
import useAppStore from "../store/useAppStore";
import useScriptRunner from "../hooks/useScriptRunner";
import useSettingsStore from "../store/useSettingsStore";
import { useState } from "react";

/** The options of the account selection */
const SELECTOR_OPTIONS = { initiallySelected: false };

/** The handler for Escape, collapsing an expanded output before closing */
function collapseOnEscape(event) {
  const { scriptOutputExpanded, setScriptOutputExpanded } =
    useSettingsStore.getState();

  if (!scriptOutputExpanded) return;

  event.preventDefault();
  setScriptOutputExpanded(false);
}

/** A dialog for running a script on the selected accounts */
export default function ScriptsDialog() {
  const accounts = useAppStore((state) => state.accounts);

  /** The selection of accounts to run the script on */
  const selector = useAccountsSelector(accounts, SELECTOR_OPTIONS);

  /** The chosen script */
  const [chosenScript, setChosenScript] = useState(null);

  /** The runner of the script, kept while the dialog is closed */
  const runner = useScriptRunner(setChosenScript);

  return (
    <AppDialogContent
      title={"Scripts"}
      description={"Run a script on the selected accounts"}
      icon={LuSquareTerminal}
      className="max-w-5xl h-[calc(100dvh-5rem)]"
      onEscapeKeyDown={collapseOnEscape}
    >
      <ScriptsPanel
        selector={selector}
        runner={runner}
        chosenScript={chosenScript}
        setChosenScript={setChosenScript}
      />
    </AppDialogContent>
  );
}
