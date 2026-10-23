import { memo, useCallback, useState } from "react";

import FormInputField from "./FormInputField";
import { HiOutlineSparkles } from "react-icons/hi2";
import { IPC } from "../../../shared/constants/ipc";
import IconButton from "./IconButton";
import { cn } from "../lib/utils";
import toast from "react-hot-toast";
import { useFormContext } from "react-hook-form";

/** User-Agent input with a button that fills a random Telegram-Android one */
export default memo(function UserAgentField() {
  const { setValue } = useFormContext();
  const [isGenerating, setIsGenerating] = useState(false);

  const generateUserAgent = useCallback(async () => {
    setIsGenerating(true);

    try {
      const userAgent = await window.electron.ipcRenderer.invoke(
        IPC.GENERATE_USER_AGENT,
      );

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
      placeholder="User-Agent (leave empty for default)"
    >
      <IconButton
        title="Generate User-Agent"
        aria-label="Generate User-Agent"
        onClick={generateUserAgent}
        disabled={isGenerating}
      >
        <HiOutlineSparkles
          className={cn("size-4", isGenerating && "animate-pulse")}
        />
      </IconButton>
    </FormInputField>
  );
});
