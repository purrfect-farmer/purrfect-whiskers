import { useCallback, useMemo, useState } from "react";

/** A hook for selecting from a list of accounts */
export default function useAccountsSelector(
  accounts,
  { initiallySelected = true } = {},
) {
  /** The set of selected partitions */
  const [selected, setSelected] = useState(
    () =>
      new Set(initiallySelected ? accounts.map((item) => item.partition) : []),
  );

  /** The selected accounts */
  const selectedAccounts = useMemo(
    () => accounts.filter((item) => selected.has(item.partition)),
    [accounts, selected],
  );

  /** The toggle for one account */
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

  /** The toggle for all accounts, or only the given subset */
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
