import { useQuery } from "@tanstack/react-query";
import type { WorkDetail } from "@/lib/types";
import { QUERY_ROOT, REFETCH_INTERVAL } from "./internal";
import { fetchContributors } from "./useWork";
import { fetchWorks } from "./useWorks";

/** Recent works with their contributors (for the dashboard), newest first. */
export function useWorkDetails() {
  return useQuery({
    queryKey: [...QUERY_ROOT, "workDetails"],
    refetchInterval: REFETCH_INTERVAL,
    queryFn: async (): Promise<WorkDetail[]> => {
      const works = await fetchWorks();
      const contributors = await Promise.all(works.map((w) => fetchContributors(w.id)));
      return works.map((work, i) => ({ work, contributors: contributors[i] }));
    },
  });
}
