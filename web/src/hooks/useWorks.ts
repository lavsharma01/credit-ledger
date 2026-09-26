import { useQuery } from "@tanstack/react-query";
import { readContract } from "wagmi/actions";
import { wagmiConfig } from "@/config/wagmi";
import { mockLedger } from "@/lib/mock/store";
import { USE_MOCK } from "@/config/env";
import type { Work } from "@/lib/types";
import { ledger, QUERY_ROOT, REFETCH_INTERVAL } from "./internal";

/** How many of the most recent works to load. */
const MAX_WORKS = 50;

export async function fetchWork(id: bigint): Promise<Work> {
  if (USE_MOCK) return mockLedger.getWork(id);
  const work = await readContract(wagmiConfig, { ...ledger, functionName: "getWork", args: [id] });
  return { id, ...work };
}

export async function fetchWorks(): Promise<Work[]> {
  const count = USE_MOCK
    ? mockLedger.workCount()
    : await readContract(wagmiConfig, { ...ledger, functionName: "workCount" });
  const ids: bigint[] = [];
  for (let id = count; id >= 1n && ids.length < MAX_WORKS; id--) ids.push(id);
  return Promise.all(ids.map(fetchWork));
}

/** Most recent works, newest first. */
export function useWorks() {
  return useQuery({
    queryKey: [...QUERY_ROOT, "works"],
    queryFn: fetchWorks,
    refetchInterval: REFETCH_INTERVAL,
  });
}
