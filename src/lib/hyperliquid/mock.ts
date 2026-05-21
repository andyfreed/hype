import type {
  AccountState,
  Fill,
  FundingEntry,
  TraderRawData,
} from "./types";

// Deterministic mock data so the UI works immediately with no external calls.
// The same address always produces the same trading history, and different
// addresses produce meaningfully different personas (whale, degen, rookie...).

const COINS = ["BTC", "ETH", "SOL", "ARB", "HYPE", "DOGE"];
const DAY_MS = 24 * 60 * 60 * 1000;

/** xmur3 string hash -> 32-bit seed. */
function xmur3(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}

/** mulberry32 PRNG: deterministic 0..1 from a numeric seed. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Persona {
  trades: number;
  /** rough average notional per trade in USD */
  avgNotional: number;
  /** probability a closed trade is a winner */
  winBias: number;
  /** number of liquidation events */
  liquidations: number;
  /** account age in days */
  ageDays: number;
  /** whether the trader has a long-held open position (diamond hands) */
  longHold: boolean;
  /** net funding paid in USDC (positive number means they paid this much) */
  fundingPaid: number;
}

function pickPersona(rand: () => number): Persona {
  const roll = rand();
  if (roll > 0.85) {
    // Whale
    return {
      trades: 200 + Math.floor(rand() * 400),
      avgNotional: 80_000 + rand() * 200_000,
      winBias: 0.55,
      liquidations: 0,
      ageDays: 300 + Math.floor(rand() * 400),
      longHold: true,
      fundingPaid: 5_000 + rand() * 20_000,
    };
  }
  if (roll > 0.6) {
    // Degen
    return {
      trades: 120 + Math.floor(rand() * 250),
      avgNotional: 3_000 + rand() * 12_000,
      winBias: 0.46,
      liquidations: 1 + Math.floor(rand() * 4),
      ageDays: 90 + Math.floor(rand() * 200),
      longHold: rand() > 0.7,
      fundingPaid: 200 + rand() * 1_500,
    };
  }
  if (roll > 0.3) {
    // Steady
    return {
      trades: 30 + Math.floor(rand() * 80),
      avgNotional: 1_000 + rand() * 4_000,
      winBias: 0.52,
      liquidations: 0,
      ageDays: 60 + Math.floor(rand() * 150),
      longHold: rand() > 0.5,
      fundingPaid: 50 + rand() * 300,
    };
  }
  // Rookie
  return {
    trades: 3 + Math.floor(rand() * 15),
    avgNotional: 200 + rand() * 1_200,
    winBias: 0.48,
    liquidations: rand() > 0.8 ? 1 : 0,
    ageDays: 2 + Math.floor(rand() * 30),
    longHold: false,
    fundingPaid: rand() * 40,
  };
}

export function generateMockData(address: string): TraderRawData {
  const seed = xmur3(address.toLowerCase());
  const rand = mulberry32(seed);
  const persona = pickPersona(rand);

  const now = Date.now();
  const start = now - persona.ageDays * DAY_MS;
  const fills: Fill[] = [];

  let liquidationsToPlace = persona.liquidations;

  for (let i = 0; i < persona.trades; i++) {
    const coin = COINS[Math.floor(rand() * COINS.length)];
    const time = Math.floor(start + rand() * (now - start));
    const notional = persona.avgNotional * (0.4 + rand() * 1.6);
    const px = 10 + rand() * 4000;
    const sz = notional / px;
    const isClose = i % 2 === 1; // alternate open/close for paired trades
    const isLong = rand() > 0.5;
    const side: Fill["side"] = isClose ? (isLong ? "A" : "B") : isLong ? "B" : "A";

    let closedPnl = 0;
    if (isClose) {
      const win = rand() < persona.winBias;
      const magnitude = notional * (0.005 + rand() * 0.08);
      closedPnl = win ? magnitude : -magnitude;
    }

    // Sprinkle liquidation events across the most recent fills.
    let liquidation = false;
    if (liquidationsToPlace > 0 && isClose && rand() > 0.7) {
      liquidation = true;
      closedPnl = -Math.abs(notional * (0.2 + rand() * 0.5));
      liquidationsToPlace -= 1;
    }

    const dir = isClose
      ? isLong
        ? "Close Long"
        : "Close Short"
      : isLong
        ? "Open Long"
        : "Open Short";

    fills.push({
      coin,
      px: px.toFixed(2),
      sz: sz.toFixed(4),
      side,
      time,
      dir,
      closedPnl: closedPnl.toFixed(2),
      fee: (notional * 0.00035).toFixed(4),
      hash: `0xmock${seed.toString(16)}${i.toString(16)}`,
      oid: 100000 + i,
      crossed: true,
      liquidation,
    });
  }

  fills.sort((a, b) => a.time - b.time);

  // Open positions. Give long-hold personas a position opened > 7 days ago so
  // the "Diamond Hands" badge can trigger via the open-position heuristic.
  const assetPositions: AccountState["assetPositions"] = [];
  if (persona.longHold) {
    const coin = COINS[Math.floor(rand() * COINS.length)];
    const entryPx = 10 + rand() * 4000;
    const szi = (persona.avgNotional / entryPx) * (rand() > 0.5 ? 1 : -1);
    assetPositions.push({
      coin,
      szi: szi.toFixed(4),
      entryPx: entryPx.toFixed(2),
      positionValue: Math.abs(szi * entryPx).toFixed(2),
      unrealizedPnl: (persona.avgNotional * (rand() - 0.5) * 0.2).toFixed(2),
      leverage: { type: "cross", value: 1 + Math.floor(rand() * 10) },
    });
  }

  const accountValue =
    persona.avgNotional * (1 + rand() * 5) + Math.max(0, rand() * 50_000);

  const accountState: AccountState = {
    marginSummary: {
      accountValue: accountValue.toFixed(2),
      totalNtlPos: (assetPositions[0]?.positionValue ?? "0"),
      totalRawUsd: accountValue.toFixed(2),
      totalMarginUsed: (accountValue * 0.3).toFixed(2),
    },
    assetPositions,
    time: now,
  };

  // Funding: emit a handful of mostly-paid entries summing to ~persona.fundingPaid.
  const funding: FundingEntry[] = [];
  const fundingEvents = 6;
  for (let i = 0; i < fundingEvents; i++) {
    const coin = COINS[Math.floor(rand() * COINS.length)];
    const usdc = -(persona.fundingPaid / fundingEvents) * (0.5 + rand());
    funding.push({
      time: Math.floor(start + rand() * (now - start)),
      coin,
      usdc: usdc.toFixed(4),
      fundingRate: (0.00001 + rand() * 0.0001).toFixed(8),
    });
  }

  // Encode the long-hold intent so stats can detect diamond hands even when the
  // mock fills don't perfectly pair up.
  if (persona.longHold && assetPositions.length > 0) {
    // Backdate the matching open fill so the holding window exceeds 7 days.
    const coin = assetPositions[0].coin;
    fills.unshift({
      coin,
      px: assetPositions[0].entryPx ?? "100",
      sz: Math.abs(parseFloat(assetPositions[0].szi)).toFixed(4),
      side: parseFloat(assetPositions[0].szi) > 0 ? "B" : "A",
      time: now - (8 + Math.floor(rand() * 60)) * DAY_MS,
      dir: parseFloat(assetPositions[0].szi) > 0 ? "Open Long" : "Open Short",
      closedPnl: "0.00",
      fee: "0.0000",
      hash: `0xmockhold${seed.toString(16)}`,
      oid: 99999,
      crossed: true,
    });
    fills.sort((a, b) => a.time - b.time);
  }

  return { address, fills, accountState, funding, source: "mock" };
}
