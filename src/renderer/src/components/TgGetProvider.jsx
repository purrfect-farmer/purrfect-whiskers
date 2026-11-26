import { createContext, useContext } from "react";

import useTgGetCore from "../hooks/useTgGetCore";

/** The context of the TG Get state */
const TgGetContext = createContext();

/** A provider of the TG Get state */
export const TgGetProvider = ({ children }) => {
  /** The TG Get state */
  const tgGet = useTgGetCore();

  return (
    <TgGetContext.Provider value={tgGet}>{children}</TgGetContext.Provider>
  );
};

/** A hook for reading the TG Get state */
export const useTgGet = () => useContext(TgGetContext);
