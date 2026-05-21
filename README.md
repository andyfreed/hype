# hype — Verifiable Trader Reputation for Hyperliquid

An MVP that turns a trader's Hyperliquid history into a **reputation score** and
a set of **achievement NFTs**. Connect a wallet → the app fetches trading
activity → computes stats → awards badges → exposes a public profile and
ERC-721 metadata.

The app ships with **deterministic mock data** so the entire UI works
immediately with zero configuration (no database, no API key). Flip one env var
to point it at the real Hyperliquid API.

---

## Tech stack

- **Next.js (App Router)** + **TypeScript**
- **Tailwind CSS**
- **PostgreSQL + Prisma** (optional — only needed for persistence endpoints)
- Lightweight **EIP-1193 wallet connect** (no heavy deps; swap for wagmi later)
- Pluggable **Hyperliquid service layer** (mock ↔ live adapters)
- Transparent **achievement rules engine** + **reputation score**
- Dynamic **NFT metadata** + self-contained **SVG badge** generation

---

## Quick start

```bash
# 1. Install deps
npm install

# 2. Create your env file (defaults run in mock mode, no DB required)
cp .env.example .env

# 3. Run the dev server
npm run dev
```

Open <http://localhost:3000>.

Try a profile directly:
<http://localhost:3000/trader/0x1234567890abcdef1234567890abcdef12345678>

> Mock data is deterministic per address — the same address always yields the
> same trading history, and different addresses produce different personas
> (whale / degen / steady / rookie), so all badges are reachable.

### Optional: enable the database

The read path (profile pages, metadata, badges) needs **no** database. The DB
is only used by the persistence endpoint (`POST /api/trader/[address]`).

```bash
# point DATABASE_URL at a Postgres instance in .env, then:
npm run prisma:generate   # generate the Prisma client
npm run db:push           # create tables from the schema
npm run db:seed           # load the achievement catalog
```

---

## Folder structure

```
hype/
├── prisma/
│   ├── schema.prisma          # User, Wallet, TradeSnapshot, Achievement,
│   │                          #   UserAchievement, ReputationScore
│   └── seed.ts                # syncs the badge catalog into the DB
├── src/
│   ├── app/
│   │   ├── layout.tsx         # shell + nav
│   │   ├── page.tsx           # landing page
│   │   ├── connect/page.tsx   # wallet connection
│   │   ├── trader/[address]/page.tsx   # public profile
│   │   └── api/
│   │       ├── trader/[address]/route.ts     # GET compute · POST persist
│   │       ├── metadata/[achievementId]/route.ts  # ERC-721 metadata
│   │       └── badge/[achievementId]/route.ts      # SVG badge image
│   ├── components/
│   │   ├── BadgeCard.tsx
│   │   ├── ConnectWalletButton.tsx
│   │   ├── ReputationScoreCard.tsx
│   │   └── StatGrid.tsx
│   ├── lib/
│   │   ├── hyperliquid/
│   │   │   ├── client.ts      # service layer (mock ↔ live)
│   │   │   ├── mock.ts        # deterministic synthetic data
│   │   │   └── types.ts       # HL API response shapes
│   │   ├── achievements/
│   │   │   ├── definitions.ts # the 7 badges + criteria
│   │   │   └── engine.ts      # evaluation engine
│   │   ├── reputation/score.ts# 0–1000 score + tier
│   │   ├── stats.ts           # raw fills → aggregated stats
│   │   ├── profile.ts         # orchestration (no DB)
│   │   ├── persist.ts         # DB writes (the only Prisma consumer)
│   │   ├── badge-svg.ts       # SVG badge renderer
│   │   ├── format.ts          # display formatters
│   │   └── prisma.ts          # Prisma singleton
│   └── types/ethereum.d.ts    # window.ethereum typing
├── .env.example
└── README.md
```

---

## Key files

| File | What it does |
| --- | --- |
| `src/lib/hyperliquid/client.ts` | `HyperliquidClient` with `getUserFills`, `getAccountState`, `getUserFunding`, `getLiquidations`, `getTraderRawData`. Switches between mock and live via `HYPERLIQUID_USE_MOCK`. |
| `src/lib/stats.ts` | `computeTraderStats()` — volume, realized PnL, win rate, drawdown, longest hold, liquidations, funding, account age. |
| `src/lib/reputation/score.ts` | `computeReputation()` — weighted 0–1000 score + Bronze→Diamond tier with a transparent breakdown. |
| `src/lib/achievements/definitions.ts` | The 7 badges and their criteria. Single source of truth (also seeds the DB). |
| `src/app/api/metadata/[achievementId]/route.ts` | ERC-721 JSON: `name`, `description`, `image`, `attributes`. Personalizes via `?address=`. |

### The badges

| Badge | Criteria |
| --- | --- |
| 🌱 Early Trader | Connected a wallet (always awarded on lookup) |
| 📈 Volume Rookie | > $10k total volume |
| 🐋 Volume Beast | > $1M total volume |
| 🛡️ Survivor | Has traded, zero liquidations |
| 💸 Funding Donor | > $100 cumulative funding paid |
| 💎 Diamond Hands | Held a single position > 7 days |
| 🔥 Liquidation Legend | Liquidated at least once |

### API endpoints

```
GET  /api/trader/[address]                 # stats + reputation + achievements (no DB)
POST /api/trader/[address]                 # same, then persists to Postgres
GET  /api/metadata/[achievementId]         # ERC-721 metadata (generic)
GET  /api/metadata/[achievementId]?address=0x…   # personalized metadata
GET  /api/badge/[achievementId]?earned=true      # SVG badge image
```

---

## How reputation is scored

`score = volume + pnl + winRate + activity − drawdownPenalty − liquidationPenalty`,
clamped to **0–1000**:

- **Volume** (0–250): log-scaled total notional
- **PnL** (−250–250): `tanh`-smoothed realized PnL
- **Win rate** (0–200): fraction of profitable closed trades
- **Activity** (0–150): trade count + account age
- **Drawdown** (−150–0): relative peak-to-trough decline
- **Liquidations** (−200–0): penalty per liquidation

Weights are intentionally simple and easy to tune — see
`src/lib/reputation/score.ts`.

---

## Next steps: connect real Hyperliquid data

1. **Disable mock mode** in `.env`:
   ```
   HYPERLIQUID_USE_MOCK="false"
   ```
2. **Confirm response shapes.** The live methods in
   `src/lib/hyperliquid/client.ts` POST to `https://api.hyperliquid.xyz/info`
   with `type: "userFills" | "clearinghouseState" | "userFunding"`. Each has a
   `TODO(hyperliquid)` noting fields to verify against the official docs
   (<https://hyperliquid.gitbook.io/hyperliquid-docs>). In particular:
   - Normalize `userFunding` (real payload nests data under `delta`).
   - Decide how **liquidations** are detected — see the `liquidation` flag on
     `Fill` in `src/lib/hyperliquid/types.ts`. They may need to be derived from
     fills or a separate source.
   - Use `userFillsByTime` for full history (pagination) instead of just recent
     fills.
3. **Harden wallet connect.** Replace the EIP-1193 button with wagmi +
   RainbowKit/WalletConnect and add **signature-based ownership proof** (sign a
   nonce) before persisting, so profiles can't be spoofed.
4. **Persist + cache.** Call `POST /api/trader/[address]` to snapshot results;
   add a background refresh/cron and rate limiting around the HL API.
5. **Mint for real.** Point each badge's `image` at hosted/IPFS art and wire the
   metadata route to your ERC-721 contract's `tokenURI`.

---

## Scripts

```bash
npm run dev               # start dev server
npm run build             # production build
npm run start             # run production build
npm run lint              # lint
npm run prisma:generate   # generate Prisma client
npm run db:push           # push schema to the database
npm run db:seed           # seed achievement catalog
```

> MVP demo. Trading data is mocked until the Hyperliquid API is wired up. Not
> financial advice.
