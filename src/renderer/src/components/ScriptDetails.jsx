import { AiOutlineFolder } from "react-icons/ai";
import IconButton from "./IconButton";
import ScriptIcon from "./ScriptIcon";
import SectionBadge from "./SectionBadge";
import { cn } from "../lib/utils";
import { memo } from "react";

/** The card of the chosen script, with its manifest details */
export default memo(function ScriptDetails({ script, onOpenFolder }) {
  if (!script) {
    return (
      <div
        className={cn(
          "p-3 rounded-xl text-center",
          "bg-neutral-100 dark:bg-neutral-900",
          "text-neutral-500 dark:text-neutral-400",
        )}
      >
        Choose a script to see its details
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-start gap-3 min-w-0 p-3 rounded-xl",
        "bg-neutral-100 dark:bg-neutral-900",
      )}
    >
      <ScriptIcon icon={script.icon} className="size-10 rounded-lg" />

      <div className="flex flex-col gap-1 grow min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="truncate text-sm font-bold">{script.displayName}</h3>
          {script.version ? (
            <SectionBadge>v{script.version}</SectionBadge>
          ) : null}
        </div>

        <p className="truncate text-neutral-500 dark:text-neutral-400">
          {script.author ? `by ${script.author} · ` : null}
          {script.name}
        </p>

        {script.description ? <p>{script.description}</p> : null}
      </div>

      <IconButton
        title="Open Script Folder"
        onClick={() => onOpenFolder(script.name)}
        className="bg-white"
      >
        <AiOutlineFolder className="size-4" />
      </IconButton>
    </div>
  );
});
