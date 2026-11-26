import AutoHeightVirtuoso from "./AutoHeightVirtuoso";
import { Progress } from "./Progress";
import TgGetAccountItem from "./TgGetAccountItem";
import { useCallback } from "react";

/** The max height of the list, in pixels */
const MAX_LIST_HEIGHT = 384;

/** The list key of an account */
const computeItemKey = (_, account) => account.partition;

/** The progress and virtualized per-account status of a transfer */
export default function TgGetStatusList({
  accounts,
  steps,
  outcomes,
  running,
  progress,
}) {
  /** The row of an account */
  const itemContent = useCallback(
    (_, account) => (
      <div className="pb-2 px-2">
        <TgGetAccountItem
          account={account}
          step={steps.get(account.partition)}
          outcome={outcomes.get(account.partition)}
        />
      </div>
    ),
    [steps, outcomes],
  );

  return (
    <div className="flex flex-col gap-2 min-w-0">
      {/* Progress */}
      {running ? <Progress current={progress} max={accounts.length} /> : null}

      {/* Accounts */}
      <AutoHeightVirtuoso
        className="-mx-2"
        maxHeight={MAX_LIST_HEIGHT}
        data={accounts}
        computeItemKey={computeItemKey}
        itemContent={itemContent}
      />
    </div>
  );
}
