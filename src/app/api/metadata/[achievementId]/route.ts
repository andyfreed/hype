import { getAchievement } from "@/lib/achievements/definitions";
import { getBaseUrl } from "@/lib/base-url";
import { getTraderProfile, isValidAddress } from "@/lib/profile";
import type { MetadataAttribute } from "@/lib/achievements/definitions";

// GET /api/metadata/[achievementId]?address=0x...
//
// Returns ERC-721 compatible metadata for a badge. The `address` query is
// optional: when provided, the response is personalized (earned status + stat
// attributes for that trader); otherwise it describes the badge generically.
export async function GET(
  request: Request,
  { params }: { params: { achievementId: string } },
) {
  const def = getAchievement(params.achievementId);
  if (!def) {
    return Response.json({ error: "Unknown achievement" }, { status: 404 });
  }

  const baseUrl = getBaseUrl(request);
  const address = new URL(request.url).searchParams.get("address");

  const attributes: MetadataAttribute[] = [
    { trait_type: "Badge", value: def.name },
    { trait_type: "Rarity", value: def.rarity },
  ];

  let earned = true;
  let imageQuery = "";

  if (address && isValidAddress(address)) {
    const profile = await getTraderProfile(address);
    const evaluated = profile.achievements.find((a) => a.id === def.id);
    earned = evaluated?.earned ?? false;
    attributes.push({ trait_type: "Earned", value: earned ? "Yes" : "No" });
    attributes.push({ trait_type: "Trader", value: address });
    if (evaluated?.attributes?.length) {
      attributes.push(...evaluated.attributes);
    }
    imageQuery = `?earned=${earned}`;
  }

  return Response.json(
    {
      name: def.name,
      description: def.description,
      image: `${baseUrl}/api/badge/${def.id}${imageQuery}`,
      external_url: address ? `${baseUrl}/trader/${address}` : `${baseUrl}`,
      attributes,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=300",
      },
    },
  );
}
