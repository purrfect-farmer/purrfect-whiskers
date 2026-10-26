import { ALERT_VARIANT } from "../lib/constants";
import Alert from "./Alert";
import CleanerFoundTags from "./CleanerFoundTags";
import { FormProvider } from "react-hook-form";
import { formatNumber } from "../lib/utils";
import useTagsCleaner from "../hooks/useTagsCleaner";

/** The Cleaner tab for removing unused and unknown tags */
export default function CleanerTagsTab() {
  const {
    methods,
    onSubmit,
    unused,
    unknown,
    unknownAccounts,
    foundIds,
    toggleTag,
    setTagsChecked,
    tagCount,
    accountCount,
  } = useTagsCleaner();

  return (
    <FormProvider {...methods}>
      <form onSubmit={onSubmit} className="flex flex-col gap-2 min-w-0">
        {foundIds.length > 0 ? (
          <CleanerFoundTags
            unused={unused}
            unknown={unknown}
            unknownAccounts={unknownAccounts}
            foundIds={foundIds}
            toggleTag={toggleTag}
            setTagsChecked={setTagsChecked}
          />
        ) : (
          <Alert variant={ALERT_VARIANT.SUCCESS}>
            All clean! Checked {formatNumber(tagCount)} tag(s) and{" "}
            {formatNumber(accountCount)} account(s): every tag is on an account,
            and every tag on an account is in your tag list.
          </Alert>
        )}
      </form>
    </FormProvider>
  );
}
