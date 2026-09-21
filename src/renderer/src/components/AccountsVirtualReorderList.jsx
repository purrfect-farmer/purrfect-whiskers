import {
  HiOutlineArrowDown,
  HiOutlineArrowUp,
  HiOutlineXMark,
} from "react-icons/hi2";
import { useCallback, useMemo, useRef, useState } from "react";

import AccountsReorderItem from "./AccountsReorderItem";
import Alert from "./Alert";
import Input from "./Input";
import { LuArrowUpDown } from "react-icons/lu";
import { Virtuoso } from "react-virtuoso";
import { cn, matchesSearch } from "../lib/utils";
import useAppStore from "../store/useAppStore";

/** Same as Tailwind's h-96 */
const LIST_HEIGHT = 384;

const CONTROL_BUTTON_CLASS = cn(
  "bg-neutral-100 dark:bg-neutral-700",
  "hover:bg-orange-100 hover:text-orange-700",
  "dark:hover:bg-orange-200 dark:hover:text-orange-500",
  "flex items-center justify-center",
  "px-2 rounded-xl shrink-0",
  "disabled:opacity-50",
);

function AccountRow({
  account,
  index,
  total,
  moving,
  highlighted,
  onMove,
  onPlaceBefore,
  onStartMoving,
}) {
  /** The account currently being moved */
  const isMoving = moving === account.partition;

  return (
    <div className={cn("flex gap-2 items-stretch", isMoving && "opacity-50")}>
      {/* Position */}
      <div
        className={cn(
          "bg-neutral-100 dark:bg-neutral-700",
          "flex items-center justify-center shrink-0 w-12",
          "rounded-xl tabular-nums",
          "text-neutral-500 dark:text-neutral-400 text-xs",
        )}
      >
        {index + 1}
      </div>

      {/* Account */}
      <AccountsReorderItem
        account={account}
        className={cn(highlighted && "ring-2 ring-orange-500")}
      />

      {/* Controls */}
      {moving ? (
        <button
          disabled={isMoving}
          title="Place here"
          className={cn(CONTROL_BUTTON_CLASS, "font-bold")}
          onClick={() => onPlaceBefore(index)}
        >
          Place here
        </button>
      ) : (
        <>
          {/* Move Up */}
          <button
            title="Move Up"
            disabled={index === 0}
            className={CONTROL_BUTTON_CLASS}
            onClick={() => onMove(account.partition, index - 1)}
          >
            <HiOutlineArrowUp className="size-4" />
          </button>

          {/* Move Down */}
          <button
            title="Move Down"
            disabled={index === total - 1}
            className={CONTROL_BUTTON_CLASS}
            onClick={() => onMove(account.partition, index + 1)}
          >
            <HiOutlineArrowDown className="size-4" />
          </button>

          {/* Move Elsewhere */}
          <button
            title="Move to a position"
            className={CONTROL_BUTTON_CLASS}
            onClick={() => onStartMoving(account.partition)}
          >
            <LuArrowUpDown className="size-4" />
          </button>
        </>
      )}
    </div>
  );
}

/**
 * Virtualized reordering, driven by explicit controls instead of dragging -
 * the rows are windowed, so there is nothing to drag onto once a destination
 * scrolls out of the DOM. Scales to thousands of accounts.
 */
export default function AccountsVirtualReorderList({ accounts }) {
  const virtuoso = useRef(null);
  const highlightTimeout = useRef(null);

  const [search, setSearch] = useState("");
  const [moving, setMoving] = useState(null);
  const [highlighted, setHighlighted] = useState(null);

  const moveAccount = useAppStore((state) => state.moveAccount);

  const movingAccount = moving
    ? accounts.find((item) => item.partition === moving)
    : null;

  /** Scrolls an index into view and flashes it */
  const revealIndex = useCallback((index, partition) => {
    virtuoso.current?.scrollToIndex({ index, align: "center" });

    setHighlighted(partition);
    clearTimeout(highlightTimeout.current);
    highlightTimeout.current = setTimeout(() => setHighlighted(null), 1500);
  }, []);

  /** Moves an account to a final index */
  const handleMove = useCallback(
    (partition, toIndex) => {
      moveAccount(partition, toIndex);
      revealIndex(toIndex, partition);
    },
    [moveAccount, revealIndex],
  );

  /**
   * Places the account being moved above the given row. Removing it first
   * shifts everything below up by one, so the target is adjusted for that.
   */
  const handlePlaceBefore = useCallback(
    (index) => {
      const fromIndex = accounts.findIndex((item) => item.partition === moving);
      const toIndex = fromIndex < index ? index - 1 : index;

      handleMove(moving, toIndex);
      setMoving(null);
    },
    [accounts, moving, handleMove],
  );

  /** Places the account being moved at the end of the list */
  const handlePlaceAtEnd = useCallback(() => {
    handleMove(moving, accounts.length - 1);
    setMoving(null);
  }, [accounts.length, moving, handleMove]);

  /** Trailing "Place at end" target, stable so virtuoso keeps it mounted */
  const components = useMemo(
    () => ({
      Footer: () =>
        moving ? (
          <button
            className={cn(
              "w-full px-4 py-2.5 rounded-xl font-bold",
              "bg-neutral-100 dark:bg-neutral-700",
              "hover:bg-orange-100 hover:text-orange-700",
              "dark:hover:bg-orange-200 dark:hover:text-orange-500",
            )}
            onClick={handlePlaceAtEnd}
          >
            Place at end
          </button>
        ) : null,
    }),
    [moving, handlePlaceAtEnd],
  );

  /**
   * Scrolls to the first match instead of filtering - the rows are indexed by
   * their real position, so the list must stay complete.
   */
  const handleSearch = useCallback(
    (value) => {
      setSearch(value);

      if (!value) return;

      const index = accounts.findIndex((item) => matchesSearch(value, item));

      if (index >= 0) revealIndex(index, accounts[index].partition);
    },
    [accounts, revealIndex],
  );

  return (
    <>
      {movingAccount ? (
        /* Moving Account */
        <div
          className={cn(
            "px-4 py-2 rounded-xl",
            "flex items-center gap-4",
            "bg-orange-100 text-orange-800 dark:text-orange-900",
          )}
        >
          <p className="grow min-w-0 truncate">
            Moving <b>{movingAccount.title}</b> &mdash; choose a position
          </p>

          {/* Cancel */}
          <button
            title="Cancel"
            className="shrink-0"
            onClick={() => setMoving(null)}
          >
            <HiOutlineXMark className="size-5" />
          </button>
        </div>
      ) : (
        /* Info Alert */
        <Alert variant={"info"}>
          Use the arrows to nudge an account, or move it to any position. Search
          to jump to an account. The order is saved automatically.
        </Alert>
      )}

      {/* Search Input */}
      <Input
        type="search"
        placeholder={"Jump to account"}
        value={search}
        onChange={(ev) => handleSearch(ev.target.value)}
      />

      {/* Accounts List */}
      <div className="min-h-px -mx-2" style={{ height: LIST_HEIGHT }}>
        <Virtuoso
          ref={virtuoso}
          style={{ height: "100%" }}
          data={accounts}
          computeItemKey={(_, item) => item.partition}
          itemContent={(index, item) => (
            <div className="pb-2 px-2">
              <AccountRow
                account={item}
                index={index}
                total={accounts.length}
                moving={moving}
                highlighted={highlighted === item.partition}
                onMove={handleMove}
                onPlaceBefore={handlePlaceBefore}
                onStartMoving={setMoving}
              />
            </div>
          )}
          components={components}
        />
      </div>
    </>
  );
}
