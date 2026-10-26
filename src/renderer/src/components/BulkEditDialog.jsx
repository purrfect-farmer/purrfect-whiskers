import AccountsPicker from "./AccountsPicker";
import AppDialogContent from "./AppDialogContent";
import BulkRenameForm from "./BulkRenameForm";
import BulkTagsForm from "./BulkTagsForm";
import { LuListChecks } from "react-icons/lu";
import Tabs from "./Tabs";
import useAccountsSelector from "../hooks/useAccountsSelector";
import useAppStore from "../store/useAppStore";
import useTabs from "../hooks/useTabs";

const SELECTOR_OPTIONS = { initiallySelected: false };

/** Renames and tags many accounts at once */
export default function BulkEditDialog() {
  const accounts = useAppStore((state) => state.accounts);
  const tabs = useTabs(["rename", "tags"], "rename");

  /** Starts empty, so nothing changes until accounts are picked */
  const selector = useAccountsSelector(accounts, SELECTOR_OPTIONS);
  const { selectedAccounts } = selector;

  return (
    <AppDialogContent
      title={"Bulk Edit"}
      description={"Rename and tag many accounts at once"}
      icon={LuListChecks}
    >
      <AccountsPicker {...selector} />

      <Tabs tabs={tabs}>
        <Tabs.Content value="rename" className="flex flex-col gap-2">
          <BulkRenameForm selectedAccounts={selectedAccounts} />
        </Tabs.Content>

        <Tabs.Content value="tags" className="flex flex-col gap-2">
          <BulkTagsForm selectedAccounts={selectedAccounts} />
        </Tabs.Content>
      </Tabs>
    </AppDialogContent>
  );
}
