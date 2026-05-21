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
   * Whether this fill was part of a liquidation.
   * TODO(hyperliquid): Confirm how liquidations are surfaced. They may appear
   * as a dedicated `liquidation` object on the fill, via the `dir` field, or
   * through a separate endpoint.
   */
  liquidation?: boolean;
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

/** A single funding payment/receipt. Matches the `userFunding` info request. */
export interface FundingEntry {
  /** Epoch milliseconds. */
  time: number;
  coin: string;
  /** USDC delta. Negative = funding paid, positive = funding received. */
  usdc: string;
  fundingRate: string;
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
