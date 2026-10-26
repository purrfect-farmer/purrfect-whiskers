import { ALERT_VARIANT } from "../lib/constants";
import {
  HiOutlineArrowDown,
  HiOutlineArrowUp,
  HiOutlineXMark,
} from "react-icons/hi2";
import { memo, useCallback, useRef, useState } from "react";

import AccountsReorderItem from "./AccountsReorderItem";
import Alert from "./Alert";
import Input from "./Input";
import { LuArrowUpDown } from "react-icons/lu";
import ScrollAwareVirtuoso from "./ScrollAwareVirtuoso";
import { cn, matchesSearch } from "../lib/utils";
import useAppStore from "../store/useAppStore";

/** The height of the list, in pixels */
const LIST_HEIGHT = 384;

/** The classes of a row control button */
const CONTROL_BUTTON_CLASS = cn(
  "bg-neutral-100 dark:bg-neutral-700",
  "hover:bg-orange-100 hover:text-orange-700",
  "dark:hover:bg-orange-200 dark:hover:text-orange-500",
  "flex items-center justify-center",
  "px-2 rounded-xl shrink-0",
  "disabled:opacity-50",
);

/** A row of an account with its position and move controls */
const AccountRow = memo(function AccountRow({
  account,
  index,
  total,
  moving,
  highlighted,
  onMove,
  onPlaceBefore,
  onStartMoving,
}) {
  /** Whether this account is being moved */
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
          type="button"
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
            type="button"
            title="Move Up"
            disabled={index === 0}
            className={CONTROL_BUTTON_CLASS}
            onClick={() => onMove(account.partition, index - 1)}
          >
            <HiOutlineArrowUp className="size-4" />
          </button>

          {/* Move Down */}
          <button
            type="button"
            title="Move Down"
            disabled={index === total - 1}
            className={CONTROL_BUTTON_CLASS}
            onClick={() => onMove(account.partition, index + 1)}
          >
            <HiOutlineArrowDown className="size-4" />
          </button>

          {/* Move Elsewhere */}
          <button
            type="button"
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
});

/** A "Place at end" button shown while an account is being moved */
function PlaceAtEndFooter({ context }) {
  if (!context.moving) return null;

  return (
    <div className="px-2">
      <button
        type="button"
        className={cn(
          "w-full px-4 py-2.5 rounded-xl font-bold",
          "bg-neutral-100 dark:bg-neutral-700",
          "hover:bg-orange-100 hover:text-orange-700",
          "dark:hover:bg-orange-200 dark:hover:text-orange-500",
        )}
        onClick={context.onPlaceAtEnd}
      >
        Place at end
      </button>
    </div>
  );
}

/** The custom components of the list */
const LIST_COMPONENTS = { Footer: PlaceAtEndFooter };

/** The list key of an account */
const computeItemKey = (_, item) => item.partition;

/** A virtualized list for reordering accounts with move controls */
export default function AccountsVirtualReorderList({ accounts }) {
  /** The ref of the virtualized list */
  const virtuoso = useRef(null);
  /** The timeout that clears the highlight */
  const highlightTimeout = useRef(null);

  /** The search text */
  const [search, setSearch] = useState("");
  /** The partition of the account being moved */
  const [moving, setMoving] = useState(null);
  /** The partition of the highlighted account */
  const [highlighted, setHighlighted] = useState(null);

  const moveAccount = useAppStore((state) => state.moveAccount);

  /** The account being moved */
  const movingAccount = moving
    ? accounts.find((item) => item.partition === moving)
    : null;

  /** The callback that scrolls to an account and highlights it */
  const revealIndex = useCallback((index, partition) => {
    virtuoso.current?.scrollToIndex({ index, align: "center" });

    setHighlighted(partition);
    clearTimeout(highlightTimeout.current);
    highlightTimeout.current = setTimeout(() => setHighlighted(null), 1500);
  }, []);

  /** The handler for moving an account to an index */
  const handleMove = useCallback(
    (partition, toIndex) => {
      moveAccount(partition, toIndex);
      revealIndex(toIndex, partition);
    },
    [moveAccount, revealIndex],
  );

  /** The handler for placing the moving account above a row */
  const handlePlaceBefore = useCallback(
    (index) => {
      const fromIndex = accounts.findIndex((item) => item.partition === moving);
      const toIndex = fromIndex < index ? index - 1 : index;

      handleMove(moving, toIndex);
      setMoving(null);
    },
    [accounts, moving, handleMove],
  );

  /** The handler for placing the moving account at the end */
  const handlePlaceAtEnd = useCallback(() => {
    handleMove(moving, accounts.length - 1);
    setMoving(null);
  }, [accounts.length, moving, handleMove]);

  /** The row of an account */
  const itemContent = useCallback(
    (index, item, context) => (
      <div className="pb-2 px-2">
        <AccountRow
          account={item}
          index={index}
          total={context.total}
          moving={context.moving}
          highlighted={context.highlighted === item.partition}
          onMove={handleMove}
          onPlaceBefore={handlePlaceBefore}
          onStartMoving={setMoving}
        />
      </div>
    ),
    [handleMove, handlePlaceBefore],
  );

  /** The handler for a search that jumps to the first match */
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
            type="button"
            title="Cancel"
            className="shrink-0"
            onClick={() => setMoving(null)}
          >
            <HiOutlineXMark className="size-5" />
          </button>
        </div>
      ) : (
        /* Info Alert */
        <Alert variant={ALERT_VARIANT.INFO}>
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
        <ScrollAwareVirtuoso
          ref={virtuoso}
          style={{ height: "100%" }}
          data={accounts}
          computeItemKey={computeItemKey}
          itemContent={itemContent}
          components={LIST_COMPONENTS}
          context={{
            total: accounts.length,
            moving,
            highlighted,
            onPlaceAtEnd: handlePlaceAtEnd,
          }}
        />
      </div>
    </>
  );
}
