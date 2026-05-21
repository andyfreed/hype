import { prisma } from "./prisma";
import { ACHIEVEMENTS } from "./achievements/definitions";
import type { TraderProfile } from "./profile";

/**
 * Persist a computed profile to PostgreSQL: upsert the user + wallet, store a
 * TradeSnapshot, the ReputationScore, and any earned UserAchievements.
 *
 * This is the only module that touches the database. The read/compute path
 * (getTraderProfile) deliberately avoids the DB so the app runs without one.
 * Requires DATABASE_URL to be configured and the schema to be migrated.
 */
export async function persistTraderProfile(profile: TraderProfile) {
  const { address, stats, reputation, achievements } = profile;

  // Ensure the badge catalog exists (idempotent).
  await prisma.achievement.createMany({
    data: ACHIEVEMENTS.map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      rarity: a.rarity,
    })),
    skipDuplicates: true,
  });

  // Upsert wallet + owning user.
  const existing = await prisma.wallet.findUnique({ where: { address } });
  const wallet = existing
    ? existing
    : await prisma.wallet.create({
        data: {
          address,
          isPrimary: true,
          user: { create: {} },
        },
      });

  const userId = wallet.userId;

  await prisma.tradeSnapshot.create({
    data: {
      address,
      userId,
      totalVolume: stats.totalVolume,
      realizedPnl: stats.realizedPnl,
      winRate: stats.winRate,
      tradeCount: stats.tradeCount,
      liquidationCount: stats.liquidationCount,
      fundingPaid: stats.fundingPaid,
      maxDrawdown: stats.maxDrawdown,
      longestHoldMs: stats.longestHoldMs,
      raw: stats as unknown as object,
    },
  });

  await prisma.reputationScore.create({
    data: {
      address,
      userId,
      score: reputation.score,
      tier: reputation.tier,
      breakdown: reputation.breakdown as unknown as object,
    },
  });

  const earned = achievements.filter((a) => a.earned);
  for (const a of earned) {
    await prisma.userAchievement.upsert({
      where: { userId_achievementId: { userId, achievementId: a.id } },
      create: {
        userId,
        achievementId: a.id,
        context: { attributes: a.attributes } as unknown as object,
      },
      update: {},
    });
  }

  return {
    userId,
    walletId: wallet.id,
    earnedCount: earned.length,
  };
}
