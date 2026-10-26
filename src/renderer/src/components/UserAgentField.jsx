import { memo, useCallback, useState } from "react";

import FormInputField from "./FormInputField";
import { IPC } from "../../../shared/constants/ipc";
import IconButton from "./IconButton";
import { LuShuffle } from "react-icons/lu";
import { cn } from "../lib/utils";
import toast from "react-hot-toast";
import { useFormContext } from "react-hook-form";

/** User-Agent input with a button that fills a random one from the catalog */
export default memo(function UserAgentField() {
  const { setValue } = useFormContext();
  /** Whether a User-Agent is being generated */
  const [isGenerating, setIsGenerating] = useState(false);

  /** The handler for filling a random User-Agent */
  const generateUserAgent = useCallback(async () => {
    setIsGenerating(true);

    try {
      const userAgent = await window.electron.ipcRenderer.invoke(
        IPC.GENERATE_USER_AGENT,
      );

      if (!userAgent) {
        toast.error("No User-Agent catalog yet");
        return;
      }

      setValue("userAgent", userAgent, {
        shouldDirty: true,
        shouldValidate: true,
      });
    } catch (error) {
      console.error("Failed to generate User-Agent:", error);
      toast.error("Failed to generate User-Agent");
    } finally {
      setIsGenerating(false);
    }
  }, [setValue]);

  return (
    <FormInputField
      name="userAgent"
      label="User-Agent"
      placeholder="User-Agent (leave empty to use the farmer's)"
    >
      <IconButton
        title="Generate User-Agent"
        aria-label="Generate User-Agent"
        onClick={generateUserAgent}
        disabled={isGenerating}
      >
        <LuShuffle className={cn("size-4", isGenerating && "animate-pulse")} />
      </IconButton>
    </FormInputField>
  );
});
