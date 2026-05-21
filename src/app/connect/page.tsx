import Link from "next/link";
import { ConnectWalletButton } from "@/components/ConnectWalletButton";
import { shortenAddress } from "@/lib/format";

// A few deterministic sample addresses to preview different trader personas.
const SAMPLES = [
  "0x1234567890abcdef1234567890abcdef12345678",
  "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
  "0x0000000000000000000000000000000000000bad",
];

export default function ConnectPage() {
  return (
    <div className="flex flex-col items-center gap-10 py-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-3xl font-bold">Connect your wallet</h1>
        <p className="max-w-md text-slate-400">
          We read your public Hyperliquid trading history to compute your
          reputation. We never request transaction signing or fund access.
        </p>
      </div>

      <ConnectWalletButton />

      <div className="w-full max-w-md">
        <div className="stat-label mb-2">Try a sample profile</div>
        <div className="flex flex-col gap-2">
          {SAMPLES.map((addr) => (
            <Link
              key={addr}
              href={`/trader/${addr}`}
              className="card flex items-center justify-between py-3 font-mono text-sm hover:border-brand/50"
            >
              <span>{shortenAddress(addr, 6)}</span>
              <span className="text-brand">view →</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
