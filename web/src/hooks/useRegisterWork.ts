import { useCallback } from "react";
import { parseEventLogs } from "viem";
import { simulateContract, writeContract } from "wagmi/actions";
import { USE_MOCK } from "@/config/env";
import { wagmiConfig } from "@/config/wagmi";
import { mockLedger } from "@/lib/mock/store";
import type { RegisterWorkInput } from "@/lib/types";
import { ledger, requireAccount, runMockTx, useTxRunner, waitForSuccess } from "./internal";

/** Registers a work. `registerWork` resolves to the new work id, or undefined on failure (see `error`). */
export function useRegisterWork() {
  const { run, txState } = useTxRunner("Register work");

  const registerWork = useCallback(
    (input: RegisterWorkInput) =>
      run(async (onSubmitted) => {
        const account = await requireAccount();
        if (USE_MOCK) return runMockTx(onSubmitted, () => mockLedger.registerWork(account, input));

        const { request, result } = await simulateContract(wagmiConfig, {
          ...ledger,
          account,
          functionName: "registerWork",
          args: [
            input.contentHash,
            input.title,
            input.metadataURI,
            input.aiAssisted,
            input.wallets,
            input.roles,
            input.sharesBps,
          ],
        });
        const hash = await writeContract(wagmiConfig, request);
        onSubmitted(hash);
        const receipt = await waitForSuccess(hash);
        // Trust the mined event over the simulated id in case another tx landed first.
        const [event] = parseEventLogs({ abi: ledger.abi, eventName: "WorkRegistered", logs: receipt.logs });
        return event?.args.workId ?? result;
      }),
    [run],
  );

  return { registerWork, ...txState };
}
