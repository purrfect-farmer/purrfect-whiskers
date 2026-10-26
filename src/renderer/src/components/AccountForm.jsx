import * as yup from "yup";

import { Controller, FormProvider, useForm } from "react-hook-form";
import { memo, useState } from "react";

import FormField from "./FormField";
import FormInputField from "./FormInputField";
import ProxyOptionsFields from "./ProxyOptionsFields";
import SubmitButton from "./SubmitButton";
import TagsInput from "./TagsInput";
import UserAgentField from "./UserAgentField";
import useAppStore from "../store/useAppStore";
import { accountFieldRules } from "../../../shared/lib/accountFields";
import { yupResolver } from "@hookform/resolvers/yup";

/** The schema of the account form */
const schema = yup
  .object({
    partition: yup.string().nullable(),
    ...accountFieldRules(window.electron.process.versions.chrome),
  })
  .required();

/** Form values of an account, or of a new one */
function getDefaultValues(account) {
  const accountsCount = useAppStore.getState().accounts.length;

  return {
    partition: account?.partition || null,
    telegramInitData: account?.telegramInitData || null,
    title: account?.title || `Account ${accountsCount + 1}`,
    proxyEnabled: account?.proxyEnabled ?? false,
    proxyHost: account?.proxyHost || null,
    proxyPort: account?.proxyPort || null,
    proxyUsername: account?.proxyUsername || null,
    proxyPassword: account?.proxyPassword || null,
    userAgent: account?.userAgent || null,
    tags: account?.tags || [],
  };
}

/** A form for adding or editing an account */
export default memo(function AccountForm({ account, handleFormSubmit }) {
  /** The form's default values */
  const [defaultValues] = useState(() => getDefaultValues(account));

  /** The account form */
  const form = useForm({
    resolver: yupResolver(schema),
    defaultValues,
  });

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(handleFormSubmit)}
        className="flex flex-col gap-2 min-w-0"
      >
        <FormInputField name="title" label="Title" />

        <UserAgentField />

        <ProxyOptionsFields />

        {/* Tags */}
        <FormField label="Tags">
          <Controller
            name="tags"
            render={({ field }) => (
              <TagsInput value={field.value} onChange={field.onChange} />
            )}
          />
        </FormField>

        <SubmitButton className="mt-2" />
      </form>
    </FormProvider>
  );
});
