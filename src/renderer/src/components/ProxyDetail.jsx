import { HiOutlineSquare2Stack } from "react-icons/hi2";
import { cn } from "../lib/utils";
import { copyText } from "../lib/proxy/utils";

export default function ProxyDetail({ label, value, copyValue, children }) {
  return (
    <>
      <dt className="text-neutral-500 dark:text-neutral-400">{label}</dt>
      <dd className="flex items-center gap-1 min-w-0">
        <span className="grow min-w-0 break-all">{children ?? value}</span>
        {copyValue ? (
          <button
            type="button"
            title={`Copy ${label}`}
            onClick={() => copyText(copyValue, label)}
            className={cn(
              "p-1 rounded-md shrink-0",
              "hover:bg-orange-100 hover:text-orange-500",
              "dark:hover:bg-neutral-600",
            )}
          >
            <HiOutlineSquare2Stack className="size-3.5" />
          </button>
        ) : null}
      </dd>
    </>
  );
}
