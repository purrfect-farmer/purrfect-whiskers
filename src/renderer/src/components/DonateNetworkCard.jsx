import { HiOutlineClipboard } from "react-icons/hi2";
import { QRCodeSVG } from "qrcode.react";

import Icon from "../assets/images/icon.png";
import { cn } from "../lib/utils";
import { copyText } from "../lib/proxy/utils";

export default function DonateNetworkCard({ network }) {
  return (
    <div className="flex gap-3 p-3 rounded-xl bg-neutral-100 dark:bg-neutral-700">
      {/* QR Code */}
      <QRCodeSVG
        value={network.address}
        title="Donate"
        bgColor="#ffffff"
        fgColor="#000000"
        level="M"
        size={112}
        marginSize={2}
        imageSettings={{
          src: Icon,
          height: 20,
          width: 20,
          excavate: true,
        }}
        className="shrink-0 rounded-lg"
      />

      <div className="flex flex-col min-w-0 gap-1 grow">
        <div className="flex items-center gap-2">
          <img src={network.icon} className="size-5 shrink-0" />
          <h4 className="font-bold text-sm grow">{network.name}</h4>

          {/* Copy Button */}
          <button
            title="Copy address"
            onClick={() => copyText(network.address, "Address")}
            className={cn(
              "flex items-center justify-center shrink-0",
              "size-7 rounded-full",
              "bg-neutral-200 dark:bg-neutral-600",
            )}
          >
            <HiOutlineClipboard className="size-4" />
          </button>
        </div>
        <p className="break-all text-xs font-mono text-neutral-500 dark:text-neutral-300">
          {network.address}
        </p>
      </div>
    </div>
  );
}
