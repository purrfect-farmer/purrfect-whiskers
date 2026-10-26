import { LuPackagePlus, LuRefreshCw, LuSquareTerminal } from "react-icons/lu";

import IconButton from "./IconButton";
import { cn } from "../lib/utils";
import { memo } from "react";

/** A script's icon, or the default terminal icon */
const ScriptIcon = memo(function ScriptIcon({ icon, active }) {
  return icon ? (
    <img src={icon} alt="" className="size-5 shrink-0 rounded object-cover" />
  ) : (
    <LuSquareTerminal
      className={cn(
        "size-5 shrink-0",
        active ? "text-white" : "text-orange-500",
      )}
    />
  );
});

/** A row showing a script's icon, display name and version */
const ScriptRow = memo(function ScriptRow({
  script,
  active,
  disabled,
  onSelect,
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={active}
      title={script.description ?? script.displayName}
      onClick={() => onSelect(script.name)}
      className={cn(
        "flex items-center gap-2 min-w-0",
        "p-2 rounded-xl text-left disabled:opacity-50",
        active
          ? "bg-orange-500 text-white"
          : "bg-neutral-100 dark:bg-neutral-700",
      )}
    >
      <ScriptIcon icon={script.icon} active={active} />
      <span className="grow min-w-0 truncate font-bold">
        {script.displayName}
      </span>
      {script.version ? (
        <span
          className={cn(
            "shrink-0",
            active ? "text-white/80" : "text-neutral-500",
          )}
        >
          v{script.version}
        </span>
      ) : null}
    </button>
  );
});

/** A list of the scripts in the folder, one of them selected */
export default memo(function ScriptPicker({
  scripts,
  selected,
  onSelect,
  onRefresh,
  onInstall,
  isLoading,
  isInstalling,
  disabled,
}) {
  return (
    <div className="flex flex-col gap-2 min-w-0">
      <div className="flex items-center gap-2">
        <label className="grow min-w-0 text-neutral-500">
          Scripts ({scripts.length})
        </label>
        <IconButton
          title="Install Script"
          disabled={disabled || isInstalling}
          onClick={() => onInstall()}
        >
          <LuPackagePlus className="size-4" />
        </IconButton>
        <IconButton
          title="Refresh Scripts"
          disabled={disabled || isLoading}
          onClick={onRefresh}
        >
          <LuRefreshCw className={cn("size-4", isLoading && "animate-spin")} />
        </IconButton>
      </div>

      {scripts.length === 0 ? (
        <p className="text-center text-neutral-500 dark:text-neutral-400">
          No scripts found. A script is a folder with an index.js.
        </p>
      ) : (
        <div className="flex flex-col gap-1">
          {scripts.map((script) => (
            <ScriptRow
              key={script.name}
              script={script}
              active={script.name === selected?.name}
              disabled={disabled}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}

      {selected?.description || selected?.author ? (
        <p className="text-neutral-500 dark:text-neutral-400">
          {selected.description}
          {selected.description && selected.author ? " · " : null}
          {selected.author ? `by ${selected.author}` : null}
        </p>
      ) : null}
    </div>
  );
});
