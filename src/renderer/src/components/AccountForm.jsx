import * as yup from "yup";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { memo } from "react";
import { yupResolver } from "@hookform/resolvers/yup";

import Input from "./Input";
import useAppStore from "../store/useAppStore";
import { cn } from "../lib/utils";

const schema = yup
  .object({
    partition: yup.string().nullable(),
    title: yup.string().required().label("Title"),
  })
  .required();

export default memo(function AccountForm({ account, handleFormSubmit }) {
  const accounts = useAppStore((state) => state.accounts);
  /** Form */
  const form = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      partition: account?.partition || null,
      title: account?.title || `Account ${accounts.length + 1}`,
    },
  });

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(handleFormSubmit)}
        className="flex flex-col gap-2"
      >
        {/* Title */}
        <Controller
          name="title"
          render={({ field, fieldState }) => (
            <>
              <label className="text-neutral-500">Title</label>
              <Input {...field} autoComplete="off" placeholder="Title" />
              {fieldState.error?.message ? (
                <p className="text-red-500">{fieldState.error?.message}</p>
              ) : null}
            </>
          )}
        />

        {/* Save Button */}
        <button
          type="submit"
          className={cn(
            "px-4 py-2.5 bg-orange-100 text-orange-700 rounded-xl",
            "font-bold",
            "disabled:opacity-50"
          )}
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? "Saving..." : "Save"}
        </button>
      </form>
    </FormProvider>
  );
});
