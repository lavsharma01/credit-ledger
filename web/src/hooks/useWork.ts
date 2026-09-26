import { useQuery } from "@tanstack/react-query";
import { readContract } from "wagmi/actions";
import { USE_MOCK } from "@/config/env";
import { wagmiConfig } from "@/config/wagmi";
import { getContractErrorName } from "@/lib/errors";
import { mockLedger } from "@/lib/mock/store";
import type { Contributor, WorkDetail } from "@/lib/types";
import { ledger, QUERY_ROOT, REFETCH_INTERVAL } from "./internal";
import { fetchWork } from "./useWorks";

export async function fetchContributors(id: bigint): Promise<Contributor[]> {
  if (USE_MOCK) return mockLedger.getContributors(id);
  const list = await readContract(wagmiConfig, { ...ledger, functionName: "getContributors", args: [id] });
  return list.map((c) => ({ ...c }));
}

/** A work and its contributors. `data` is null when the work doesn't exist. */
export function useWork(id: bigint | undefined) {
  return useQuery({
    queryKey: [...QUERY_ROOT, "work", id?.toString()],
    enabled: id !== undefined && id > 0n,
    refetchInterval: REFETCH_INTERVAL,
    queryFn: async (): Promise<WorkDetail | null> => {
      try {
        const [work, contributors] = await Promise.all([fetchWork(id!), fetchContributors(id!)]);
        return { work, contributors };
      } catch (err) {
        if (getContractErrorName(err) === "WorkNotFound") return null;
        throw err;
      }
    },
  });
}
