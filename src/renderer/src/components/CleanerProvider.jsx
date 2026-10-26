import { createContext, useContext } from "react";

import useCleanerCore from "../hooks/useCleanerCore";

/** The context of the Cleaner state */
const CleanerContext = createContext();

/** A provider of the Cleaner state */
export const CleanerProvider = ({ onLaunch, children }) => {
  /** The Cleaner state */
  const cleaner = useCleanerCore({ onLaunch });

  return (
    <CleanerContext.Provider value={cleaner}>
      {children}
    </CleanerContext.Provider>
  );
};

/** A hook for reading the Cleaner state */
export const useCleaner = () => useContext(CleanerContext);
