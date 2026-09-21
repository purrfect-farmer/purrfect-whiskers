import { useCallback, useState } from "react";

export default function useAccountsSelector(accounts) {
  const [selectedAccounts, setSelectedAccounts] = useState(accounts);

  const toggleAccount = useCallback((account, checked) => {
    if (checked) {
      setSelectedAccounts((prev) => [...prev, account]);
    } else {
      setSelectedAccounts((prev) =>
        prev.filter((item) => item.partition !== account.partition),
      );
    }
  }, []);

  /**
   * Toggles only the given subset - accounts outside of it keep their
   * current state, so toggling while a tag is active leaves the rest alone.
   */
  const toggleAllAccounts = useCallback(
    (checked, subset = accounts) => {
      setSelectedAccounts((prev) => {
        const affected = new Set(subset.map((item) => item.partition));
        const selected = new Set(prev.map((item) => item.partition));

        return accounts.filter((item) =>
          affected.has(item.partition) ? checked : selected.has(item.partition),
        );
      });
    },
    [accounts],
  );

  return {
    accounts,
    selectedAccounts,
    setSelectedAccounts,
    toggleAccount,
    toggleAllAccounts,
  };
}
