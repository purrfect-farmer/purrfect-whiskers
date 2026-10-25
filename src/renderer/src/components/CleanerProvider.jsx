import { createContext, useContext } from "react";

import useCleanerCore from "../hooks/useCleanerCore";

const CleanerContext = createContext();

/**
 * Holds Cleaner state above the dialog, so a scan or clean keeps running
 * and its results stay after the dialog closes. `onLaunch` runs after an
 * account is launched from the list.
 */
export const CleanerProvider = ({ onLaunch, children }) => {
  const cleaner = useCleanerCore({ onLaunch });

  return (
    <CleanerContext.Provider value={cleaner}>
      {children}
    </CleanerContext.Provider>
  );
};

export const useCleaner = () => useContext(CleanerContext);
