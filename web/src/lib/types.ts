import type { Address, Hash, Hex } from "viem";

/** Mirrors CreditLedger.Work (docs/INTERFACE.md) plus its id. */
export type Work = {
  id: bigint;
  registrant: Address;
  contentHash: Hex;
  title: string;
  metadataURI: string;
  registeredAt: bigint; // unix seconds
  aiAssisted: boolean;
  active: boolean;
  confirmedCount: number;
  contributorCount: number;
  totalPaid: bigint; // wei
};

/** Mirrors CreditLedger.Contributor. */
export type Contributor = {
  wallet: Address;
  role: string;
  shareBps: number;
  confirmed: boolean;
};

export type WorkDetail = { work: Work; contributors: Contributor[] };

export type RegisterWorkInput = {
  contentHash: Hex;
  title: string;
  metadataURI: string;
  aiAssisted: boolean;
  wallets: Address[];
  roles: string[];
  sharesBps: number[];
};

export type TxStatus = "idle" | "signing" | "confirming" | "success" | "error";

/** Common state returned by every write hook (same shape in mock and real mode). */
export type TxState = {
  status: TxStatus;
  txHash?: Hash;
  /** Friendly, user-facing message. Never raw hex. */
  error?: string;
  isPending: boolean;
  reset: () => void;
};

export const BPS_TOTAL = 10_000;
export const MAX_CONTRIBUTORS = 10;
