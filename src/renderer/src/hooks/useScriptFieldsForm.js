import { buildFieldsSchema } from "../../../shared/lib/scriptFields";
import { useForm } from "react-hook-form";
import { useMemo } from "react";
import { yupResolver } from "@hookform/resolvers/yup";

/** A hook for a form of script fields, validated by their yup schema */
export default function useScriptFieldsForm(fields, defaultValues) {
  /** The resolver of the fields' schema */
  const resolver = useMemo(
    () => yupResolver(buildFieldsSchema(fields)),
    [fields],
  );

  return useForm({ defaultValues, resolver });
}
