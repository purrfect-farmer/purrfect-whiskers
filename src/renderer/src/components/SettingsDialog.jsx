import { AiOutlineSelect } from "react-icons/ai";
import { Dialog } from "radix-ui";
import {
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineCog6Tooth,
} from "react-icons/hi2";
import { useCallback } from "react";

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
      <label className="text-blue-500">{label}</label>
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
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 bg-black/30" />
      <Dialog.Content
        className={cn(
          "fixed top-1/2 left-1/2 w-[90vw] max-w-[450px]",
          "-translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6",
          "flex flex-col gap-2"
        )}
      >
        <HiOutlineCog6Tooth className="size-10 mx-auto text-orange-500" />
        <div className="mb-4">
          <Dialog.Title className="text-lg text-orange-500 font-light text-center">
            Settings
          </Dialog.Title>
          <Dialog.Description className="text-center text-neutral-500">
            Configure Settings
          </Dialog.Description>
        </div>

        {/* Columns and Rows */}
        <div className="grid grid-cols-2 gap-2">
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
        <label className="text-neutral-500 mt-4">Extension Path</label>
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

        <Dialog.Close
          className={cn(
            "px-4 py-2.5 bg-orange-100 text-orange-700 rounded-xl",
            "mt-4 font-bold"
          )}
        >
          Close
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  );
}
