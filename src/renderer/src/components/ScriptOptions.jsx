import {
  getDefaultValues,
  omitSecrets,
  validateValues,
} from "../../../shared/lib/scriptFields";
import { memo, useCallback, useState } from "react";

import { FormProvider } from "react-hook-form";
import IconButton from "./IconButton";
import { LuRotateCcw } from "react-icons/lu";
import ScriptFieldInput from "./ScriptFieldInput";
import SectionHeader from "./SectionHeader";
import useScriptFieldsForm from "../hooks/useScriptFieldsForm";
import useSettingsStore from "../store/useSettingsStore";

/** The id of the options form, which the Run button submits */
export const SCRIPT_OPTIONS_FORM_ID = "script-options";

/** The remembered values that are still valid, over the defaults */
function getInitialValues(fields, remembered) {
  /** The default values */
  const defaults = getDefaultValues(fields);

  if (!remembered) return defaults;

  const { values, errors } = validateValues(fields, remembered);

  return Object.fromEntries(
    fields.map(({ key }) => [
      key,
      key in remembered && !errors[key] ? values[key] : defaults[key],
    ]),
  );
}

/** The options of a script, submitted by the Run button to start a run */
export default memo(function ScriptOptions({ script, disabled, onRun }) {
  const fields = script.options;

  const setScriptOptions = useSettingsStore((state) => state.setScriptOptions);

  /** The values the form starts with: the remembered ones, else defaults */
  const [initialValues] = useState(() =>
    getInitialValues(
      fields,
      useSettingsStore.getState().scriptOptions[script.name],
    ),
  );

  const form = useScriptFieldsForm(fields, initialValues);

  /** The handler for a valid submit: remembers the values and runs */
  const handleSubmit = useCallback(
    (values) => {
      if (fields.length > 0) {
        setScriptOptions(script.name, omitSecrets(fields, values));
      }

      return onRun(values);
    },
    [fields, script.name, setScriptOptions, onRun],
  );

  /** The handler for resetting the options to their defaults */
  const resetToDefaults = useCallback(() => {
    form.reset(getDefaultValues(fields));
    setScriptOptions(script.name, null);
  }, [form, fields, script.name, setScriptOptions]);

  return (
    <FormProvider {...form}>
      <form
        id={SCRIPT_OPTIONS_FORM_ID}
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col gap-2 min-w-0"
      >
        {fields.length > 0 ? (
          <>
            <SectionHeader title="Options">
              <IconButton
                title="Reset to Defaults"
                disabled={disabled}
                onClick={resetToDefaults}
              >
                <LuRotateCcw className="size-4" />
              </IconButton>
            </SectionHeader>

            {fields.map((field) => (
              <ScriptFieldInput
                key={field.key}
                field={field}
                disabled={disabled}
              />
            ))}
          </>
        ) : null}
      </form>
    </FormProvider>
  );
});
