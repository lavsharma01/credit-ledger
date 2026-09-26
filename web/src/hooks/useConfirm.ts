import { useCallback } from "react";
import { simulateContract, writeContract } from "wagmi/actions";
import { USE_MOCK } from "@/config/env";
import { wagmiConfig } from "@/config/wagmi";
import { mockLedger } from "@/lib/mock/store";
import { ledger, requireAccount, runMockTx, useTxRunner, waitForSuccess } from "./internal";

/** Confirms the connected wallet's share of a work. Resolves true on success. */
export function useConfirm() {
  const { run, txState } = useTxRunner("Confirm contribution");

  const confirm = useCallback(
    (workId: bigint) =>
      run(async (onSubmitted) => {
        const account = await requireAccount();
        if (USE_MOCK) {
          return runMockTx(onSubmitted, () => (mockLedger.confirmContribution(account, workId), true));
        }
        const { request } = await simulateContract(wagmiConfig, {
          ...ledger,
          account,
          functionName: "confirmContribution",
          args: [workId],
        });
        const hash = await writeContract(wagmiConfig, request);
        onSubmitted(hash);
        await waitForSuccess(hash);
        return true;
      }),
    [run],
  );

  return { confirm, ...txState };
}
