import AccountsPicker from "./AccountsPicker";
import AppDialogContent from "./AppDialogContent";
import { BULK_EDIT_TAB } from "../lib/constants";
import BulkDeleteForm from "./BulkDeleteForm";
import BulkRenameForm from "./BulkRenameForm";
import BulkTagsForm from "./BulkTagsForm";
import { FormProvider, useFormState } from "react-hook-form";
import { LuListChecks } from "react-icons/lu";
import SubmitButton from "./SubmitButton";
import Tabs from "./Tabs";
import useAccountsSelector from "../hooks/useAccountsSelector";
import useAppStore from "../store/useAppStore";
import useBatchRunner from "../hooks/useBatchRunner";
import useBulkDeleteForm from "../hooks/useBulkDeleteForm";
import useBulkRenameForm from "../hooks/useBulkRenameForm";
import useBulkTagsForm from "../hooks/useBulkTagsForm";
import useTabs from "../hooks/useTabs";

/** The options of the account selection */
const SELECTOR_OPTIONS = { initiallySelected: false };

/** The form id, submit label and pending label of each tab */
const TAB_SUBMIT = {
  [BULK_EDIT_TAB.RENAME]: {
    form: "bulk-rename-form",
    label: "Rename",
    pendingText: "Renaming...",
  },
  [BULK_EDIT_TAB.TAGS]: {
    form: "bulk-tags-form",
    label: "Apply Tags",
    pendingText: "Applying...",
  },
  [BULK_EDIT_TAB.DELETE]: {
    form: "bulk-delete-form",
    label: "Delete",
    pendingText: "Deleting...",
    variant: "danger",
  },
};

/** A dialog for renaming, tagging and deleting many accounts at once */
export default function BulkEditDialog() {
  const accounts = useAppStore((state) => state.accounts);
  /** The rename and tags tabs */
  const tabs = useTabs(Object.values(BULK_EDIT_TAB), BULK_EDIT_TAB.RENAME);

  /** The selection of accounts to edit, starting empty */
  const selector = useAccountsSelector(accounts, SELECTOR_OPTIONS);
  const { selectedAccounts } = selector;

  /** The rename form */
  const renameForm = useBulkRenameForm(selectedAccounts);

  /** The tags form */
  const tagsForm = useBulkTagsForm(selectedAccounts);

  /** The backup progress of a delete */
  const { isProcessing, target, progress, run } = useBatchRunner();

  /** The delete form */
  const deleteForm = useBulkDeleteForm(selectedAccounts, run);

  /** Whether a delete is running */
  const { isSubmitting: isDeleting } = useFormState({
    control: deleteForm.methods.control,
  });

  /** The form of each tab */
  const forms = {
    [BULK_EDIT_TAB.RENAME]: renameForm,
    [BULK_EDIT_TAB.TAGS]: tagsForm,
    [BULK_EDIT_TAB.DELETE]: deleteForm,
  };

  /** The form and submit labels of the active tab */
  const activeForm = forms[tabs.value];
  const submit = TAB_SUBMIT[tabs.value];

  return (
    <AppDialogContent
      title={"Bulk Edit"}
      description={"Rename, tag and delete many accounts at once"}
      icon={LuListChecks}
    >
      <Tabs tabs={tabs}>
        <Tabs.Content
          value={BULK_EDIT_TAB.RENAME}
          className="flex flex-col gap-2"
        >
          <BulkRenameForm
            id={TAB_SUBMIT[BULK_EDIT_TAB.RENAME].form}
            methods={renameForm.methods}
            onSubmit={renameForm.onSubmit}
            selectedAccounts={selectedAccounts}
          />
        </Tabs.Content>

        <Tabs.Content
          value={BULK_EDIT_TAB.TAGS}
          className="flex flex-col gap-2"
        >
          <BulkTagsForm
            id={TAB_SUBMIT[BULK_EDIT_TAB.TAGS].form}
            methods={tagsForm.methods}
            onSubmit={tagsForm.onSubmit}
          />
        </Tabs.Content>

        <Tabs.Content
          value={BULK_EDIT_TAB.DELETE}
          className="flex flex-col gap-2"
        >
          <BulkDeleteForm
            id={TAB_SUBMIT[BULK_EDIT_TAB.DELETE].form}
            methods={deleteForm.methods}
            onSubmit={deleteForm.onSubmit}
            count={selectedAccounts.length}
            isBackingUp={isProcessing}
            target={target}
            progress={progress}
          />
        </Tabs.Content>
      </Tabs>

      <AccountsPicker {...selector} disabled={isDeleting} />

      {/* Submit of the active tab's form */}
      <FormProvider {...activeForm.methods}>
        <SubmitButton
          form={submit.form}
          variant={submit.variant}
          pendingText={submit.pendingText}
          disabled={selectedAccounts.length === 0}
        >
          {submit.label} ({selectedAccounts.length})
        </SubmitButton>
      </FormProvider>
    </AppDialogContent>
  );
}
