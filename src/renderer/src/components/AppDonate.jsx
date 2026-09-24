import { HiOutlineCurrencyDollar } from "react-icons/hi2";
import { useState } from "react";

import DonateNetworkCard from "./DonateNetworkCard";
import TonCoinIcon from "../assets/images/toncoin-ton-logo.svg";
import { cn } from "../lib/utils";

const donateNetworks = [
  {
    name: "TON Network",
    icon: TonCoinIcon,
    address: import.meta.env.VITE_APP_DONATE_TON_ADDRESS,
  },
];

export default function AppDonate() {
  const [showDonate, setShowDonate] = useState(false);

  return (
    <>
      {/* Donate Toggle */}
      <button
        onClick={() => setShowDonate((prev) => !prev)}
        className={cn(
          "self-center text-xs",
          "px-4 py-2 rounded-full",
          "border border-blue-500 text-blue-500",
          "flex items-center justify-center gap-2",
        )}
      >
        <HiOutlineCurrencyDollar className="size-4" />
        {showDonate ? "Hide Donate" : "Donate"}
      </button>

      {/* Donate */}
      {showDonate ? (
        <div className="flex flex-col gap-2">
          <p className="text-center text-xs text-neutral-500 dark:text-neutral-400 mx-auto max-w-xs">
            Thank you so much for expressing your interest in making a donation.
          </p>

          {donateNetworks.map((network) => (
            <DonateNetworkCard key={network.name} network={network} />
          ))}
        </div>
      ) : null}
    </>
  );
}
