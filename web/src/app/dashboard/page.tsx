"use client";

import Link from "next/link";
import type { Address } from "viem";
import { useConnection } from "wagmi";
import { ConnectButton } from "@/components/ConnectButton";
import {
  AiBadge,
  Button,
  Card,
  EmptyState,
  ErrorBox,
  Skeleton,
  StatusBadge,
  TxFeedback,
} from "@/components/ui";
import { useConfirm, usePendingWithdrawal, useWithdraw, useWorkDetails } from "@/hooks";
import { friendlyError } from "@/lib/errors";
import { bpsToPercent, formatEth, sameAddress } from "@/lib/format";
import type { WorkDetail } from "@/lib/types";

export default function DashboardPage() {
  const { address, isConnected, isReconnecting } = useConnection();

  if (!isConnected || !address) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-12 text-center">
        <h1 className="text-2xl font-semibold">My dashboard</h1>
        <p className="text-stone-600">
          {isReconnecting
            ? "Reconnecting your wallet…"
            : "Connect your wallet to see your earnings and the works waiting on you."}
        </p>
        {!isReconnecting && (
          <div className="flex justify-center">
            <ConnectButton />
          </div>
        )}
      </div>
    );
  }
  return <Dashboard address={address} />;
}

function Dashboard({ address }: { address: Address }) {
  const { data, isLoading, error, refetch } = useWorkDetails();

  const toConfirm = (data ?? []).filter((d) =>
    d.contributors.some((c) => sameAddress(c.wallet, address) && !c.confirmed),
  );
  const registered = (data ?? []).filter((d) => sameAddress(d.work.registrant, address));
  const credited = (data ?? []).filter(
    (d) =>
      !sameAddress(d.work.registrant, address) &&
      d.contributors.some((c) => sameAddress(c.wallet, address) && c.confirmed),
  );

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">My dashboard</h1>
      <EarningsCard address={address} />

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      ) : error ? (
        <ErrorBox>
          Couldn&apos;t load works: {friendlyError(error)}{" "}
          <button type="button" className="underline" onClick={() => refetch()}>
            Retry
          </button>
        </ErrorBox>
      ) : (
        <>
          <Section
            title="Waiting for your confirmation"
            count={toConfirm.length}
            empty="Nothing to confirm. You're all caught up."
          >
            {toConfirm.map((d) => (
              <ConfirmRow key={d.work.id.toString()} detail={d} address={address} />
            ))}
          </Section>

          <Section
            title="Works I registered"
            count={registered.length}
            empty={
              <>
                You haven&apos;t registered any works yet.{" "}
                <Link href="/register" className="text-indigo-700 underline">
                  Register one
                </Link>
              </>
            }
          >
            {registered.map((d) => (
              <WorkRow key={d.work.id.toString()} detail={d} address={address} />
            ))}
          </Section>

          {credited.length > 0 && (
            <Section title="Works I'm credited on" count={credited.length} empty="">
              {credited.map((d) => (
                <WorkRow key={d.work.id.toString()} detail={d} address={address} />
              ))}
            </Section>
          )}
        </>
      )}
    </div>
  );
}

function EarningsCard({ address }: { address: Address }) {
  const { data: pending, isLoading } = usePendingWithdrawal(address);
  const withdraw = useWithdraw();
  const hasEarnings = pending !== undefined && pending > 0n;

  return (
    <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm text-stone-500">Pending earnings</p>
        {isLoading ? (
          <Skeleton className="mt-1 h-8 w-32" />
        ) : (
          <p className="text-3xl font-semibold tabular-nums">{formatEth(pending ?? 0n)}</p>
        )}
      </div>
      <div className="space-y-2 sm:text-right">
        <Button onClick={() => withdraw.withdraw()} disabled={!hasEarnings} loading={withdraw.isPending}>
          {withdraw.status === "signing" ? "Confirm in wallet…" : withdraw.status === "confirming" ? "Withdrawing…" : "Withdraw"}
        </Button>
        {!hasEarnings && withdraw.status === "idle" && !isLoading && (
          <p className="text-xs text-stone-500">Earnings appear here when someone pays a work you&apos;re on.</p>
        )}
        <TxFeedback tx={withdraw} success="Withdrawn to your wallet." />
      </div>
    </Card>
  );
}

function Section({
  title,
  count,
  empty,
  children,
}: {
  title: string;
  count: number;
  empty: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        {title}
        <span className="rounded-full bg-stone-200 px-2 text-xs font-medium text-stone-700">{count}</span>
      </h2>
      {count === 0 ? <EmptyState title="">{empty}</EmptyState> : <ul className="space-y-2">{children}</ul>}
    </section>
  );
}

function myShare(detail: WorkDetail, address: Address) {
  return detail.contributors.find((c) => sameAddress(c.wallet, address));
}

function WorkRow({ detail, address }: { detail: WorkDetail; address: Address }) {
  const { work } = detail;
  const me = myShare(detail, address);
  return (
    <li>
      <Link
        href={`/work/${work.id}`}
        className="flex flex-wrap items-center gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3 hover:border-indigo-300"
      >
        <span className="font-medium">{work.title || "Untitled work"}</span>
        <StatusBadge work={work} />
        {work.aiAssisted && <AiBadge />}
        <span className="ml-auto text-sm text-stone-500">
          {me && <>Your share {bpsToPercent(me.shareBps)} · </>}
          {formatEth(work.totalPaid)} paid
        </span>
      </Link>
    </li>
  );
}

function ConfirmRow({ detail, address }: { detail: WorkDetail; address: Address }) {
  const { work } = detail;
  const me = myShare(detail, address)!;
  const confirm = useConfirm();
  return (
    <li className="space-y-2 rounded-xl border border-indigo-200 bg-indigo-50/50 px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <Link href={`/work/${work.id}`} className="font-medium hover:underline">
          {work.title || "Untitled work"}
        </Link>
        {work.aiAssisted && <AiBadge />}
        <span className="text-sm text-stone-600">
          as <b>{me.role}</b> · {bpsToPercent(me.shareBps)}
        </span>
        <Button className="ml-auto" onClick={() => confirm.confirm(work.id)} loading={confirm.isPending}>
          Confirm
        </Button>
      </div>
      <TxFeedback tx={confirm} success="Confirmed!" />
    </li>
  );
}
