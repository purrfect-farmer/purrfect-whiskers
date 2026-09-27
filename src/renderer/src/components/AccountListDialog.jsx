import { AccountItem } from "./AccountItem";
import AccountsReorderDialog from "./AccountsReorderDialog";
import AddAccountDialog from "./AddAccountDialog";
import { Dialog } from "radix-ui";
import { HiOutlinePlus, HiTag } from "react-icons/hi2";
import IconButton from "./IconButton";
import Input from "./Input";
import { LuArrowUpDown } from "react-icons/lu";
import TagsList from "./TagsList";
import { Virtuoso } from "react-virtuoso";
import { cn } from "../lib/utils";
import useAccountsFilter from "../hooks/useAccountsFilter";
import useAppStore from "../store/useAppStore";
import useDialogState from "../hooks/useDialogState";
import useSettingsStore from "../store/useSettingsStore";

const TRIGGER_BUTTON_CLASS = cn(
  "shrink-0",
  "bg-orange-100 text-orange-700",
  "dark:bg-orange-200 dark:text-orange-500",
  "flex items-center gap-2",
  "p-2 px-3 rounded-xl text-left",
  "font-bold",
);

export default function AccountListDialog() {
  const accounts = useAppStore((state) => state.accounts);
  const launchAccount = useAppStore((state) => state.launchAccount);
  const showAccountTags = useSettingsStore((state) => state.showAccountTags);
  const setShowAccountTags = useSettingsStore(
    (state) => state.setShowAccountTags,
  );

  const { tags, search, setSearch, activeTag, selectTag, list } =
    useAccountsFilter(accounts);

  const {
    opened: openAddAccountDialog,
    setOpened: setOpenAddAccountDialog,
    closeDialog: closeAddAccountDialog,
  } = useDialogState();

  const { opened: openReorderDialog, setOpened: setOpenReorderDialog } =
    useDialogState();

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
              <Dialog.Description className="text-neutral-500 dark:text-neutral-400 leading-none">
                Select an account
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

            {/* Toggle Tags */}
            {tags.length > 0 ? (
              <IconButton
                title={showAccountTags ? "Hide Tags" : "Show Tags"}
                onClick={() => setShowAccountTags(!showAccountTags)}
                className={cn(
                  "gap-1 font-bold",
                  showAccountTags &&
                    "bg-orange-100 text-orange-700 dark:bg-orange-200 dark:text-orange-500",
                )}
              >
                <HiTag
                  className={cn(
                    "size-5",
                    showAccountTags ? "text-orange-500" : "text-neutral-500",
                  )}
                />
                <span className="leading-none">{tags.length}</span>
              </IconButton>
            ) : null}
          </div>

          {/* Tags (keep the active tag visible when hidden) */}
          {showAccountTags || activeTag ? (
            <TagsList
              accounts={accounts}
              tags={showAccountTags ? tags : [activeTag]}
              activeTag={activeTag}
              selectTag={selectTag}
            />
          ) : null}
        </div>

        {/* Account List */}
        <div className="grow min-h-0 ">
          <Virtuoso
            style={{ height: "100%", width: "100%" }}
            data={list}
            computeItemKey={(_, item) => item.partition}
            itemContent={(_, item) => (
              <div className="pb-2 px-4 pb">
                <AccountItem
                  account={item}
                  active={item.running}
                  onClick={() => launchAccount(item.partition)}
                />
              </div>
            )}
          />
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  );
}
