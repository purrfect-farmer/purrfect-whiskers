import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { validateValues } from "../../../shared/lib/scriptFields";

/** A hook for a form of script fields, validated by their shared rules */
export default function useScriptFieldsForm(fields, defaultValues) {
  /** The resolver checking the values against the fields */
  const resolver = useCallback(
    (input) => {
      const { values, errors } = validateValues(fields, input);

      /** Whether every field is valid */
      const isValid = Object.keys(errors).length === 0;

      return {
        values: isValid ? values : {},
        errors: Object.fromEntries(
          Object.entries(errors).map(([key, message]) => [
            key,
            { type: "validate", message },
          ]),
        ),
      };
    },
    [fields],
  );

  return useForm({ defaultValues, resolver });
}
