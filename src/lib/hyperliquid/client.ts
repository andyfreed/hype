import { generateMockData } from "./mock";
import type {
  AccountState,
  Fill,
  FundingEntry,
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

  /** Recent fills for an address. */
  async getUserFills(address: string): Promise<Fill[]> {
    if (this.useMock) return generateMockData(address).fills;
    // TODO(hyperliquid): Confirm response maps directly to Fill[]. `userFills`
    // returns the most recent fills; use `userFillsByTime` for full history.
    return this.info<Fill[]>({ type: "userFills", user: address });
  }

  /** Current clearinghouse (account) state, including open positions. */
  async getAccountState(address: string): Promise<AccountState> {
    if (this.useMock) return generateMockData(address).accountState;
    // TODO(hyperliquid): Confirm `clearinghouseState` field names match AccountState.
    return this.info<AccountState>({ type: "clearinghouseState", user: address });
  }

  /** Funding payments/receipts for an address. */
  async getUserFunding(
    address: string,
    startTime = 0,
  ): Promise<FundingEntry[]> {
    if (this.useMock) return generateMockData(address).funding;
    // TODO(hyperliquid): The real `userFunding` response nests data under a
    // `delta` object: { time, hash, delta: { type, coin, usdc, fundingRate } }.
    // Normalize it to FundingEntry[] here once confirmed against the live API.
    return this.info<FundingEntry[]>({
      type: "userFunding",
      user: address,
      startTime,
    });
  }

  /**
   * Liquidation history.
   * TODO(hyperliquid): There is no confirmed dedicated "liquidations" info
   * request. Liquidations may need to be derived from fills (see the
   * `liquidation` flag on Fill) or a separate data source. For now we surface
   * them via fills in `getTraderRawData`.
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
