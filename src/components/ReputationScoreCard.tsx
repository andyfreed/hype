import type { ReputationResult } from "@/lib/reputation/score";

const tierColor: Record<string, string> = {
  Bronze: "#cd7f32",
  Silver: "#c0c0c0",
  Gold: "#f5c542",
  Platinum: "#9fe7ff",
  Diamond: "#4afac8",
};

const breakdownLabels: Record<string, string> = {
  volume: "Volume",
  pnl: "PnL",
  winRate: "Win Rate",
  activity: "Activity",
  drawdownPenalty: "Drawdown",
  liquidationPenalty: "Liquidations",
};

export function ReputationScoreCard({
  reputation,
}: {
  reputation: ReputationResult;
}) {
  const { score, tier, breakdown } = reputation;
  const color = tierColor[tier] ?? "#4afac8";
  const pct = Math.min(100, (score / 1000) * 100);

  return (
    <div className="card">
      <div className="flex items-end justify-between">
        <div>
          <div className="stat-label">Reputation Score</div>
          <div className="mt-1 text-5xl font-black tracking-tight text-white">
            {score}
            <span className="text-2xl font-semibold text-slate-500">/1000</span>
          </div>
        </div>
        <span
          className="rounded-full px-3 py-1 text-sm font-bold"
          style={{ color, backgroundColor: `${color}1a`, border: `1px solid ${color}55` }}
        >
          {tier}
        </span>
      </div>

      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>

      <div className="mt-5 space-y-2">
        {Object.entries(breakdown).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between text-sm">
            <span className="text-slate-400">{breakdownLabels[key] ?? key}</span>
            <span
              className={`font-mono font-semibold ${
                value < 0 ? "text-red-400" : "text-slate-200"
              }`}
            >
              {value > 0 ? "+" : ""}
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
