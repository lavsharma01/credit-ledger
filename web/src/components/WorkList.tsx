"use client";

import Link from "next/link";
import { formatEth, formatTimestamp } from "@/lib/format";
import type { Work } from "@/lib/types";
import { AiBadge, StatusBadge } from "./ui";

export function WorkList({ works }: { works: Work[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {works.map((work) => (
        <li key={work.id.toString()}>
          <Link
            href={`/work/${work.id}`}
            className="flex h-full flex-col gap-3 rounded-xl border border-stone-200 bg-white p-4 shadow-sm transition hover:border-indigo-300 hover:shadow"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-medium leading-snug">{work.title || "Untitled work"}</h3>
              <span className="shrink-0 text-xs text-stone-400">#{work.id.toString()}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge work={work} />
              {work.aiAssisted && <AiBadge />}
            </div>
            <div className="mt-auto flex items-center justify-between text-sm text-stone-500">
              <span>{formatTimestamp(work.registeredAt)}</span>
              <span className="font-medium text-stone-800">{formatEth(work.totalPaid)} paid</span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
