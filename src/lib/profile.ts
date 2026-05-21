import { hyperliquid } from "./hyperliquid/client";
import { computeTraderStats, type TraderStats } from "./stats";
import {
  computeReputation,
  type ReputationResult,
} from "./reputation/score";
import {
  evaluateAchievements,
  type EvaluatedAchievement,
} from "./achievements/engine";

export interface TraderProfile {
  address: string;
  stats: TraderStats;
  reputation: ReputationResult;
  achievements: EvaluatedAchievement[];
  fetchedAt: string;
}

/** Loose EVM-style address validation. Hyperliquid uses 0x-prefixed addresses. */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function normalizeAddress(address: string): string {
  return address.trim().toLowerCase();
}

/**
 * Build a complete trader profile: fetch raw Hyperliquid data, compute stats,
 * score reputation, and evaluate achievements. Pure read path — no database
 * required, so this works in mock mode out of the box.
 */
export async function getTraderProfile(address: string): Promise<TraderProfile> {
  const normalized = normalizeAddress(address);
  const raw = await hyperliquid.getTraderRawData(normalized);
  const stats = computeTraderStats(raw);
  const reputation = computeReputation(stats);
  const achievements = evaluateAchievements(stats);

  return {
    address: normalized,
    stats,
    reputation,
    achievements,
    fetchedAt: new Date().toISOString(),
  };
}
