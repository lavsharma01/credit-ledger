import { getAddress, isAddress, zeroAddress, type Address } from "viem";
import { BPS_TOTAL, MAX_CONTRIBUTORS } from "./types";

export type ContributorRow = { key: number; wallet: string; role: string; percent: string };

export type RowErrors = { wallet?: string; role?: string; percent?: string };

/** "12.5" -> 1250 bps. Undefined if not a positive number with at most 2 decimals. */
export function percentToBps(percent: string): number | undefined {
  const trimmed = percent.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return undefined;
  const bps = Math.round(Number(trimmed) * 100);
  return bps > 0 ? bps : undefined;
}

export function validateRows(rows: ContributorRow[]) {
  const seen = new Map<string, number>();
  const errors: RowErrors[] = rows.map((row, i) => {
    const e: RowErrors = {};
    const wallet = row.wallet.trim();
    if (!wallet) e.wallet = "Wallet address required";
    else if (!isAddress(wallet, { strict: false })) e.wallet = "Not a valid address";
    else if (wallet.toLowerCase() === zeroAddress) e.wallet = "Zero address not allowed";
    else if (seen.has(wallet.toLowerCase())) e.wallet = `Same wallet as contributor ${seen.get(wallet.toLowerCase())! + 1}`;
    else seen.set(wallet.toLowerCase(), i);

    if (!row.role.trim()) e.role = "Role required";
    if (percentToBps(row.percent) === undefined) {
      e.percent = row.percent.trim() ? "Use a number above 0 with up to 2 decimals" : "Share required";
    }
    return e;
  });

  const totalBps = rows.reduce((sum, r) => sum + (percentToBps(r.percent) ?? 0), 0);
  const rowsValid = errors.every((e) => !e.wallet && !e.role && !e.percent);
  const countValid = rows.length >= 1 && rows.length <= MAX_CONTRIBUTORS;
  return { errors, totalBps, valid: rowsValid && countValid && totalBps === BPS_TOTAL };
}

export function rowsToArgs(rows: ContributorRow[]) {
  return {
    wallets: rows.map((r) => getAddress(r.wallet.trim())) as Address[],
    roles: rows.map((r) => r.role.trim()),
    sharesBps: rows.map((r) => percentToBps(r.percent)!),
  };
}

/** Even split in percent strings; rounding remainder goes to the first row. */
export function evenPercents(count: number): string[] {
  const base = Math.floor(BPS_TOTAL / count);
  const remainder = BPS_TOTAL - base * count;
  return Array.from({ length: count }, (_, i) => String((base + (i === 0 ? remainder : 0)) / 100));
}
