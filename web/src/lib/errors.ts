import { BaseError, ContractFunctionRevertedError, UserRejectedRequestError } from "viem";

/** Friendly messages for every CreditLedger custom error (docs/INTERFACE.md). */
export const CONTRACT_ERROR_MESSAGES: Record<string, string> = {
  EmptyContributors: "Add at least one contributor.",
  TooManyContributors: "A work can have at most 10 contributors.",
  LengthMismatch: "Every contributor needs a wallet, a role and a share.",
  ZeroShare: "Every contributor needs a share above 0%.",
  SharesNot100Percent: "Shares must add up to 100%.",
  ZeroAddress: "One of the contributor wallets is the zero address.",
  DuplicateWallet: "The same wallet is listed twice. Each contributor needs a unique wallet.",
  HashAlreadyRegistered: "This file has already been registered.",
  WorkNotFound: "That work does not exist.",
  NotAContributor: "Your wallet is not a contributor on this work.",
  AlreadyConfirmed: "You have already confirmed your contribution.",
  WorkNotActive: "This work can't receive payments until every contributor has confirmed.",
  ZeroPayment: "Enter an amount greater than 0.",
  NothingToWithdraw: "You have no earnings to withdraw yet.",
  TransferFailed: "The ETH transfer failed. Please try again.",
  ReentrancyGuardReentrantCall: "The transaction was rejected by the contract. Please try again.",
};

/** Thrown by the mock contract so mock and real errors decode the same way. */
export class MockContractError extends Error {
  constructor(public errorName: string) {
    super(CONTRACT_ERROR_MESSAGES[errorName] ?? errorName);
    this.name = "MockContractError";
  }
}

/** Returns the custom error name for a contract revert, if there is one. */
export function getContractErrorName(err: unknown): string | undefined {
  if (err instanceof MockContractError) return err.errorName;
  if (err instanceof BaseError) {
    const revert = err.walk((e) => e instanceof ContractFunctionRevertedError);
    if (revert instanceof ContractFunctionRevertedError) return revert.data?.errorName;
  }
  return undefined;
}

/** Turns any wallet / RPC / contract error into a short sentence for the UI. */
export function friendlyError(err: unknown): string {
  if (err instanceof Error && /provider not found/i.test(err.message)) {
    return "No browser wallet found. Install MetaMask and reload.";
  }
  const name = getContractErrorName(err);
  if (name) return CONTRACT_ERROR_MESSAGES[name] ?? "The contract rejected this transaction.";

  if (err instanceof BaseError) {
    if (err.walk((e) => e instanceof UserRejectedRequestError)) {
      return "You rejected the request in your wallet.";
    }
    const text = `${err.shortMessage} ${err.details ?? ""}`.toLowerCase();
    if (text.includes("insufficient funds")) return "Your wallet doesn't have enough ETH for this (including gas).";
    if (text.includes("chain mismatch") || text.includes("does not match the target chain")) {
      return "Your wallet is on the wrong network. Switch networks and try again.";
    }
    if (text.includes("connector not connected")) return "Connect your wallet first.";
    if (text.includes("fetch failed") || text.includes("http request failed")) {
      return "Couldn't reach the network. Check your connection and try again.";
    }
    return stripHex(err.shortMessage);
  }
  if (err instanceof Error) {
    if (/user (rejected|denied)/i.test(err.message)) return "You rejected the request in your wallet.";
    return stripHex(err.message);
  }
  return "Something went wrong. Please try again.";
}

// Never show long hex blobs (calldata, revert data) to users.
function stripHex(message: string): string {
  const cleaned = message.replace(/0x[0-9a-fA-F]{16,}/g, "…").split("\n")[0].trim();
  return cleaned || "Something went wrong. Please try again.";
}
