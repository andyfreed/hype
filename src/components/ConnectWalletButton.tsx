"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { isValidAddress } from "@/lib/profile";

// Lightweight EIP-1193 wallet connect. Reads the injected provider
// (MetaMask/Rabby/etc.) and routes to the trader profile.
//
// TODO(wallet): For production, swap this for wagmi + RainbowKit / Hyperliquid's
// recommended connector to support WalletConnect, mobile, and signed
// ownership proofs (sign a nonce to verify the user controls the address).
export function ConnectWalletButton() {
  const router = useRouter();
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState("");

  async function connect() {
    setError(null);
    if (typeof window === "undefined" || !window.ethereum) {
      setError("No injected wallet found. Paste an address below to preview.");
      return;
    }
    try {
      setConnecting(true);
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];
      const address = accounts?.[0];
      if (!address) {
        setError("No account returned by wallet.");
        return;
      }
      router.push(`/trader/${address.toLowerCase()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect wallet.");
    } finally {
      setConnecting(false);
    }
  }

  function submitManual(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const addr = manual.trim().toLowerCase();
    if (!isValidAddress(addr)) {
      setError("Enter a valid 0x-prefixed address (40 hex chars).");
      return;
    }
    router.push(`/trader/${addr}`);
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <button
        onClick={connect}
        disabled={connecting}
        className="btn-primary w-full disabled:opacity-60"
      >
        {connecting ? "Connecting…" : "Connect Wallet"}
      </button>

      <div className="flex items-center gap-3 text-xs text-slate-500">
        <span className="h-px flex-1 bg-white/10" />
        or preview any address
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <form onSubmit={submitManual} className="flex flex-col gap-2 sm:flex-row">
        <input
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          placeholder="0x0000…0000"
          className="flex-1 rounded-xl border border-white/15 bg-ink-700 px-4 py-3 font-mono text-sm text-white outline-none focus:border-brand"
        />
        <button type="submit" className="btn-ghost">
          View Profile
        </button>
      </form>

      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
