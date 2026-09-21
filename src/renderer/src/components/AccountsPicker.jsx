import AccountsPickerItem from "./AccountsPickerItem";
import Input from "./Input";
import LabelToggle from "./LabelToggle";
import TagsList from "./TagsList";
import { Virtuoso } from "react-virtuoso";
import useAccountsFilter from "../hooks/useAccountsFilter";
import { useMemo, useState } from "react";

/** Same as Tailwind's h-96 - the previous max height of the list */
const MAX_LIST_HEIGHT = 384;

export default function AccountsPicker({
  accounts,
  disabled,
  selectedAccounts,
  toggleAccount,
  toggleAllAccounts,
}) {
  const [listHeight, setListHeight] = useState(0);
  const { tags, search, setSearch, activeTag, selectTag, list } =
    useAccountsFilter(accounts);

  /** Reflects the visible list, not every account */
  const allSelected = useMemo(
    () =>
      list.length > 0 &&
      list.every((account) =>
        selectedAccounts.some((item) => item.partition === account.partition),
      ),
    [list, selectedAccounts],
  );

  return (
    <div className="flex flex-col gap-2">
      {/* Account List Heading */}
      <h4 className="px-4 text-center">
        Accounts ({selectedAccounts.length} / {accounts.length})
      </h4>

      {/* Search Input */}
      <Input
        autoFocus
        type="search"
        placeholder={"Search"}
        disabled={disabled}
        value={search}
        onChange={(ev) => setSearch(ev.target.value)}
      />

      {/* Tags */}
      <TagsList
        accounts={accounts}
        tags={tags}
        disabled={disabled}
        activeTag={activeTag}
        selectTag={selectTag}
      />

      <LabelToggle
        disabled={disabled}
        checked={allSelected}
        onChange={(ev) => toggleAllAccounts(ev.target.checked, list)}
      >
        Toggle Accounts
      </LabelToggle>

      <div
        className="min-h-px -mx-2"
        style={{ height: Math.min(listHeight, MAX_LIST_HEIGHT) }}
      >
        <Virtuoso
          style={{ height: "100%" }}
          data={list}
          totalListHeightChanged={setListHeight}
          computeItemKey={(_, account) => account.partition}
          itemContent={(_, account) => (
            <div className="pb-2 px-2">
              <AccountsPickerItem
                account={account}
                checked={selectedAccounts.some(
                  (item) => item.partition === account.partition,
                )}
                onChange={(ev) => toggleAccount(account, ev.target.checked)}
                disabled={disabled}
              />
            </div>
          )}
        />
      </div>
    </div>
  );
}
