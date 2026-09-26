import { formatEther, type Address } from "viem";

export function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function shortHash(hash: string): string {
  return `${hash.slice(0, 10)}…${hash.slice(-8)}`;
}

/** Formats wei as ETH with at most 6 decimals, e.g. "0.0125 ETH". */
export function formatEth(wei: bigint): string {
  const [whole, frac = ""] = formatEther(wei).split(".");
  const trimmed = frac.slice(0, 6).replace(/0+$/, "");
  return `${whole}${trimmed ? `.${trimmed}` : ""} ETH`;
}

export function bpsToPercent(bps: number): string {
  return `${(bps / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}%`;
}

export function formatTimestamp(seconds: bigint): string {
  return new Date(Number(seconds) * 1000).toLocaleString();
}

export function sameAddress(a?: Address | string, b?: Address | string): boolean {
  return !!a && !!b && a.toLowerCase() === b.toLowerCase();
}
