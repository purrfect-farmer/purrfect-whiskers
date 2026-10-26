import useScriptRunStore, {
  selectSetDialogOpen,
} from "../store/useScriptRunStore";

import { LuMessageCircleQuestion } from "react-icons/lu";
import { cn } from "../lib/utils";
import toast from "react-hot-toast";
import { useEffect } from "react";

/** The id of the prompt toast, so later prompts update it */
const PROMPT_TOAST_ID = "script-prompt";

/** The content of the prompt toast */
function PromptToastContent({ title, waiting, onOpen }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <LuMessageCircleQuestion
        className={cn("size-5 shrink-0", "text-orange-500")}
      />
      <div className="flex flex-col gap-0.5 min-w-0">
        <p className="font-bold">
          {waiting > 1
            ? `${waiting} script prompts need your input`
            : "A script needs your input"}
        </p>
        {title ? <p className="truncate">{title}</p> : null}
      </div>
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          "shrink-0 px-3 py-1.5 rounded-lg",
          "bg-orange-500 text-white font-bold",
        )}
      >
        Open
      </button>
    </div>
  );
}

/** A toast shown while prompts wait and the Scripts dialog is closed */
export default function ScriptPromptToast() {
  const waiting = useScriptRunStore((state) => state.waiting);
  const title = useScriptRunStore((state) => state.promptTitle);
  const isDialogOpen = useScriptRunStore((state) => state.isDialogOpen);
  const setDialogOpen = useScriptRunStore(selectSetDialogOpen);

  /** The toast shown or hidden with the waiting prompts */
  useEffect(() => {
    if (waiting === 0 || isDialogOpen) {
      toast.dismiss(PROMPT_TOAST_ID);
      return;
    }

    toast(
      <PromptToastContent
        title={title}
        waiting={waiting}
        onOpen={() => setDialogOpen(true)}
      />,
      { id: PROMPT_TOAST_ID, duration: Infinity },
    );
  }, [waiting, title, isDialogOpen, setDialogOpen]);

  return null;
}
