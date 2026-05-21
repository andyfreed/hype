import type { TraderStats } from "../stats";

export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export interface MetadataAttribute {
  trait_type: string;
  value: string | number;
}

export interface AchievementDefinition {
  /** Stable slug; also used as the Achievement primary key and metadata id. */
  id: string;
  name: string;
  description: string;
  rarity: Rarity;
  /** Emoji rendered into the generated SVG badge. */
  emoji: string;
  /** Badge background color. */
  color: string;
  /** Returns true when the trader has earned this badge. */
  criteria: (stats: TraderStats) => boolean;
  /** Extra ERC-721 attributes derived from the trader's stats. */
  attributes?: (stats: TraderStats) => MetadataAttribute[];
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/** Threshold (USDC) above which paid funding is considered "significant". */
export const FUNDING_DONOR_THRESHOLD = 100;

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: "early-trader",
    name: "Early Trader",
    description: "Connected a wallet and joined the Hyperliquid reputation network.",
    rarity: "common",
    emoji: "🌱",
    color: "#1fe0a8",
    // Awarded to anyone who connects; a profile lookup implies a connection.
    criteria: () => true,
  },
  {
    id: "volume-rookie",
    name: "Volume Rookie",
    description: "Traded more than $10,000 in total notional volume.",
    rarity: "common",
    emoji: "📈",
    color: "#4ad6fa",
    criteria: (s) => s.totalVolume >= 10_000,
    attributes: (s) => [
      { trait_type: "Total Volume (USD)", value: Math.round(s.totalVolume) },
    ],
  },
  {
    id: "volume-beast",
    name: "Volume Beast",
    description: "Traded more than $1,000,000 in total notional volume.",
    rarity: "epic",
    emoji: "🐋",
    color: "#7c5cff",
    criteria: (s) => s.totalVolume >= 1_000_000,
    attributes: (s) => [
      { trait_type: "Total Volume (USD)", value: Math.round(s.totalVolume) },
    ],
  },
  {
    id: "survivor",
    name: "Survivor",
    description: "Has traded actively with zero liquidations on record.",
    rarity: "rare",
    emoji: "🛡️",
    color: "#2fb872",
    criteria: (s) => s.tradeCount > 0 && s.liquidationCount === 0,
  },
  {
    id: "funding-donor",
    name: "Funding Donor",
    description: `Paid more than $${FUNDING_DONOR_THRESHOLD} in cumulative funding to the other side.`,
    rarity: "uncommon",
    emoji: "💸",
    color: "#f5a623",
    criteria: (s) => s.fundingPaid >= FUNDING_DONOR_THRESHOLD,
    attributes: (s) => [
      { trait_type: "Funding Paid (USD)", value: Math.round(s.fundingPaid) },
    ],
  },
  {
    id: "diamond-hands",
    name: "Diamond Hands",
    description: "Held a single position open for more than 7 days.",
    rarity: "rare",
    emoji: "💎",
    color: "#4ad6fa",
    criteria: (s) => s.longestHoldMs >= SEVEN_DAYS_MS,
    attributes: (s) => [
      {
        trait_type: "Longest Hold (days)",
        value: Math.round((s.longestHoldMs / (24 * 60 * 60 * 1000)) * 10) / 10,
      },
    ],
  },
  {
    id: "liquidation-legend",
    name: "Liquidation Legend",
    description: "Got liquidated at least once and lived to trade another day.",
    rarity: "uncommon",
    emoji: "🔥",
    color: "#ff5c5c",
    criteria: (s) => s.liquidationCount >= 1,
    attributes: (s) => [
      { trait_type: "Liquidations", value: s.liquidationCount },
    ],
  },
];

export const ACHIEVEMENTS_BY_ID: Record<string, AchievementDefinition> =
  Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));

export function getAchievement(id: string): AchievementDefinition | undefined {
  return ACHIEVEMENTS_BY_ID[id];
}
