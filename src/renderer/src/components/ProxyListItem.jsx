import {
  HiChevronDown,
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineGlobeAlt,
  HiOutlineSquare2Stack,
} from "react-icons/hi2";
import {
  copyText,
  formatDateTime,
  getCountry,
  getProxyUrl,
} from "../lib/proxy/utils";
import { memo, useState } from "react";

import { Collapsible } from "radix-ui";
import ProxyDetail from "./ProxyDetail";
import { cn } from "../lib/utils";

export default memo(function ProxyListItem({
  proxy,
  index,
  expanded,
  onToggle,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const country = getCountry(proxy.countryCode);
  const location = [proxy.city, country?.name].filter(Boolean).join(", ");

  /** Copy Proxy URL */
  const copyProxy = () => copyText(getProxyUrl(proxy), "Proxy");

  return (
    <Collapsible.Root
      open={expanded}
      onOpenChange={() => onToggle(index)}
      className="rounded-xl bg-neutral-100 dark:bg-neutral-700"
    >
      <div className="flex items-center gap-1 p-2">
        {/* Summary */}
        <Collapsible.Trigger className="flex items-center gap-3 grow min-w-0 text-left">
          {/* Flag */}
          <span
            title={country?.name}
            className={cn(
              "size-10 shrink-0 rounded-lg text-2xl",
              "flex items-center justify-center",
            )}
          >
            {country?.emoji || (
              <HiOutlineGlobeAlt className="size-5 text-neutral-400" />
            )}
          </span>

          {/* Details */}
          <div className="flex flex-col min-w-0 grow">
            <p className="font-mono font-bold truncate">
              {proxy.host}:{proxy.port}
            </p>
            <p className="text-neutral-500 dark:text-neutral-400 truncate">
              {location || "Unknown location"}
            </p>
          </div>

          {/* Status */}
          <div className="flex flex-col items-end shrink-0 text-xs gap-1">
            <span className="text-neutral-400">#{index + 1}</span>
            {typeof proxy.valid === "boolean" ? (
              <span
                className={cn(
                  "flex items-center gap-1 font-bold",
                  proxy.valid ? "text-green-500" : "text-red-500",
                )}
              >
                <span
                  className={cn(
                    "size-2 rounded-full",
                    proxy.valid ? "bg-green-500" : "bg-red-500",
                  )}
                />
                {proxy.valid ? "Valid" : "Invalid"}
              </span>
            ) : null}
          </div>

          {/* Chevron */}
          <HiChevronDown
            className={cn(
              "size-4 shrink-0 text-neutral-400",
              "transition-transform",
              expanded && "rotate-180",
            )}
          />
        </Collapsible.Trigger>

        {/* Copy */}
        <button
          type="button"
          title="Copy Proxy"
          onClick={copyProxy}
          className={cn(
            "p-2 rounded-lg shrink-0",
            "hover:bg-orange-100 hover:text-orange-500",
            "dark:hover:bg-neutral-600",
          )}
        >
          <HiOutlineSquare2Stack className="size-4" />
        </button>
      </div>

      {/* Expanded Details */}
      <Collapsible.Content asChild>
        <dl
          className={cn(
            "grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5",
            "px-3 pt-2 pb-3 mx-2 border-t",
            "border-neutral-200 dark:border-neutral-600",
          )}
        >
          <ProxyDetail label="Host" value={proxy.host} copyValue={proxy.host} />
          <ProxyDetail label="Port" value={proxy.port} copyValue={proxy.port} />

          {proxy.username ? (
            <ProxyDetail
              label="Username"
              value={proxy.username}
              copyValue={proxy.username}
            />
          ) : null}

          {proxy.password ? (
            <ProxyDetail label="Password" copyValue={proxy.password}>
              <span className="flex items-center gap-1">
                <span className="font-mono break-all">
                  {showPassword ? proxy.password : "••••••"}
                </span>
                <button
                  type="button"
                  title={showPassword ? "Hide Password" : "Show Password"}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="p-1 rounded-md shrink-0 hover:text-orange-500"
                >
                  {showPassword ? (
                    <HiOutlineEyeSlash className="size-3.5" />
                  ) : (
                    <HiOutlineEye className="size-3.5" />
                  )}
                </button>
              </span>
            </ProxyDetail>
          ) : null}

          {country ? (
            <ProxyDetail label="Country">
              {[country.emoji, country.name, `(${country.code})`]
                .filter(Boolean)
                .join(" ")}
            </ProxyDetail>
          ) : null}

          {proxy.city ? <ProxyDetail label="City" value={proxy.city} /> : null}

          {typeof proxy.valid === "boolean" ? (
            <ProxyDetail
              label="Status"
              value={proxy.valid ? "Valid" : "Invalid"}
            />
          ) : null}

          {proxy.lastVerification ? (
            <ProxyDetail
              label="Last Verified"
              value={formatDateTime(proxy.lastVerification)}
            />
          ) : null}

          {proxy.createdAt ? (
            <ProxyDetail
              label="Created"
              value={formatDateTime(proxy.createdAt)}
            />
          ) : null}

          {proxy.id ? (
            <ProxyDetail
              label="Proxy ID"
              value={proxy.id}
              copyValue={proxy.id}
            />
          ) : null}
        </dl>
      </Collapsible.Content>
    </Collapsible.Root>
  );
});
