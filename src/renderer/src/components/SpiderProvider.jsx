import { createContext, useContext, useMemo } from "react";

import { useSpiderAccountsForm } from "../hooks/useSpiderAccountsForm";
import { useSpiderCore } from "../hooks/useSpiderCore";

/** The context of the Spider state */
const SpiderContext = createContext();

/** A provider of the Spider state and purchase form */
export const SpiderProvider = ({ active, children }) => {
  /** The core Spider state */
  const core = useSpiderCore({ active });
  /** The Spider purchase form state */
  const form = useSpiderAccountsForm({ core });

  /** The context value */
  const value = useMemo(() => ({ core, form }), [core, form]);

  return (
    <SpiderContext.Provider value={value}>{children}</SpiderContext.Provider>
  );
};

/** A hook for reading the Spider context */
export const useSpider = () => useContext(SpiderContext);
