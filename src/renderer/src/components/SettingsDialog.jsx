import { AiOutlineFolder, AiOutlineSelect } from "react-icons/ai";

import AppDialogContent from "./AppDialogContent";
import DialogCloseButton from "./DialogCloseButton";
import ExtensionUpdateSection from "./ExtensionUpdateSection";
import { HiOutlineCog6Tooth } from "react-icons/hi2";
import { IPC } from "../../../shared/constants/ipc";
import IconButton from "./IconButton";
import Input from "./Input";
import LabelToggle from "./LabelToggle";
import { NumberInput } from "./NumberInput";
import SectionLabel from "./SectionLabel";
import SegmentedControl from "./SegmentedControl";
import { THEME } from "../lib/constants";
import { useCallback } from "react";
import useSettingsStore from "../store/useSettingsStore";
import { useShallow } from "zustand/react/shallow";

const THEME_OPTIONS = [
  { value: THEME.SYSTEM, label: "System" },
  { value: THEME.LIGHT, label: "Light" },
  { value: THEME.DARK, label: "Dark" },
];

export default function SettingsDialog() {
  const settings = useSettingsStore(
    useShallow((state) => ({
      theme: state.theme,
      rows: state.rows,
      columns: state.columns,
      allowProxies: state.allowProxies,
      autoUpdateExtension: state.autoUpdateExtension,
      extensionPath: state.extensionPath,
      showAccountDetails: state.showAccountDetails,
      restoreAccountsOnStartup: state.restoreAccountsOnStartup,
      showWebviewToolbar: state.showWebviewToolbar,
    })),
  );

  /** Setters are stable, so they are read once */
  const {
    setColumns,
    setRows,
    setTheme,
    setExtensionPath,
    setAllowProxies,
    setAutoUpdateExtension,
    setShowAccountDetails,
    setShowWebviewToolbar,
    setRestoreAccountsOnStartup,
  } = useSettingsStore.getState();

  const { extensionPath } = settings;

  /** Open Extension Path */
  const openExtensionPath = useCallback(
    () => window.electron.ipcRenderer.invoke(IPC.OPEN_PATH, extensionPath),
    [extensionPath],
  );

  /** Pick Extension Path */
  const pickExtensionPath = useCallback(async () => {
    const result = await window.electron.ipcRenderer.invoke(
      IPC.PICK_EXTENSION_PATH,
      extensionPath,
    );

    if (!result.canceled) {
      setExtensionPath(result.filePaths[0]);
    }
  }, [extensionPath, setExtensionPath]);

  return (
    <AppDialogContent
      title={"Settings"}
      description={"Configure Settings"}
      icon={HiOutlineCog6Tooth}
    >
      <SectionLabel>Preferred Theme</SectionLabel>
      <SegmentedControl
        options={THEME_OPTIONS}
        value={settings.theme}
        onChange={setTheme}
      />

      <SectionLabel>Webview Options</SectionLabel>
      <LabelToggle
        onChange={(ev) => setShowWebviewToolbar(ev.target.checked)}
        checked={settings.showWebviewToolbar}
      >
        Show Webview Toolbar
      </LabelToggle>

      <LabelToggle
        onChange={(ev) => setAllowProxies(ev.target.checked)}
        checked={settings.allowProxies}
      >
        Allow Proxies
      </LabelToggle>

      <p className="text-neutral-500 dark:text-neutral-400">
        Proxies may be enabled for accounts, but without this option being
        enabled they won&apos;t be used.
      </p>

      <SectionLabel>Accounts</SectionLabel>

      <LabelToggle
        onChange={(ev) => setShowAccountDetails(ev.target.checked)}
        checked={settings.showAccountDetails}
      >
        Show Account Details
      </LabelToggle>

      <LabelToggle
        onChange={(ev) => setRestoreAccountsOnStartup(ev.target.checked)}
        checked={settings.restoreAccountsOnStartup}
      >
        Restore Accounts on Startup
      </LabelToggle>

      {/* Columns and Rows */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(7rem,1fr))] gap-2">
        <NumberInput
          label={"Columns"}
          value={settings.columns}
          onChange={(newValue) => setColumns(newValue || 1)}
        />

        <NumberInput
          label={"Rows"}
          value={settings.rows}
          onChange={(newValue) => setRows(newValue || 1)}
        />
      </div>

      <SectionLabel>Extension Path</SectionLabel>
      <div className="flex gap-2 min-w-0">
        <Input readOnly value={extensionPath} />

        <IconButton title="Open Extension Folder" onClick={openExtensionPath}>
          <AiOutlineFolder className="size-4" />
        </IconButton>

        <IconButton title="Pick Extension Folder" onClick={pickExtensionPath}>
          <AiOutlineSelect className="size-4" />
        </IconButton>
      </div>

      <LabelToggle
        onChange={(ev) => setAutoUpdateExtension(ev.target.checked)}
        checked={settings.autoUpdateExtension}
      >
        Auto-Update Extension
      </LabelToggle>

      <ExtensionUpdateSection extensionPath={extensionPath} />

      <DialogCloseButton />
    </AppDialogContent>
  );
}
