import useAppStore from "../store/useAppStore";

/** A hook for reading one account by its partition */
export default function useAccount(partition) {
  return useAppStore((state) =>
    state.accounts.find((item) => item.partition === partition),
  );
}
