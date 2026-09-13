import * as yup from "yup";

import { Controller, FormProvider, useForm } from "react-hook-form";
import { cn, safeField } from "../lib/utils";

import { HiXMark } from "react-icons/hi2";
import Input from "./Input";
import LabelToggle from "./LabelToggle";
import PrimaryButton from "./PrimaryButton";
import TagsInput from "./TagsInput";
import { memo } from "react";
import useAppStore from "../store/useAppStore";
import { yupResolver } from "@hookform/resolvers/yup";

const schema = yup
  .object({
    partition: yup.string().nullable(),
    telegramInitData: yup.string().nullable(),
    title: yup.string().required().label("Title"),
    userAgent: yup.string().nullable().label("User-Agent"),
    proxyEnabled: yup.bool().required(),
    proxyHost: yup.string().nullable(),
    proxyPort: yup.string().nullable(),
    proxyUsername: yup.string().nullable(),
    proxyPassword: yup.string().nullable(),
    tags: yup.array().of(yup.string()).required().default([]),
  })
  .required();

export default memo(function AccountForm({ account, handleFormSubmit }) {
  const accounts = useAppStore((state) => state.accounts);

  /** Form */
  const form = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      partition: account?.partition || null,
      telegramInitData: account?.telegramInitData || null,
      title: account?.title || `Account ${accounts.length + 1}`,
      proxyEnabled:
        typeof account?.proxyEnabled !== "undefined"
          ? account?.proxyEnabled
          : false,
      proxyHost: account?.proxyHost || null,
      proxyPort: account?.proxyPort || null,
      proxyUsername: account?.proxyUsername || null,
      proxyPassword: account?.proxyPassword || null,
      userAgent: account?.userAgent || null,
      tags: account?.tags || [],
    },
  });

  /** Clear all proxy field values at once */
  const clearProxy = () => {
    form.setValue("proxyEnabled", false);
    form.setValue("proxyHost", null);
    form.setValue("proxyPort", null);
    form.setValue("proxyUsername", null);
    form.setValue("proxyPassword", null);
  };

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
              <Input
                {...safeField(field)}
                autoComplete="off"
                placeholder="Title"
              />
              {fieldState.error?.message ? (
                <p className="text-red-500">{fieldState.error?.message}</p>
              ) : null}
            </>
          )}
        />

        {/* User-Agent */}
        <Controller
          name="userAgent"
          render={({ field, fieldState }) => (
            <>
              <label className="text-neutral-500">User-Agent</label>
              <Input
                {...safeField(field)}
                autoComplete="off"
                placeholder="User-Agent (leave empty for default)"
              />
              {fieldState.error?.message ? (
                <p className="text-red-500">{fieldState.error?.message}</p>
              ) : null}
            </>
          )}
        />

        {/* Enable Proxy */}
        <Controller
          name="proxyEnabled"
          render={({ field, fieldState }) => (
            <>
              <div className="flex items-center justify-between mt-2">
                <label className="text-orange-500">Proxy Options</label>
                <button
                  type="button"
                  onClick={clearProxy}
                  className={cn(
                    "flex items-center gap-1",
                    "text-red-500 hover:text-red-700",
                  )}
                >
                  <HiXMark className="size-4" />
                  Clear Proxy
                </button>
              </div>
              <LabelToggle onChange={field.onChange} checked={field.value}>
                Enable Proxy
              </LabelToggle>
              {fieldState.error?.message ? (
                <p className="text-red-500">{fieldState.error?.message}</p>
              ) : null}
            </>
          )}
        />

        <div className="grid grid-cols-2 gap-2">
          {/* Proxy Host */}
          <Controller
            name="proxyHost"
            render={({ field, fieldState }) => (
              <div className="flex flex-col gap-2">
                <label className="text-neutral-500">Proxy Host</label>
                <Input
                  {...safeField(field)}
                  autoComplete="off"
                  placeholder="Proxy Host"
                />
                {fieldState.error?.message ? (
                  <p className="text-red-500">{fieldState.error?.message}</p>
                ) : null}
              </div>
            )}
          />

          {/* Proxy Port */}
          <Controller
            name="proxyPort"
            render={({ field, fieldState }) => (
              <div className="flex flex-col gap-2">
                <label className="text-neutral-500">Proxy Port</label>
                <Input
                  {...safeField(field)}
                  autoComplete="off"
                  placeholder="Proxy Port"
                />
                {fieldState.error?.message ? (
                  <p className="text-red-500">{fieldState.error?.message}</p>
                ) : null}
              </div>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Proxy Username */}
          <Controller
            name="proxyUsername"
            render={({ field, fieldState }) => (
              <div className="flex flex-col gap-2">
                <label className="text-neutral-500">Proxy Username</label>
                <Input
                  {...safeField(field)}
                  autoComplete="off"
                  placeholder="Proxy Username"
                />
                {fieldState.error?.message ? (
                  <p className="text-red-500">{fieldState.error?.message}</p>
                ) : null}
              </div>
            )}
          />

          {/* Proxy Password */}
          <Controller
            name="proxyPassword"
            render={({ field, fieldState }) => (
              <div className="flex flex-col gap-2">
                <label className="text-neutral-500">Proxy Password</label>
                <Input
                  {...safeField(field)}
                  autoComplete="off"
                  placeholder="Proxy Password"
                />
                {fieldState.error?.message ? (
                  <p className="text-red-500">{fieldState.error?.message}</p>
                ) : null}
              </div>
            )}
          />
        </div>

        {/* Tags */}
        <div className="flex flex-col gap-2">
          <label className="text-neutral-500">Tags</label>
          <Controller
            name="tags"
            render={({ field }) => (
              <TagsInput value={field.value} onChange={field.onChange} />
            )}
          />
        </div>

        {/* Save Button */}
        <PrimaryButton
          type="submit"
          className={cn("mt-2 disabled:opacity-50")}
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? "Saving..." : "Save"}
        </PrimaryButton>
      </form>
    </FormProvider>
  );
});
