// Shapes returned by the Hyperliquid `info` API.
//
// TODO(hyperliquid): Confirm exact field names/types against the live API and
// the official docs (https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api).
// These interfaces are intentionally close to the documented responses so the
// mock adapter and the real client are interchangeable.

/** A single trade fill. Matches the `userFills` info request. */
export interface Fill {
  coin: string;
  /** Fill price, as a stringified number (HL returns numbers as strings). */
  px: string;
  /** Fill size (absolute), stringified number. */
  sz: string;
  /** "B" = buy/bid, "A" = sell/ask. */
  side: "B" | "A";
  /** Epoch milliseconds. */
  time: number;
  /** e.g. "Open Long", "Close Long", "Open Short", "Close Short". */
  dir: string;
  /** Realized PnL booked on this fill (stringified number). */
  closedPnl: string;
  /** Fee paid on this fill (stringified number). */
  fee: string;
  hash: string;
  oid: number;
  crossed: boolean;
  /**
   * Present only when this fill resulted from a liquidation. The live API
   * returns an object (liquidated user / mark price / method); the mock adapter
   * uses a boolean. Either way a truthy value flags a liquidation, which is all
   * the stats engine checks.
   */
  liquidation?: boolean | { liquidatedUser?: string; markPx?: string; method?: string };
}

/** A single open position within the clearinghouse state. */
export interface AssetPosition {
  coin: string;
  /** Signed position size: positive = long, negative = short. */
  szi: string;
  entryPx: string | null;
  positionValue: string;
  unrealizedPnl: string;
  leverage?: { type: string; value: number };
}

/** Response of the `clearinghouseState` info request. */
export interface AccountState {
  marginSummary: {
    accountValue: string;
    totalNtlPos: string;
    totalRawUsd: string;
    totalMarginUsed: string;
  };
  assetPositions: AssetPosition[];
  /** Epoch milliseconds. */
  time: number;
}

/**
 * Normalized funding payment/receipt used by the stats engine.
 * `usdc`: negative = funding paid by the trader, positive = funding received.
 */
export interface FundingEntry {
  /** Epoch milliseconds. */
  time: number;
  coin: string;
  usdc: string;
  fundingRate: string;
}

/**
 * Raw `userFunding` entry as returned by the live API. The interesting fields
 * are nested under `delta`; `getUserFunding` flattens this into FundingEntry.
 */
export interface RawFundingEntry {
  time: number;
  hash: string;
  delta: {
    type: string;
    coin: string;
    usdc: string;
    szi: string;
    fundingRate: string;
    nSamples?: number;
  };
}

/** Everything we pull for a single trader in one shot. */
export interface TraderRawData {
  address: string;
  fills: Fill[];
  accountState: AccountState;
  funding: FundingEntry[];
  /** "mock" | "live" — which adapter produced this data. */
  source: "mock" | "live";
}
