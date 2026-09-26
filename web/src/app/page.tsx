"use client";

import Link from "next/link";
import { useConnection } from "wagmi";
import { ConnectButton } from "@/components/ConnectButton";
import { EmptyState, ErrorBox, Skeleton } from "@/components/ui";
import { WorkList } from "@/components/WorkList";
import { useWorks } from "@/hooks";
import { friendlyError } from "@/lib/errors";

export default function Home() {
  const { isConnected } = useConnection();
  const { data: works, isLoading, error, refetch } = useWorks();

  return (
    <div className="space-y-12">
      <section className="space-y-5 py-4">
        <h1 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
          Credit every contributor, human or AI, and split every payment automatically.
        </h1>
        <p className="max-w-2xl text-stone-600">
          Credit Ledger puts a creative work&apos;s fingerprint on Ethereum together with who made
          it: writers, producers and the AI tools involved, each with an agreed share. Every
          contributor confirms their share from their own wallet. After that, any payment to the
          work is split between them automatically, and each person withdraws their own earnings.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          {isConnected ? (
            <Link
              href="/register"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Register a work
            </Link>
          ) : (
            <ConnectButton />
          )}
          <Link href="/dashboard" className="text-sm font-medium text-indigo-700 hover:underline">
            My dashboard →
          </Link>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Recent works</h2>
        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : error ? (
          <ErrorBox>
            Couldn&apos;t load works: {friendlyError(error)}{" "}
            <button type="button" className="underline" onClick={() => refetch()}>
              Retry
            </button>
          </ErrorBox>
        ) : works && works.length > 0 ? (
          <WorkList works={works} />
        ) : (
          <EmptyState title="No works registered yet">
            <Link href="/register" className="text-indigo-700 underline">
              Register the first one
            </Link>
          </EmptyState>
        )}
      </section>
    </div>
  );
}
