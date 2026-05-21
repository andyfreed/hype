import type { TraderStats } from "../stats";
import {
  ACHIEVEMENTS,
  type AchievementDefinition,
  type MetadataAttribute,
  type Rarity,
} from "./definitions";

export interface EvaluatedAchievement {
  id: string;
  name: string;
  description: string;
  rarity: Rarity;
  emoji: string;
  color: string;
  earned: boolean;
  attributes: MetadataAttribute[];
}

function evaluateOne(
  def: AchievementDefinition,
  stats: TraderStats,
): EvaluatedAchievement {
  const earned = def.criteria(stats);
  return {
    id: def.id,
    name: def.name,
    description: def.description,
    rarity: def.rarity,
    emoji: def.emoji,
    color: def.color,
    earned,
    attributes: earned && def.attributes ? def.attributes(stats) : [],
  };
}

/**
 * Evaluate every achievement against a trader's stats. Returns the full
 * catalog with an `earned` flag so the UI can show locked + unlocked badges.
 */
export function evaluateAchievements(
  stats: TraderStats,
): EvaluatedAchievement[] {
  return ACHIEVEMENTS.map((def) => evaluateOne(def, stats));
}

/** Just the earned achievements (e.g. for persistence). */
export function earnedAchievements(stats: TraderStats): EvaluatedAchievement[] {
  return evaluateAchievements(stats).filter((a) => a.earned);
}
