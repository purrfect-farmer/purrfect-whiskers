import useAppStore from "../store/useAppStore";

/** Subscribes to a single account by partition */
export default function useAccount(partition) {
  return useAppStore((state) =>
    state.accounts.find((item) => item.partition === partition),
  );
}
