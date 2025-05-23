import { useCallback } from "react";
import { useLayoutEffect } from "react";
import { useRef } from "react";

export default function useRefCallback(func, deps) {
  const callback = useCallback(func, deps);
  const ref = useRef(callback);

  /** Update Ref */
  useLayoutEffect(() => {
    ref.current = callback;
  }, [callback]);

  return useCallback((...args) => {
    return ref.current(...args);
  }, []);
}
