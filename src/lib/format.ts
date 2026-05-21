export function shortenAddress(address: string, chars = 4): string {
  if (!address.startsWith("0x") || address.length < 2 + chars * 2) return address;
  return `${address.slice(0, 2 + chars)}…${address.slice(-chars)}`;
}

export function formatUsd(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}K`;
  return `${sign}$${abs.toFixed(2)}`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(Math.round(value));
}

export function formatPercent(fraction: number): string {
  return `${(fraction * 100).toFixed(1)}%`;
}

export function formatDuration(ms: number): string {
  if (ms <= 0) return "0d";
  const days = ms / (24 * 60 * 60 * 1000);
  if (days >= 1) return `${days.toFixed(days >= 10 ? 0 : 1)}d`;
  const hours = ms / (60 * 60 * 1000);
  return `${hours.toFixed(0)}h`;
}
