import type { TraderRawData } from "./hyperliquid/types";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Aggregated, engine-ready trader statistics derived from raw HL data. */
export interface TraderStats {
  address: string;
  totalVolume: number;
  realizedPnl: number;
  /** 0..1 fraction of closed trades that were profitable. */
  winRate: number;
  tradeCount: number;
  /** Number of closed trades counted toward win rate. */
  closedTradeCount: number;
  liquidationCount: number;
  /** Absolute USDC of funding paid out. */
  fundingPaid: number;
  /** Absolute USDC of funding received. */
  fundingReceived: number;
  /** Peak-to-trough decline of cumulative realized PnL, in USD. */
  maxDrawdown: number;
  /** Longest single-position holding window, in milliseconds. */
  longestHoldMs: number;
  firstTradeTime: number | null;
  lastTradeTime: number | null;
  accountAgeDays: number;
  accountValue: number;
  openPositionCount: number;
  source: "mock" | "live";
}

function num(v: string | null | undefined): number {
  if (v == null) return 0;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Compute the longest time any single coin position was held open.
 *
 * We replay fills per coin, tracking the signed net size. A holding window
 * starts when the position leaves zero and ends when it returns to (≈) zero.
 * Positions still open at the end are measured up to `now`.
 */
function computeLongestHold(raw: TraderRawData): number {
  const now = raw.accountState.time || Date.now();
  const byCoin = new Map<string, { time: number; signed: number }[]>();

  for (const f of raw.fills) {
    const signed = (f.side === "B" ? 1 : -1) * num(f.sz);
    const arr = byCoin.get(f.coin) ?? [];
    arr.push({ time: f.time, signed });
    byCoin.set(f.coin, arr);
  }

  let longest = 0;
  for (const events of byCoin.values()) {
    events.sort((a, b) => a.time - b.time);
    let position = 0;
    let openedAt: number | null = null;
    const EPS = 1e-6;

    for (const e of events) {
      const wasFlat = Math.abs(position) < EPS;
      position += e.signed;
      const isFlat = Math.abs(position) < EPS;

      if (wasFlat && !isFlat) {
        openedAt = e.time;
      } else if (!wasFlat && isFlat && openedAt != null) {
        longest = Math.max(longest, e.time - openedAt);
        openedAt = null;
      }
    }

    if (openedAt != null) {
      longest = Math.max(longest, now - openedAt);
    }
  }

  return longest;
}

export function computeTraderStats(raw: TraderRawData): TraderStats {
  const { fills, accountState, funding } = raw;

  let totalVolume = 0;
  let realizedPnl = 0;
  let wins = 0;
  let closedTradeCount = 0;
  let liquidationCount = 0;
  let firstTradeTime: number | null = null;
  let lastTradeTime: number | null = null;

  // Cumulative-PnL curve for max drawdown.
  let cumulative = 0;
  let peak = 0;
  let maxDrawdown = 0;

  const sorted = [...fills].sort((a, b) => a.time - b.time);

  for (const f of sorted) {
    const notional = num(f.px) * num(f.sz);
    totalVolume += notional;

    const pnl = num(f.closedPnl);
    if (f.liquidation) liquidationCount += 1;

    if (pnl !== 0 || f.dir.startsWith("Close")) {
      closedTradeCount += 1;
      if (pnl > 0) wins += 1;
    }

    realizedPnl += pnl;
    cumulative += pnl;
    peak = Math.max(peak, cumulative);
    maxDrawdown = Math.max(maxDrawdown, peak - cumulative);

    firstTradeTime = firstTradeTime == null ? f.time : Math.min(firstTradeTime, f.time);
    lastTradeTime = lastTradeTime == null ? f.time : Math.max(lastTradeTime, f.time);
  }

  let fundingPaid = 0;
  let fundingReceived = 0;
  for (const entry of funding) {
    const usdc = num(entry.usdc);
    if (usdc < 0) fundingPaid += -usdc;
    else fundingReceived += usdc;
  }

  const accountAgeDays =
    firstTradeTime != null
      ? Math.max(0, (Date.now() - firstTradeTime) / DAY_MS)
      : 0;

  return {
    address: raw.address,
    totalVolume,
    realizedPnl,
    winRate: closedTradeCount > 0 ? wins / closedTradeCount : 0,
    tradeCount: fills.length,
    closedTradeCount,
    liquidationCount,
    fundingPaid,
    fundingReceived,
    maxDrawdown,
    longestHoldMs: computeLongestHold(raw),
    firstTradeTime,
    lastTradeTime,
    accountAgeDays,
    accountValue: num(accountState.marginSummary.accountValue),
    openPositionCount: accountState.assetPositions.length,
    source: raw.source,
  };
}
