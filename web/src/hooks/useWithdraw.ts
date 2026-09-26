import { useCallback } from "react";
import { simulateContract, writeContract } from "wagmi/actions";
import { USE_MOCK } from "@/config/env";
import { wagmiConfig } from "@/config/wagmi";
import { mockLedger } from "@/lib/mock/store";
import { ledger, requireAccount, runMockTx, useTxRunner, waitForSuccess } from "./internal";

/** Withdraws the connected wallet's pending earnings. Resolves true on success. */
export function useWithdraw() {
  const { run, txState } = useTxRunner("Withdraw earnings");

  const withdraw = useCallback(
    () =>
      run(async (onSubmitted) => {
        const account = await requireAccount();
        if (USE_MOCK) return runMockTx(onSubmitted, () => (mockLedger.withdraw(account), true));
        const { request } = await simulateContract(wagmiConfig, {
          ...ledger,
          account,
          functionName: "withdraw",
        });
        const hash = await writeContract(wagmiConfig, request);
        onSubmitted(hash);
        await waitForSuccess(hash);
        return true;
      }),
    [run],
  );

  return { withdraw, ...txState };
}
