import type { EvaluatedAchievement } from "@/lib/achievements/engine";

const rarityRing: Record<string, string> = {
  common: "ring-slate-500/40",
  uncommon: "ring-amber-400/40",
  rare: "ring-sky-400/50",
  epic: "ring-violet-400/50",
  legendary: "ring-yellow-300/60",
};

export function BadgeCard({
  achievement,
  address,
}: {
  achievement: EvaluatedAchievement;
  address?: string;
}) {
  const { id, name, description, rarity, earned } = achievement;
  const imgSrc = `/api/badge/${id}?earned=${earned}`;
  const metadataHref = address
    ? `/api/metadata/${id}?address=${address}`
    : `/api/metadata/${id}`;

  return (
    <div
      className={`card flex flex-col gap-3 ring-1 ${rarityRing[rarity] ?? rarityRing.common} ${
        earned ? "" : "opacity-60"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt={name}
          width={64}
          height={64}
          className="h-16 w-16 rounded-lg"
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-bold text-white">{name}</h3>
          </div>
          <span className="stat-label">{rarity}</span>
        </div>
      </div>
      <p className="text-sm text-slate-400">{description}</p>
      <div className="mt-auto flex items-center justify-between pt-2">
        <span
          className={`text-xs font-semibold ${
            earned ? "text-brand" : "text-slate-500"
          }`}
        >
          {earned ? "● Unlocked" : "○ Locked"}
        </span>
        <a
          href={metadataHref}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-slate-400 underline-offset-2 hover:text-white hover:underline"
        >
          metadata ↗
        </a>
      </div>
    </div>
  );
}
