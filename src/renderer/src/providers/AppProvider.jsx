import { createContext, useContext, useMemo } from "react";

/** The context of the app */
const AppContext = createContext();

/** A provider for sharing the visible page with the webviews */
export function AppProvider({ currentPage, children }) {
  /** The value of the context */
  const value = useMemo(() => ({ currentPage }), [currentPage]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

/** A hook for reading the app context */
export function useAppContext() {
  return useContext(AppContext);
}
