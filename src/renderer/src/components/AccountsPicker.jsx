import { useCallback, useState } from "react";

import AccountsPickerItem from "./AccountsPickerItem";
import AccountsToggleAll from "./AccountsToggleAll";
import Input from "./Input";
import TagsList from "./TagsList";
import { Virtuoso } from "react-virtuoso";
import useAccountsFilter from "../hooks/useAccountsFilter";

/** Same as Tailwind's h-96 - the previous max height of the list */
const MAX_LIST_HEIGHT = 384;

const computeItemKey = (_, account) => account.partition;

/**
 * Searchable, virtualized account toggles. `itemComponent` replaces the
 * row and `getItemProps(account)` adds props to each row.
 */
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
        <Virtuoso
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
