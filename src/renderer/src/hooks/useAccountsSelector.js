import { useCallback, useMemo, useState } from "react";

/** Selection over a list of accounts, starting with all of them selected */
export default function useAccountsSelector(
  accounts,
  { initiallySelected = true } = {},
) {
  const [selected, setSelected] = useState(
    () =>
      new Set(initiallySelected ? accounts.map((item) => item.partition) : []),
  );

  const selectedAccounts = useMemo(
    () => accounts.filter((item) => selected.has(item.partition)),
    [accounts, selected],
  );

  const toggleAccount = useCallback((partition, checked) => {
    setSelected((prev) => {
      const next = new Set(prev);

      if (checked) {
        next.add(partition);
      } else {
        next.delete(partition);
      }

      return next;
    });
  }, []);

  /**
   * Toggles only the given subset - accounts outside of it keep their
   * current state, so toggling while a tag is active leaves the rest alone.
   */
  const toggleAllAccounts = useCallback(
    (checked, subset = accounts) => {
      setSelected((prev) => {
        const next = new Set(prev);

        for (const item of subset) {
          if (checked) {
            next.add(item.partition);
          } else {
            next.delete(item.partition);
          }
        }

        return next;
      });
    },
    [accounts],
  );

  return useMemo(
    () => ({
      accounts,
      selected,
      selectedAccounts,
      setSelected,
      toggleAccount,
      toggleAllAccounts,
    }),
    [accounts, selected, selectedAccounts, toggleAccount, toggleAllAccounts],
  );
}
