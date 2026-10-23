import { createContext, useContext, useMemo } from "react";

const AppContext = createContext();

/** Shares the visible page with the webviews */
export function AppProvider({ currentPage, children }) {
  const value = useMemo(() => ({ currentPage }), [currentPage]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  return useContext(AppContext);
}
