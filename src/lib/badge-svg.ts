import type { AchievementDefinition } from "./achievements/definitions";

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<": return "&lt;";
      case ">": return "&gt;";
      case "&": return "&amp;";
      case "'": return "&apos;";
      default: return "&quot;";
    }
  });
}

/**
 * Generate a self-contained SVG badge for an achievement. Used as the NFT
 * `image` so the project ships with real artwork and no external asset host.
 * Swap for static/IPFS art when productionizing.
 */
export function renderBadgeSvg(
  def: AchievementDefinition,
  opts?: { earned?: boolean },
): string {
  const earned = opts?.earned ?? true;
  const accent = def.color;
  const bg = "#0a0f14";
  const ring = earned ? accent : "#3a444f";
  const textColor = earned ? "#eafef8" : "#7a8694";
  const opacity = earned ? "1" : "0.55";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" role="img" aria-label="${escapeXml(def.name)}">
  <defs>
    <radialGradient id="g" cx="50%" cy="38%" r="70%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.35"/>
      <stop offset="60%" stop-color="${bg}" stop-opacity="1"/>
      <stop offset="100%" stop-color="${bg}" stop-opacity="1"/>
    </radialGradient>
  </defs>
  <rect width="512" height="512" fill="${bg}"/>
  <rect width="512" height="512" fill="url(#g)"/>
  <g opacity="${opacity}">
    <circle cx="256" cy="210" r="120" fill="none" stroke="${ring}" stroke-width="6"/>
    <text x="256" y="210" font-size="120" text-anchor="middle" dominant-baseline="central">${escapeXml(def.emoji)}</text>
    <text x="256" y="385" font-family="ui-sans-serif, system-ui, sans-serif" font-size="40" font-weight="700" fill="${textColor}" text-anchor="middle">${escapeXml(def.name)}</text>
    <text x="256" y="430" font-family="ui-monospace, monospace" font-size="22" fill="${accent}" text-anchor="middle" letter-spacing="2">${escapeXml(def.rarity.toUpperCase())}</text>
    ${earned ? "" : `<text x="256" y="470" font-family="ui-monospace, monospace" font-size="20" fill="#7a8694" text-anchor="middle">LOCKED</text>`}
  </g>
</svg>`;
}
