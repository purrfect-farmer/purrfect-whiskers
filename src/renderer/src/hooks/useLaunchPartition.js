import { useCallback } from "react";

import useAppStore from "../store/useAppStore";
import useSettingsStore from "../store/useSettingsStore";

export default function useLaunchPartition() {
  const partitions = useAppStore((state) => state.partitions);
  const setPage = useAppStore((state) => state.setPage);
  const addPartition = useAppStore((state) => state.addPartition);

  const columns = useSettingsStore((state) => state.columns);
  const rows = useSettingsStore((state) => state.rows);
  const perPage = columns * rows;

  /** Launch Partition */
  return useCallback(
    (id) => {
      if (partitions.includes(id)) {
        setPage(Math.floor(partitions.indexOf(id) / perPage));
      } else {
        addPartition(id, Math.floor(partitions.length / perPage));
      }
    },
    [partitions, perPage, setPage, addPartition]
  );
}
