// Shared plumbing for the contract hooks. Pages should import the public hooks
// (useWorks, useRegisterWork, ...) rather than anything in this file.
import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Address, Hash } from "viem";
import { getConnection, switchChain, waitForTransactionReceipt } from "wagmi/actions";
import { CONTRACT_ADDRESS, TARGET_CHAIN, USE_MOCK } from "@/config/env";
import { wagmiConfig } from "@/config/wagmi";
import { creditLedgerAbi } from "@/contracts/abi";
import { friendlyError } from "@/lib/errors";
import { mockTx } from "@/lib/mock/store";
import { emitTxEvent } from "@/lib/txEvents";
import type { TxState, TxStatus } from "@/lib/types";

/** Every contract query lives under this key so one invalidate refreshes the UI after a tx. */
export const QUERY_ROOT = ["credit-ledger", USE_MOCK ? "mock" : TARGET_CHAIN.id] as const;

/** Poll real chain data so confirmations from other wallets show up without a reload. */
export const REFETCH_INTERVAL = USE_MOCK ? false : 8_000;

export const ledger = {
  abi: creditLedgerAbi,
  chainId: TARGET_CHAIN.id,
  get address(): Address {
    if (!CONTRACT_ADDRESS) {
      throw new Error(
        `CreditLedger isn't deployed on ${TARGET_CHAIN.name} yet. Set NEXT_PUBLIC_USE_MOCK=true to use demo data.`,
      );
    }
    return CONTRACT_ADDRESS;
  },
};

/** The connected wallet, switching it to the target chain first if needed. */
export async function requireAccount(): Promise<Address> {
  const { address, chainId } = getConnection(wagmiConfig);
  if (!address) throw new Error("Connect your wallet first.");
  if (!USE_MOCK && chainId !== TARGET_CHAIN.id) {
    await switchChain(wagmiConfig, { chainId: TARGET_CHAIN.id });
  }
  return address;
}

/**
 * Mock-mode stand-in for "simulate, sign, wait for receipt". `fn` runs first so
 * contract errors surface before a hash exists, like a failed simulation.
 */
export async function runMockTx<T>(onSubmitted: (hash: Hash) => void, fn: () => T): Promise<T> {
  await mockTx.delay(400);
  const result = fn();
  onSubmitted(mockTx.hash());
  await mockTx.delay(900);
  return result;
}

/** Waits for the tx to be mined and fails if it reverted. */
export async function waitForSuccess(hash: Hash) {
  const receipt = await waitForTransactionReceipt(wagmiConfig, { hash, chainId: TARGET_CHAIN.id });
  if (receipt.status !== "success") throw new Error("The transaction failed on-chain.");
  return receipt;
}

type Submit<T> = (onSubmitted: (hash: Hash) => void) => Promise<T>;

/**
 * Tracks a transaction's lifecycle (signing -> confirming -> success/error),
 * converts errors to friendly text, notifies the toast, and refreshes all
 * contract queries on success.
 */
export function useTxRunner(label: string) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<{ status: TxStatus; txHash?: Hash; error?: string }>({
    status: "idle",
  });

  const run = useCallback(
    async <T,>(submit: Submit<T>): Promise<T | undefined> => {
      let txHash: Hash | undefined;
      setState({ status: "signing" });
      emitTxEvent({ label, status: "signing" });
      try {
        const result = await submit((hash) => {
          txHash = hash;
          setState({ status: "confirming", txHash: hash });
          emitTxEvent({ label, status: "confirming", txHash: hash });
        });
        setState({ status: "success", txHash });
        emitTxEvent({ label, status: "success", txHash });
        await queryClient.invalidateQueries({ queryKey: QUERY_ROOT });
        return result;
      } catch (err) {
        console.error(`[${label}]`, err);
        const error = friendlyError(err);
        setState({ status: "error", txHash, error });
        emitTxEvent({ label, status: "error", txHash, error });
        return undefined;
      }
    },
    [label, queryClient],
  );

  const reset = useCallback(() => setState({ status: "idle" }), []);
  const txState: TxState = {
    ...state,
    isPending: state.status === "signing" || state.status === "confirming",
    reset,
  };
  return { run, txState };
}
