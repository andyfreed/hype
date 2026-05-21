import type { TraderStats } from "../stats";

export interface ReputationBreakdown {
  volume: number;
  pnl: number;
  winRate: number;
  activity: number;
  drawdownPenalty: number;
  liquidationPenalty: number;
}

export type ReputationTier =
  | "Bronze"
  | "Silver"
  | "Gold"
  | "Platinum"
  | "Diamond";

export interface ReputationResult {
  score: number; // 0..1000
  tier: ReputationTier;
  breakdown: ReputationBreakdown;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function tierFor(score: number): ReputationTier {
  if (score >= 800) return "Diamond";
  if (score >= 600) return "Platinum";
  if (score >= 400) return "Gold";
  if (score >= 200) return "Silver";
  return "Bronze";
}

/**
 * Reputation score on a 0–1000 scale. The weights are intentionally simple and
 * transparent for the MVP; tune them as real data informs what "good" looks
 * like. Components:
 *   volume      (0..250)  log-scaled trading volume
 *   pnl         (-250..250) smoothed realized PnL (tanh)
 *   winRate     (0..200)  fraction of profitable closed trades
 *   activity    (0..150)  trade count + account age
 *   drawdown    (-150..0) penalty proportional to peak-to-trough decline
 *   liquidation (-200..0) penalty per liquidation event
 */
export function computeReputation(stats: TraderStats): ReputationResult {
  const volume = clamp(Math.log10(Math.max(stats.totalVolume, 1)) * 35, 0, 250);

  const pnl = clamp(250 * Math.tanh(stats.realizedPnl / 100_000), -250, 250);

  const winRate = clamp(stats.winRate * 200, 0, 200);

  const activity = clamp(
    Math.log10(stats.tradeCount + 1) * 45 + Math.min(75, stats.accountAgeDays / 2),
    0,
    150,
  );

  // Relative drawdown: scaled against realized PnL magnitude so a small account
  // is not over-penalized for small absolute swings.
  const drawdownBase = Math.abs(stats.realizedPnl) + stats.maxDrawdown + 1;
  const drawdownPenalty = -clamp(
    (stats.maxDrawdown / drawdownBase) * 150,
    0,
    150,
  );

  const liquidationPenalty = -clamp(stats.liquidationCount * 60, 0, 200);

  const breakdown: ReputationBreakdown = {
    volume: Math.round(volume),
    pnl: Math.round(pnl),
    winRate: Math.round(winRate),
    activity: Math.round(activity),
    drawdownPenalty: Math.round(drawdownPenalty),
    liquidationPenalty: Math.round(liquidationPenalty),
  };

  const raw =
    breakdown.volume +
    breakdown.pnl +
    breakdown.winRate +
    breakdown.activity +
    breakdown.drawdownPenalty +
    breakdown.liquidationPenalty;

  const score = clamp(Math.round(raw), 0, 1000);

  return { score, tier: tierFor(score), breakdown };
}
