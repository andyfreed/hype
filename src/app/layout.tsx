import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hype — Verifiable Trader Reputation for Hyperliquid",
  description:
    "Connect your wallet to turn your Hyperliquid trading history into a verifiable reputation score and achievement NFTs.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header className="sticky top-0 z-10 border-b border-white/10 bg-ink-900/80 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
            <Link href="/" className="flex items-center gap-2 font-bold">
              <span className="text-xl">⚡</span>
              <span className="text-lg tracking-tight">
                hype<span className="text-brand">.</span>
              </span>
            </Link>
            <nav className="flex items-center gap-3 text-sm">
              <Link href="/connect" className="btn-ghost px-4 py-2">
                Connect Wallet
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-10">{children}</main>
        <footer className="mx-auto max-w-5xl px-4 py-10 text-center text-xs text-slate-500">
          MVP demo · trading data is mocked until a Hyperliquid API key is wired
          up · not financial advice
        </footer>
      </body>
    </html>
  );
}
