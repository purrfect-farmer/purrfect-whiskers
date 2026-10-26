import {
  getCachedSessionCount,
  subscribeToSessions,
} from "../lib/accountSessions";

import { useSyncExternalStore } from "react";

/** A hook for the number of cached Telegram sessions */
export default function useCachedSessionCount() {
  return useSyncExternalStore(subscribeToSessions, getCachedSessionCount);
}
