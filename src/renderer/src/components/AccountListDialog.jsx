import { HiOutlineCheckBadge, HiOutlinePlus } from "react-icons/hi2";
import { LuArrowUpDown, LuListChecks, LuRocket } from "react-icons/lu";

import { AccountItem } from "./AccountItem";
import AccountsPickerItem from "./AccountsPickerItem";
import AccountsReorderDialog from "./AccountsReorderDialog";
import AccountsToggleAll from "./AccountsToggleAll";
import AddAccountDialog from "./AddAccountDialog";
import { Dialog } from "radix-ui";
import IconButton from "./IconButton";
import Input from "./Input";
import PrimaryButton from "./PrimaryButton";
import CollapsibleTags from "./CollapsibleTags";
import ScrollAwareVirtuoso from "./ScrollAwareVirtuoso";
import { cn } from "../lib/utils";
import { useCallback } from "react";
import useAccountsFilter from "../hooks/useAccountsFilter";
import useAccountsLauncher from "../hooks/useAccountsLauncher";
import useAppStore from "../store/useAppStore";
import useDialogState from "../hooks/useDialogState";

/** The classes of a header dialog trigger */
const TRIGGER_BUTTON_CLASS = cn(
  "shrink-0",
  "bg-orange-100 text-orange-700",
  "dark:bg-orange-200 dark:text-orange-500",
  "flex items-center gap-2",
  "p-2 px-3 rounded-xl text-left",
  "font-bold",
);

/** The list key of an account */
const computeItemKey = (_, item) => item.partition;

/** The badge of a running account */
const RUNNING_BADGE = (
  <HiOutlineCheckBadge className="shrink-0 text-orange-500 size-4" />
);

/** A side dialog for searching, selecting and launching accounts */
export default function AccountListDialog() {
  const accounts = useAppStore((state) => state.accounts);
  const launchAccount = useAppStore((state) => state.launchAccount);
  const {
    tags,
    filterTags,
    search,
    setSearch,
    activeTag,
    selectTag,
    excluded,
    toggleExcluded,
    list,
  } = useAccountsFilter(accounts);

  const { selecting, toggleSelecting, selector, launchSelected } =
    useAccountsLauncher(accounts);
  const { selected, selectedAccounts, toggleAccount, toggleAllAccounts } =
    selector;

  const {
    opened: openAddAccountDialog,
    setOpened: setOpenAddAccountDialog,
    closeDialog: closeAddAccountDialog,
  } = useDialogState();

  const { opened: openReorderDialog, setOpened: setOpenReorderDialog } =
    useDialogState();

  /** The row of an account, a toggle while selecting */
  const itemContent = useCallback(
    (_, item) => (
      <div className="pb-2 px-4">
        {selecting ? (
          <AccountsPickerItem
            account={item}
            checked={selected.has(item.partition)}
            onToggle={toggleAccount}
          >
            {item.running ? RUNNING_BADGE : null}
          </AccountsPickerItem>
        ) : (
          <AccountItem account={item} onLaunch={launchAccount} />
        )}
      </div>
    ),
    [selecting, selected, toggleAccount, launchAccount],
  );

  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 bg-black/50" />
      <Dialog.Content
        onOpenAutoFocus={(ev) => ev.preventDefault()}
        className={cn(
          "fixed inset-y-0 left-0",
          "w-5/6 max-w-xs",
          "bg-white dark:bg-neutral-800",
          "flex flex-col",
        )}
      >
        <div className="p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="flex flex-col grow min-w-0">
              {/* Title */}
              <Dialog.Title
                className={cn(
                  "leading-none font-bold font-turret-road",
                  "text-lg text-orange-500",
                )}
              >
                Accounts ({accounts.length})
              </Dialog.Title>

              {/* Description */}
              <Dialog.Description
                className={cn(
                  "leading-none",
                  "text-neutral-500 dark:text-neutral-400",
                )}
              >
                {selecting ? "Select accounts to launch" : "Select an account"}
              </Dialog.Description>
            </div>

            {/* Reorder Accounts */}
            <Dialog.Root
              open={openReorderDialog}
              onOpenChange={setOpenReorderDialog}
            >
              <Dialog.Trigger
                title="Reorder Accounts"
                className={TRIGGER_BUTTON_CLASS}
              >
                <LuArrowUpDown className="size-5 text-orange-500" />
              </Dialog.Trigger>

              <AccountsReorderDialog />
            </Dialog.Root>

            {/* Add Account */}
            <Dialog.Root
              open={openAddAccountDialog}
              onOpenChange={setOpenAddAccountDialog}
            >
              <Dialog.Trigger
                title="Add Account"
                className={TRIGGER_BUTTON_CLASS}
              >
                <HiOutlinePlus className="size-5 text-orange-500" />
              </Dialog.Trigger>

              <AddAccountDialog close={closeAddAccountDialog} />
            </Dialog.Root>
          </div>

          <div className="flex gap-2">
            {/* Search Input */}
            <Input
              autoFocus
              type="search"
              placeholder={"Search"}
              value={search}
              onChange={(ev) => setSearch(ev.target.value)}
            />

            {/* Toggle Select Mode */}
            <IconButton
              title={selecting ? "Done Selecting" : "Select Accounts"}
              aria-pressed={selecting}
              onClick={toggleSelecting}
              active={selecting}
            >
              <LuListChecks
                className={cn(
                  "size-5",
                  selecting ? "text-orange-500" : "text-neutral-500",
                )}
              />
            </IconButton>
          </div>

          {/* Tags */}
          {tags.length > 0 ? (
            <CollapsibleTags
              accounts={accounts}
              tags={filterTags}
              activeTag={activeTag}
              selectTag={selectTag}
              excluded={excluded}
              toggleExcluded={toggleExcluded}
            />
          ) : null}

          {selecting ? (
            <AccountsToggleAll
              list={list}
              selected={selected}
              toggleAllAccounts={toggleAllAccounts}
            />
          ) : null}
        </div>

        {/* Account List */}
        <div className="grow min-h-0">
          <ScrollAwareVirtuoso
            style={{ height: "100%", width: "100%" }}
            data={list}
            computeItemKey={computeItemKey}
            itemContent={itemContent}
          />
        </div>

        {/* Launch Selected */}
        {selecting ? (
          <div className="p-4 flex flex-col">
            <PrimaryButton
              disabled={selectedAccounts.length === 0}
              onClick={launchSelected}
            >
              <LuRocket className="size-5" />
              Launch ({selectedAccounts.length})
            </PrimaryButton>
          </div>
        ) : null}
      </Dialog.Content>
    </Dialog.Portal>
  );
}
