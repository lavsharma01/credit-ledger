import { useQuery } from "@tanstack/react-query";
import type { Address } from "viem";
import { readContract } from "wagmi/actions";
import { USE_MOCK } from "@/config/env";
import { wagmiConfig } from "@/config/wagmi";
import { mockLedger } from "@/lib/mock/store";
import { ledger, QUERY_ROOT, REFETCH_INTERVAL } from "./internal";

/** Wei the account can withdraw right now. */
export function usePendingWithdrawal(account: Address | undefined) {
  return useQuery({
    queryKey: [...QUERY_ROOT, "pending", account?.toLowerCase()],
    enabled: !!account,
    refetchInterval: REFETCH_INTERVAL,
    queryFn: async () =>
      USE_MOCK
        ? mockLedger.pendingWithdrawal(account!)
        : readContract(wagmiConfig, { ...ledger, functionName: "pendingWithdrawal", args: [account!] }),
  });
}
