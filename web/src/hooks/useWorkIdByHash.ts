import { useQuery } from "@tanstack/react-query";
import type { Hex } from "viem";
import { readContract } from "wagmi/actions";
import { USE_MOCK } from "@/config/env";
import { wagmiConfig } from "@/config/wagmi";
import { mockLedger } from "@/lib/mock/store";
import { ledger, QUERY_ROOT } from "./internal";

/** The work id registered for a content hash, or 0n if none. */
export function useWorkIdByHash(contentHash: Hex | undefined) {
  return useQuery({
    queryKey: [...QUERY_ROOT, "workIdByHash", contentHash],
    enabled: !!contentHash,
    queryFn: async () =>
      USE_MOCK
        ? mockLedger.workIdByHash(contentHash!)
        : readContract(wagmiConfig, { ...ledger, functionName: "workIdByHash", args: [contentHash!] }),
  });
}
