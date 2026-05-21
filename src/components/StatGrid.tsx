import type { TraderStats } from "@/lib/stats";
import {
  formatDuration,
  formatNumber,
  formatPercent,
  formatUsd,
} from "@/lib/format";

function Stat({ label, value, tone }: { label: string; value: string; tone?: "good" | "bad" }) {
  const toneClass =
    tone === "good" ? "text-brand" : tone === "bad" ? "text-red-400" : "text-white";
  return (
    <div className="card">
      <div className="stat-label">{label}</div>
      <div className={`stat-value ${toneClass}`}>{value}</div>
    </div>
  );
}

export function StatGrid({ stats }: { stats: TraderStats }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      <Stat label="Total Volume" value={formatUsd(stats.totalVolume)} />
      <Stat
        label="Realized PnL"
        value={formatUsd(stats.realizedPnl)}
        tone={stats.realizedPnl >= 0 ? "good" : "bad"}
      />
      <Stat label="Win Rate" value={formatPercent(stats.winRate)} />
      <Stat label="Trades" value={formatNumber(stats.tradeCount)} />
      <Stat
        label="Liquidations"
        value={formatNumber(stats.liquidationCount)}
        tone={stats.liquidationCount > 0 ? "bad" : "good"}
      />
      <Stat label="Funding Paid" value={formatUsd(stats.fundingPaid)} />
      <Stat label="Max Drawdown" value={formatUsd(stats.maxDrawdown)} />
      <Stat label="Longest Hold" value={formatDuration(stats.longestHoldMs)} />
      <Stat label="Account Value" value={formatUsd(stats.accountValue)} />
      <Stat label="Open Positions" value={formatNumber(stats.openPositionCount)} />
      <Stat
        label="Account Age"
        value={`${Math.round(stats.accountAgeDays)}d`}
      />
      <Stat
        label="Data Source"
        value={stats.source === "mock" ? "Mock" : "Live"}
      />
    </div>
  );
}
