import { generateMockData } from "./mock";
import type {
  AccountState,
  Fill,
  FundingEntry,
  RawFundingEntry,
  TraderRawData,
} from "./types";

const DEFAULT_API_URL = "https://api.hyperliquid.xyz";

function shouldUseMock(): boolean {
  // Default to mock unless explicitly disabled, so the app runs with zero config.
  return (process.env.HYPERLIQUID_USE_MOCK ?? "true").toLowerCase() !== "false";
}

/**
 * Thin service layer over the Hyperliquid `info` endpoint.
 *
 * In mock mode every method returns deterministic synthetic data. To switch to
 * the real API set `HYPERLIQUID_USE_MOCK=false`. The real implementations below
 * POST to the public info endpoint; the request `type`s are documented but the
 * exact response shapes still need confirmation (see TODOs in ./types.ts).
 */
export class HyperliquidClient {
  private readonly baseUrl: string;
  private readonly useMock: boolean;

  constructor(opts?: { baseUrl?: string; useMock?: boolean }) {
    this.baseUrl = opts?.baseUrl ?? process.env.HYPERLIQUID_API_URL ?? DEFAULT_API_URL;
    this.useMock = opts?.useMock ?? shouldUseMock();
  }

  /** Low-level POST to the `info` endpoint. */
  private async info<T>(body: Record<string, unknown>): Promise<T> {
    const res = await fetch(`${this.baseUrl}/info`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      // Reputation data tolerates brief staleness; cache lightly.
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      throw new Error(
        `Hyperliquid info request failed (${res.status}): ${await res.text()}`,
      );
    }
    return (await res.json()) as T;
  }

  /**
   * Recent fills for an address. The live `userFills` request maps directly to
   * Fill[] and returns the most recent ~2000 fills; for accounts that exceed
   * that, switch to `userFillsByTime` with pagination for full history.
   */
  async getUserFills(address: string): Promise<Fill[]> {
    if (this.useMock) return generateMockData(address).fills;
    const fills = await this.info<Fill[]>({ type: "userFills", user: address });
    return Array.isArray(fills) ? fills : [];
  }

  /** Current clearinghouse (account) state, including open positions. */
  async getAccountState(address: string): Promise<AccountState> {
    if (this.useMock) return generateMockData(address).accountState;
    // `clearinghouseState` field names match AccountState; we only read
    // marginSummary.accountValue and the length of assetPositions.
    return this.info<AccountState>({ type: "clearinghouseState", user: address });
  }

  /** Funding payments/receipts for an address, normalized to FundingEntry[]. */
  async getUserFunding(
    address: string,
    startTime = 0,
  ): Promise<FundingEntry[]> {
    if (this.useMock) return generateMockData(address).funding;
    // The live `userFunding` response nests the numbers under a `delta` object:
    // { time, hash, delta: { type, coin, usdc, szi, fundingRate } }. Flatten it
    // to FundingEntry so the stats engine can read `usdc` directly.
    const raw = await this.info<RawFundingEntry[]>({
      type: "userFunding",
      user: address,
      startTime,
    });
    return (Array.isArray(raw) ? raw : [])
      .filter((e) => e?.delta?.type === "funding")
      .map((e) => ({
        time: e.time,
        coin: e.delta.coin,
        usdc: e.delta.usdc,
        fundingRate: e.delta.fundingRate,
      }));
  }

  /**
   * Liquidation history, derived from fills. Hyperliquid has no dedicated
   * liquidations info request; liquidation fills carry a truthy `liquidation`
   * field, so we filter on that.
   */
  async getLiquidations(address: string): Promise<Fill[]> {
    const fills = await this.getUserFills(address);
    return fills.filter((f) => f.liquidation);
  }

  /** Fetch everything needed to build a trader profile in one call. */
  async getTraderRawData(address: string): Promise<TraderRawData> {
    if (this.useMock) return generateMockData(address);

    const [fills, accountState, funding] = await Promise.all([
      this.getUserFills(address),
      this.getAccountState(address),
      this.getUserFunding(address),
    ]);

    return { address, fills, accountState, funding, source: "live" };
  }
}

/** Shared default client instance. */
export const hyperliquid = new HyperliquidClient();
