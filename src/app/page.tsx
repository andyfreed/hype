import Link from "next/link";
import { ACHIEVEMENTS } from "@/lib/achievements/definitions";

const FEATURES = [
  {
    title: "Verifiable stats",
    body: "Reputation is computed from on-chain Hyperliquid activity — volume, PnL, win rate, drawdown — not self-reported numbers.",
  },
  {
    title: "Achievement NFTs",
    body: "Earn badges like Volume Beast, Survivor, and Diamond Hands. Each exposes ERC-721 metadata ready to mint.",
  },
  {
    title: "Public profiles",
    body: "Every trader gets a shareable profile at /trader/<address> showing their score, tier, and unlocked badges.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col gap-16">
      <section className="flex flex-col items-center gap-6 pt-8 text-center">
        <span className="rounded-full border border-brand/40 bg-brand/10 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-brand">
          Hyperliquid · MVP
        </span>
        <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight sm:text-6xl">
          Verifiable trader reputation for{" "}
          <span className="text-brand">Hyperliquid</span>
        </h1>
        <p className="max-w-2xl text-lg text-slate-400">
          Connect your wallet to turn your trading history into a portable
          reputation score and a collection of achievement NFTs that prove how
          you actually trade.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/connect" className="btn-primary">
            Connect Wallet
          </Link>
          <Link href="/trader/0x1234567890abcdef1234567890abcdef12345678" className="btn-ghost">
            See an example profile
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="card">
            <h2 className="text-lg font-bold text-white">{f.title}</h2>
            <p className="mt-2 text-sm text-slate-400">{f.body}</p>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-5">
        <h2 className="text-2xl font-bold">Badges you can earn</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {ACHIEVEMENTS.map((a) => (
            <div key={a.id} className="card flex items-center gap-3">
              <span className="text-3xl">{a.emoji}</span>
              <div>
                <div className="font-semibold text-white">{a.name}</div>
                <div className="stat-label">{a.rarity}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card flex flex-col items-center gap-4 text-center">
        <h2 className="text-2xl font-bold">Ready to mint your reputation?</h2>
        <p className="max-w-xl text-slate-400">
          The MVP runs on deterministic mock data so you can explore instantly.
          Wire up the Hyperliquid API to go live.
        </p>
        <Link href="/connect" className="btn-primary">
          Get started
        </Link>
      </section>
    </div>
  );
}
