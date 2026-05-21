import { PrismaClient } from "@prisma/client";
import { ACHIEVEMENTS } from "../src/lib/achievements/definitions";

const prisma = new PrismaClient();

// Sync the achievement catalog (source of truth lives in code) into the DB.
async function main() {
  for (const a of ACHIEVEMENTS) {
    await prisma.achievement.upsert({
      where: { id: a.id },
      create: {
        id: a.id,
        name: a.name,
        description: a.description,
        rarity: a.rarity,
      },
      update: {
        name: a.name,
        description: a.description,
        rarity: a.rarity,
      },
    });
  }
  console.log(`Seeded ${ACHIEVEMENTS.length} achievements.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
