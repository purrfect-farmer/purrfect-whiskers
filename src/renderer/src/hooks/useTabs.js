import { useCallback, useMemo, useState } from "react";

/** State of a tab group; `list` is read once, on mount */
export default function useTabs(defaultList = [], defaultValue) {
  const [list] = useState(defaultList);
  const [value, setValue] = useState(defaultValue || list[0]);

  /** Reset Tab */
  const reset = useCallback(() => setValue(list[0]), [list]);

  const rootProps = useMemo(
    () => ({ value, onValueChange: setValue }),
    [value],
  );

  return useMemo(
    () => ({ value, list, reset, setValue, rootProps }),
    [value, list, reset, rootProps],
  );
}
