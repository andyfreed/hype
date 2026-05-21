import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCard } from "@/components/BadgeCard";
import { ReputationScoreCard } from "@/components/ReputationScoreCard";
import { StatGrid } from "@/components/StatGrid";
import { shortenAddress } from "@/lib/format";
import { getTraderProfile, isValidAddress } from "@/lib/profile";

export async function generateMetadata({
  params,
}: {
  params: { address: string };
}): Promise<Metadata> {
  return {
    title: `${shortenAddress(params.address)} · Trader Reputation · hype`,
  };
}

export default async function TraderProfilePage({
  params,
}: {
  params: { address: string };
}) {
  const { address } = params;

  if (!isValidAddress(address)) {
    return (
      <div className="card flex flex-col items-center gap-4 py-12 text-center">
        <h1 className="text-2xl font-bold">Invalid address</h1>
        <p className="text-slate-400">
          <span className="font-mono">{address}</span> is not a valid
          0x-prefixed address.
        </p>
        <Link href="/connect" className="btn-primary">
          Connect a wallet
        </Link>
      </div>
    );
  }

  const profile = await getTraderProfile(address);
  const earned = profile.achievements.filter((a) => a.earned);
  const locked = profile.achievements.filter((a) => !a.earned);
  const ordered = [...earned, ...locked];

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="stat-label">Trader Profile</div>
          <h1 className="font-mono text-2xl font-bold text-white">
            {shortenAddress(address, 6)}
          </h1>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded-full border border-white/15 px-3 py-1 text-slate-300">
            {earned.length} / {profile.achievements.length} badges
          </span>
          <span className="rounded-full border border-brand/40 bg-brand/10 px-3 py-1 font-semibold text-brand">
            {profile.stats.source === "mock" ? "Mock data" : "Live data"}
          </span>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <ReputationScoreCard reputation={profile.reputation} />
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-bold">Trading stats</h2>
          <StatGrid stats={profile.stats} />
        </div>
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Achievements</h2>
          <span className="text-sm text-slate-500">
            {earned.length} unlocked
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ordered.map((a) => (
            <BadgeCard key={a.id} achievement={a} address={address} />
          ))}
        </div>
      </section>
    </div>
  );
}
