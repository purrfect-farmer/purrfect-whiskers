import { HiOutlineChevronDown, HiOutlineHeart } from "react-icons/hi2";
import { useState } from "react";

import DonateNetworkCard from "./DonateNetworkCard";
import SectionHeader from "./SectionHeader";
import TonCoinIcon from "../assets/images/toncoin-ton-logo.svg";
import { cn } from "../lib/utils";

/** The networks that accept donations */
const donateNetworks = [
  {
    name: "TON Network",
    icon: TonCoinIcon,
    address: import.meta.env.VITE_APP_DONATE_TON_ADDRESS,
  },
];

/** A section that shows or hides the donation addresses */
export default function AppDonate() {
  /** Whether the donation addresses are shown */
  const [showDonate, setShowDonate] = useState(false);

  return (
    <div className="flex flex-col gap-2 min-w-0">
      <SectionHeader title="Support" />

      {/* Donate Toggle */}
      <button
        type="button"
        aria-expanded={showDonate}
        onClick={() => setShowDonate((prev) => !prev)}
        className={cn(
          "flex items-center gap-2 min-w-0",
          "px-3 py-2.5 rounded-xl font-bold",
          "bg-neutral-100 dark:bg-neutral-700",
          "hover:bg-pink-500 hover:text-white",
        )}
      >
        <HiOutlineHeart className="size-4 shrink-0 text-pink-500" />
        <span className="grow text-left">Donate to the developer</span>
        <HiOutlineChevronDown
          className={cn(
            "size-4 shrink-0 transition-transform",
            showDonate && "rotate-180",
          )}
        />
      </button>

      {/* Donate */}
      {showDonate ? (
        <div className="flex flex-col gap-2">
          <p className="text-center text-neutral-500 dark:text-neutral-400">
            Thank you so much for expressing your interest in making a donation.
          </p>

          {donateNetworks.map((network) => (
            <DonateNetworkCard key={network.name} network={network} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
