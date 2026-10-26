import { HiOutlineChevronDown, HiOutlineHeart } from "react-icons/hi2";
import { useState } from "react";

import AppSystemInfoButton from "./AppSystemInfoButton";
import DonateNetworkCard from "./DonateNetworkCard";
import TonCoinIcon from "../assets/images/toncoin-ton-logo.svg";
import { cn } from "../lib/utils";

/** The networks that accept donations */
const DONATE_NETWORKS = [
  {
    name: "TON Network",
    icon: TonCoinIcon,
    address: import.meta.env.VITE_APP_DONATE_TON_ADDRESS,
  },
];

/** The donate and copy-system-info buttons, with the donation addresses */
export default function AppActions({ currentVersion }) {
  /** Whether the donation addresses are shown */
  const [showDonate, setShowDonate] = useState(false);

  return (
    <div className="flex flex-col gap-2 min-w-0">
      <div className="grid grid-cols-2 gap-2">
        {/* Donate Toggle */}
        <button
          type="button"
          aria-expanded={showDonate}
          onClick={() => setShowDonate((prev) => !prev)}
          className={cn(
            "flex items-center justify-center gap-2 min-w-0",
            "px-3 py-2.5 rounded-xl font-bold",
            "bg-neutral-100 dark:bg-neutral-700",
            "hover:bg-pink-500 hover:text-white",
          )}
        >
          <HiOutlineHeart className="size-4 shrink-0 text-pink-500" />
          <span className="truncate">Donate</span>
          <HiOutlineChevronDown
            className={cn(
              "size-4 shrink-0 transition-transform",
              showDonate && "rotate-180",
            )}
          />
        </button>

        <AppSystemInfoButton currentVersion={currentVersion} />
      </div>

      {/* Donation Addresses */}
      {showDonate ? (
        <div className="flex flex-col gap-2">
          <p className="text-center text-neutral-500 dark:text-neutral-400">
            Thank you so much for expressing your interest in making a donation.
          </p>

          {DONATE_NETWORKS.map((network) => (
            <DonateNetworkCard key={network.name} network={network} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
