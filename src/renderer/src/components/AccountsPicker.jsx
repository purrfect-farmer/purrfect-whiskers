import { useCallback, useState } from "react";

import AccountsPickerItem from "./AccountsPickerItem";
import AccountsToggleAll from "./AccountsToggleAll";
import Input from "./Input";
import TagsList from "./TagsList";
import ScrollAwareVirtuoso from "./ScrollAwareVirtuoso";
import useAccountsFilter from "../hooks/useAccountsFilter";

/** The max height of the list, in pixels */
const MAX_LIST_HEIGHT = 384;

/** The list key of an account */
const computeItemKey = (_, account) => account.partition;

/** A searchable, virtualized list of account toggles */
export default function AccountsPicker({
  accounts,
  itemComponent: Item = AccountsPickerItem,
  getItemProps,
  disabled,
  showTags = true,
  selected,
  selectedAccounts,
  toggleAccount,
  toggleAllAccounts,
}) {
  /** The height of the list's content */
  const [listHeight, setListHeight] = useState(0);
  const {
    filterTags,
    search,
    setSearch,
    activeTag,
    selectTag,
    excluded,
    toggleExcluded,
    list,
  } = useAccountsFilter(accounts);

  /** The row of an account */
  const itemContent = useCallback(
    (_, account) => (
      <div className="pb-2 px-2">
        <Item
          account={account}
          checked={selected.has(account.partition)}
          onToggle={toggleAccount}
          disabled={disabled}
          {...getItemProps?.(account)}
        />
      </div>
    ),
    [Item, getItemProps, selected, toggleAccount, disabled],
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
      {showTags ? (
        <TagsList
          accounts={accounts}
          tags={filterTags}
          disabled={disabled}
          activeTag={activeTag}
          selectTag={selectTag}
          excluded={excluded}
          toggleExcluded={toggleExcluded}
        />
      ) : null}

      <AccountsToggleAll
        list={list}
        selected={selected}
        toggleAllAccounts={toggleAllAccounts}
        disabled={disabled}
      />

      <div
        className="min-h-px -mx-2"
        style={{ height: Math.min(listHeight, MAX_LIST_HEIGHT) }}
      >
        <ScrollAwareVirtuoso
          style={{ height: "100%" }}
          data={list}
          totalListHeightChanged={setListHeight}
          computeItemKey={computeItemKey}
          itemContent={itemContent}
        />
      </div>
    </div>
  );
}
