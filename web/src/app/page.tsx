"use client";

import { useWorks } from "@/hooks";
import { formatEth } from "@/lib/format";

// Placeholder list to prove the hook layer works; the real landing page comes in web/landing.
export default function Home() {
  const { data: works, isLoading, error } = useWorks();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Credit Ledger</h1>
      {isLoading && <p className="text-stone-500">Loading works…</p>}
      {error && <p className="text-red-600">Couldn&apos;t load works.</p>}
      <ul className="space-y-2">
        {works?.map((w) => (
          <li key={w.id.toString()} className="rounded-lg border border-stone-200 bg-white p-3">
            #{w.id.toString()} {w.title} ·{" "}
            {w.active ? "Active" : `${w.confirmedCount}/${w.contributorCount} confirmed`} ·{" "}
            {formatEth(w.totalPaid)}
          </li>
        ))}
      </ul>
    </div>
  );
}
