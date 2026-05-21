import { getTraderProfile, isValidAddress } from "@/lib/profile";

// GET /api/trader/[address]
// Returns the computed trader profile (stats + reputation + achievements).
// Pure read path: no database required.
export async function GET(
  _request: Request,
  { params }: { params: { address: string } },
) {
  if (!isValidAddress(params.address)) {
    return Response.json(
      { error: "Invalid address. Expected a 0x-prefixed 40-hex-char address." },
      { status: 400 },
    );
  }

  try {
    const profile = await getTraderProfile(params.address);
    return Response.json(profile);
  } catch (err) {
    return Response.json(
      { error: "Failed to load trader profile", detail: String(err) },
      { status: 502 },
    );
  }
}

// POST /api/trader/[address]
// Computes the profile and persists it (user, wallet, snapshot, score,
// achievements). Requires DATABASE_URL + a migrated schema.
export async function POST(
  _request: Request,
  { params }: { params: { address: string } },
) {
  if (!isValidAddress(params.address)) {
    return Response.json({ error: "Invalid address" }, { status: 400 });
  }

  try {
    const profile = await getTraderProfile(params.address);
    // Imported lazily so the GET path never pulls in Prisma.
    const { persistTraderProfile } = await import("@/lib/persist");
    const result = await persistTraderProfile(profile);
    return Response.json({ ...result, profile });
  } catch (err) {
    return Response.json(
      {
        error: "Failed to persist trader profile",
        hint: "Is DATABASE_URL set and the schema migrated? (npm run db:push)",
        detail: String(err),
      },
      { status: 500 },
    );
  }
}
