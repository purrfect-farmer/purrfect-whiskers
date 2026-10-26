import { createContext, memo, useState } from "react";

import { Virtuoso } from "react-virtuoso";

/** Whether the surrounding virtualized list is scrolling */
export const ListScrollingContext = createContext(false);

const MemoVirtuoso = memo(Virtuoso);

/** A Virtuoso list that shares whether it is scrolling with its rows */
export default function ScrollAwareVirtuoso(props) {
  /** Whether the list is scrolling */
  const [isScrolling, setIsScrolling] = useState(false);

  return (
    <ListScrollingContext.Provider value={isScrolling}>
      <MemoVirtuoso {...props} isScrolling={setIsScrolling} />
    </ListScrollingContext.Provider>
  );
}
