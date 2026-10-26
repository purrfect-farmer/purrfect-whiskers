import { AiOutlineFolder, AiOutlineSelect } from "react-icons/ai";
import { memo, useCallback } from "react";

import { IPC } from "../../../shared/constants/ipc";
import IconButton from "./IconButton";
import Input from "./Input";
import { LuRotateCcw } from "react-icons/lu";
import useSettingsStore from "../store/useSettingsStore";

/** A field showing the scripts folder, with buttons to open or change it */
export default memo(function ScriptsFolderField({
  folder,
  isDefault,
  disabled,
}) {
  const setScriptsFolder = useSettingsStore((state) => state.setScriptsFolder);

  /** The handler for opening the folder in the file manager */
  const openFolder = useCallback(
    () => window.electron.ipcRenderer.invoke(IPC.OPEN_PATH, folder),
    [folder],
  );

  /** The handler for choosing another scripts folder */
  const chooseFolder = useCallback(async () => {
    const result = await window.electron.ipcRenderer.invoke(
      IPC.PICK_SCRIPTS_FOLDER,
      folder,
    );

    if (!result.canceled) {
      setScriptsFolder(result.filePaths[0]);
    }
  }, [folder, setScriptsFolder]);

  /** The handler for going back to the default folder */
  const restoreDefaultFolder = useCallback(
    () => setScriptsFolder(""),
    [setScriptsFolder],
  );

  return (
    <div className="flex flex-col gap-2 min-w-0">
      <label className="text-neutral-500">
        Scripts Folder {isDefault ? "(Default)" : null}
      </label>

      <div className="flex gap-2 min-w-0">
        <Input
          readOnly
          title={folder}
          value={folder}
          placeholder="Loading..."
        />

        <IconButton
          title="Open Scripts Folder"
          disabled={!folder}
          onClick={openFolder}
        >
          <AiOutlineFolder className="size-4" />
        </IconButton>

        <IconButton
          title="Choose Scripts Folder"
          disabled={disabled}
          onClick={chooseFolder}
        >
          <AiOutlineSelect className="size-4" />
        </IconButton>

        {!isDefault ? (
          <IconButton
            title="Use Default Scripts Folder"
            disabled={disabled}
            onClick={restoreDefaultFolder}
          >
            <LuRotateCcw className="size-4" />
          </IconButton>
        ) : null}
      </div>
    </div>
  );
});
