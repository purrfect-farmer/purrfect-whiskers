import useScriptRunStore, {
  selectSetDialogOpen,
} from "../store/useScriptRunStore";

import { LuSquareTerminal } from "react-icons/lu";
import ScriptRunBadge from "./ScriptRunBadge";
import ScriptsDialog from "./ScriptsDialog";
import SideMenuDialog from "./SideMenuDialog";
import { memo } from "react";

/** The badge of the Scripts button */
const SCRIPT_RUN_BADGE = <ScriptRunBadge />;

/** The Scripts button of the side menu and its dialog, opened from anywhere */
export default memo(function ScriptsMenuDialog() {
  const isOpen = useScriptRunStore((state) => state.isDialogOpen);
  const setOpen = useScriptRunStore(selectSetDialogOpen);

  return (
    <SideMenuDialog
      title="Scripts"
      icon={LuSquareTerminal}
      open={isOpen}
      onOpenChange={setOpen}
      badge={SCRIPT_RUN_BADGE}
    >
      <ScriptsDialog />
    </SideMenuDialog>
  );
});
