import {
  LuCheck,
  LuMessageCircleQuestion,
  LuUserRound,
  LuX,
} from "react-icons/lu";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";

import { FormProvider } from "react-hook-form";
import { PROMPT_SUBMIT } from "../../../shared/lib/scriptPrompts";
import PrimaryButton from "./PrimaryButton";
import PromptCountdown from "./PromptCountdown";
import ScriptFieldInput from "./ScriptFieldInput";
import SectionBadge from "./SectionBadge";
import SectionHeader from "./SectionHeader";
import { cn } from "../lib/utils";
import { getDefaultValues } from "../../../shared/lib/scriptFields";
import useScriptFieldsForm from "../hooks/useScriptFieldsForm";

/** A question from the running script, answered or cancelled by the user */
export default memo(function ScriptPrompt({ prompt, waiting, onAnswer }) {
  const { id, title, description, image, fields, actions } = prompt;

  /** The values the form starts with */
  const defaultValues = useMemo(() => getDefaultValues(fields), [fields]);

  const form = useScriptFieldsForm(fields, defaultValues);
  const { setFocus, getValues } = form;

  /** The prompt's form element */
  const formRef = useRef(null);

  /** The handler for a valid submit */
  const submit = useCallback(
    (values) => onAnswer(id, { action: PROMPT_SUBMIT, values }),
    [id, onAnswer],
  );

  /** The handler for one of the script's buttons, sent without checks */
  const pressAction = useCallback(
    (action) => onAnswer(id, { action, values: getValues() }),
    [id, onAnswer, getValues],
  );

  /** The handler for cancelling the prompt */
  const cancel = useCallback(() => onAnswer(id, null), [id, onAnswer]);

  /** The first field focused, with the prompt's top brought into view */
  useEffect(() => {
    if (fields.length > 0) setFocus(fields[0].key);

    formRef.current.scrollIntoView({ block: "start" });
  }, [fields, setFocus]);

  return (
    <FormProvider {...form}>
      <form
        ref={formRef}
        onSubmit={form.handleSubmit(submit)}
        className={cn(
          "flex flex-col gap-2 min-w-0 p-3 rounded-xl",
          "border-2 border-orange-500",
        )}
      >
        <SectionHeader
          title="Input Needed"
          badge={
            <SectionBadge tone="orange" pulse>
              {waiting > 1 ? `1 of ${waiting}` : "Waiting"}
            </SectionBadge>
          }
        >
          {prompt.expiresAt ? (
            <PromptCountdown expiresAt={prompt.expiresAt} />
          ) : null}
        </SectionHeader>

        <div className="flex gap-2 min-w-0">
          <LuMessageCircleQuestion
            className={cn("size-5 shrink-0", "text-orange-500")}
          />
          <div className="flex flex-col gap-1 min-w-0">
            <h4 className="font-bold break-words">{title}</h4>
            {prompt.accountTitle ? (
              <p className="flex items-center gap-1 min-w-0 font-bold">
                <LuUserRound className="size-4 shrink-0" />
                <span className="truncate">{prompt.accountTitle}</span>
              </p>
            ) : null}
            {description ? (
              <p className="text-neutral-500 dark:text-neutral-400 break-words">
                {description}
              </p>
            ) : null}
          </div>
        </div>

        {image ? (
          <div className="flex justify-center p-2 rounded-xl bg-white">
            <img
              src={image}
              alt={title}
              className="h-28 w-auto max-w-full object-contain"
            />
          </div>
        ) : null}

        {fields.map((field) => (
          <ScriptFieldInput key={field.key} field={field} />
        ))}

        <div
          className={cn(
            "grid gap-2 min-w-0",
            "grid-cols-[repeat(auto-fit,minmax(8rem,1fr))]",
          )}
        >
          <PrimaryButton variant="neutral" className="min-w-0" onClick={cancel}>
            <LuX className="size-5 shrink-0" />
            Cancel
          </PrimaryButton>

          {actions.map((action) => (
            <PrimaryButton
              key={action.value}
              variant="neutral"
              className="min-w-0"
              onClick={() => pressAction(action.value)}
            >
              <span className="truncate">{action.label}</span>
            </PrimaryButton>
          ))}

          <PrimaryButton
            type="submit"
            className="min-w-0"
            autoFocus={fields.length === 0}
          >
            <LuCheck className="size-5 shrink-0" />
            {fields.length > 0 ? "Submit" : "Continue"}
          </PrimaryButton>
        </div>
      </form>
    </FormProvider>
  );
});
