import { Controller, useFormContext } from "react-hook-form";

import FormInputField from "./FormInputField";
import { HiXMark } from "react-icons/hi2";
import LabelToggle from "./LabelToggle";
import SectionLabel from "./SectionLabel";
import { cn } from "../lib/utils";
import { memo } from "react";

/** Proxy inputs, two per row */
const PROXY_FIELD_ROWS = [
  [
    { name: "proxyHost", label: "Proxy Host" },
    { name: "proxyPort", label: "Proxy Port" },
  ],
  [
    { name: "proxyUsername", label: "Proxy Username" },
    { name: "proxyPassword", label: "Proxy Password" },
  ],
];

/** Values that clear every proxy option */
const CLEARED_PROXY = {
  proxyEnabled: false,
  proxyHost: null,
  proxyPort: null,
  proxyUsername: null,
  proxyPassword: null,
};

/** Proxy toggle, inputs and a clear button for the account form */
export default memo(function ProxyOptionsFields() {
  const { setValue } = useFormContext();

  const clearProxy = () => {
    for (const [name, value] of Object.entries(CLEARED_PROXY)) {
      setValue(name, value, { shouldDirty: true });
    }
  };

  return (
    <>
      <div className="flex items-center justify-between gap-2 mt-2">
        <SectionLabel className="mt-0">Proxy Options</SectionLabel>
        <button
          type="button"
          onClick={clearProxy}
          className={cn(
            "flex items-center gap-1 shrink-0",
            "text-red-500 hover:text-red-700",
          )}
        >
          <HiXMark className="size-4" />
          Clear Proxy
        </button>
      </div>

      {/* Enable Proxy */}
      <Controller
        name="proxyEnabled"
        render={({ field }) => (
          <LabelToggle
            onChange={(ev) => field.onChange(ev.target.checked)}
            checked={field.value}
          >
            Enable Proxy
          </LabelToggle>
        )}
      />

      {PROXY_FIELD_ROWS.map((row) => (
        <div
          key={row[0].name}
          className="grid grid-cols-[repeat(auto-fit,minmax(8rem,1fr))] gap-2"
        >
          {row.map((field) => (
            <FormInputField key={field.name} {...field} />
          ))}
        </div>
      ))}
    </>
  );
});
