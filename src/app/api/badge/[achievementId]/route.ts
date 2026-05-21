import { getAchievement } from "@/lib/achievements/definitions";
import { renderBadgeSvg } from "@/lib/badge-svg";

// GET /api/badge/[achievementId]?earned=false
// Returns a self-contained SVG used as the NFT image.
export async function GET(
  request: Request,
  { params }: { params: { achievementId: string } },
) {
  const def = getAchievement(params.achievementId);
  if (!def) {
    return new Response("Unknown achievement", { status: 404 });
  }

  const earned = new URL(request.url).searchParams.get("earned") !== "false";
  const svg = renderBadgeSvg(def, { earned });

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
