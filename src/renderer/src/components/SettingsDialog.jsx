import { AiOutlineSelect } from "react-icons/ai";
import { Dialog } from "radix-ui";
import {
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineCog6Tooth,
} from "react-icons/hi2";
import { useCallback } from "react";

import AppDialogContent from "./AppDialogContent";
import Input from "./Input";
import useSettingsStore from "../store/useSettingsStore";
import { cn } from "../lib/utils";

const NumberInputButton = (props) => (
  <button
    {...props}
    className={cn(
      "bg-neutral-100",
      "hover:bg-orange-100 hover:text-orange-700",
      "flex items-center justify-center",
      "p-1 px-3 rounded-lg"
    )}
  />
);
const NumberInput = ({ value, label, onChange }) => (
  <div className="flex gap-2">
    <div className="flex flex-col-reverse gap-2">
      <label className="text-orange-500">{label}</label>
      <Input readOnly type="number" min="1" value={value} />
    </div>
    <div className="flex flex-col gap-1 shrink-0">
      <NumberInputButton onClick={() => onChange(parseInt(value) + 1)}>
        <HiOutlineChevronUp className="size-4 stroke-3" />
      </NumberInputButton>
      <NumberInputButton onClick={() => onChange(parseInt(value) - 1)}>
        <HiOutlineChevronDown className="size-4 stroke-3" />
      </NumberInputButton>
    </div>
  </div>
);

export default function SettingsDialog() {
  const extensionPath = useSettingsStore((state) => state.extensionPath);
  const rows = useSettingsStore((state) => state.rows);
  const columns = useSettingsStore((state) => state.columns);
  const setColumns = useSettingsStore((state) => state.setColumns);
  const setRows = useSettingsStore((state) => state.setRows);
  const setExtensionPath = useSettingsStore((state) => state.setExtensionPath);

  /** Pick Extension Path */
  const pickExtensionPath = useCallback(async () => {
    const result = await window.electron.ipcRenderer.invoke(
      "pick-extension-path",
      extensionPath
    );

    if (!result.canceled) {
      const path = result.filePaths[0];
      setExtensionPath(path);
    }
  }, [extensionPath, setExtensionPath]);

  return (
    <AppDialogContent
      title={"Settings"}
      description={"Configure Settings"}
      icon={HiOutlineCog6Tooth}
    >
      {/* Columns and Rows */}
      <div className="grid grid-cols-2 gap-2 mt-4">
        <NumberInput
          label={"Columns"}
          value={columns}
          onChange={(newValue) => setColumns(newValue || 1)}
        />

        <NumberInput
          label={"Rows"}
          value={rows}
          onChange={(newValue) => setRows(newValue || 1)}
        />
      </div>

      {/* Extension Path */}
      <label className="text-orange-500 mt-2">Extension Path</label>
      <div className="flex gap-2">
        <Input readOnly value={extensionPath} />

        <button
          onClick={pickExtensionPath}
          className={cn(
            "bg-neutral-100",
            "hover:bg-orange-100 hover:text-orange-700",
            "flex items-center justify-center",
            "p-1 px-3 rounded-lg"
          )}
        >
          <AiOutlineSelect className="size-4" />
        </button>
      </div>

      {/* Close Dialog */}
      <Dialog.Close
        className={cn(
          "px-4 py-2.5 bg-orange-500 text-white rounded-xl",
          "mt-2 font-bold"
        )}
      >
        Close
      </Dialog.Close>
    </AppDialogContent>
  );
}
