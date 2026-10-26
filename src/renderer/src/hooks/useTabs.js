import { useCallback, useMemo, useState } from "react";

/** A hook for a tab group's state; `list` is read once, on mount */
export default function useTabs(defaultList = [], defaultValue) {
  /** The list of tabs */
  const [list] = useState(defaultList);
  /** The active tab */
  const [value, setValue] = useState(defaultValue || list[0]);

  /** The reset to the first tab */
  const reset = useCallback(() => setValue(list[0]), [list]);

  /** The props of the tabs root */
  const rootProps = useMemo(
    () => ({ value, onValueChange: setValue }),
    [value],
  );

  return useMemo(
    () => ({ value, list, reset, setValue, rootProps }),
    [value, list, reset, rootProps],
  );
}
