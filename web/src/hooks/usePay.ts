import { useCallback } from "react";
import { simulateContract, writeContract } from "wagmi/actions";
import { USE_MOCK } from "@/config/env";
import { wagmiConfig } from "@/config/wagmi";
import { mockLedger } from "@/lib/mock/store";
import { ledger, requireAccount, runMockTx, useTxRunner, waitForSuccess } from "./internal";

/** Pays `amountWei` into an active work. Resolves true on success. */
export function usePay() {
  const { run, txState } = useTxRunner("Pay work");

  const pay = useCallback(
    (workId: bigint, amountWei: bigint) =>
      run(async (onSubmitted) => {
        const account = await requireAccount();
        if (USE_MOCK) {
          return runMockTx(onSubmitted, () => (mockLedger.payWork(account, workId, amountWei), true));
        }
        const { request } = await simulateContract(wagmiConfig, {
          ...ledger,
          account,
          functionName: "payWork",
          args: [workId],
          value: amountWei,
        });
        const hash = await writeContract(wagmiConfig, request);
        onSubmitted(hash);
        await waitForSuccess(hash);
        return true;
      }),
    [run],
  );

  return { pay, ...txState };
}
