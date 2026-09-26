"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { parseEther, type Hex } from "viem";
import { useConnection } from "wagmi";
import { ConnectButton } from "@/components/ConnectButton";
import { FileHashInput } from "@/components/FileHashInput";
import {
  AiBadge,
  Button,
  Card,
  CopyText,
  EmptyState,
  ErrorBox,
  Skeleton,
  StatusBadge,
  TxFeedback,
} from "@/components/ui";
import { addressUrl } from "@/config/env";
import { useConfirm, usePay, useWork } from "@/hooks";
import { friendlyError } from "@/lib/errors";
import { bpsToPercent, formatEth, formatTimestamp, sameAddress, shortAddress } from "@/lib/format";
import { BPS_TOTAL, type Contributor, type Work } from "@/lib/types";

export default function WorkPage() {
  const params = useParams<{ id: string }>();
  const id = /^\d+$/.test(params.id) && params.id !== "0" ? BigInt(params.id) : undefined;
  const { data, isLoading, error, refetch } = useWork(id);

  if (id === undefined || data === null) {
    return (
      <EmptyState title="Work not found">
        <Link href="/" className="text-indigo-700 underline">
          Back to all works
        </Link>
      </EmptyState>
    );
  }
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    );
  }
  if (error || !data) {
    return (
      <ErrorBox>
        Couldn&apos;t load this work: {friendlyError(error)}{" "}
        <button type="button" className="underline" onClick={() => refetch()}>
          Retry
        </button>
      </ErrorBox>
    );
  }

  const { work, contributors } = data;
  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <Link href="/" className="text-sm text-stone-500 hover:text-stone-800">
          ← All works
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">{work.title || "Untitled work"}</h1>
          <StatusBadge work={work} />
          {work.aiAssisted && <AiBadge />}
        </div>
        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[auto_1fr]">
          <dt className="text-stone-500">Work ID</dt>
          <dd>#{work.id.toString()}</dd>
          <dt className="text-stone-500">Registered</dt>
          <dd>{formatTimestamp(work.registeredAt)}</dd>
          <dt className="text-stone-500">Registrant</dt>
          <dd>
            <AddressText address={work.registrant} />
          </dd>
          <dt className="text-stone-500">File fingerprint (SHA-256)</dt>
          <dd>
            <CopyText text={work.contentHash} />
          </dd>
          {work.metadataURI && (
            <>
              <dt className="text-stone-500">Link</dt>
              <dd className="break-all">
                {/^https?:\/\//.test(work.metadataURI) ? (
                  <a href={work.metadataURI} target="_blank" rel="noreferrer" className="text-indigo-700 underline">
                    {work.metadataURI}
                  </a>
                ) : (
                  work.metadataURI
                )}
              </dd>
            </>
          )}
          <dt className="text-stone-500">Total paid</dt>
          <dd className="font-medium">{formatEth(work.totalPaid)}</dd>
        </dl>
      </header>

      <ContributorsCard work={work} contributors={contributors} />

      <div className="grid gap-6 md:grid-cols-2">
        <PayCard work={work} contributors={contributors} />
        <VerifyCard work={work} />
      </div>
    </div>
  );
}

function AddressText({ address }: { address: string }) {
  const { address: me } = useConnection();
  const url = addressUrl(address as Hex);
  return (
    <span className="inline-flex items-center gap-2">
      {url ? (
        <a href={url} target="_blank" rel="noreferrer" className="font-mono text-xs hover:underline" title={address}>
          {shortAddress(address)}
        </a>
      ) : (
        <span className="font-mono text-xs" title={address}>
          {shortAddress(address)}
        </span>
      )}
      {sameAddress(address, me) && (
        <span className="rounded bg-indigo-100 px-1.5 text-xs font-medium text-indigo-800">you</span>
      )}
    </span>
  );
}

function ContributorsCard({ work, contributors }: { work: Work; contributors: Contributor[] }) {
  const { address } = useConnection();
  const confirm = useConfirm();
  const me = contributors.find((c) => sameAddress(c.wallet, address));
  const canConfirm = !!me && !me.confirmed;

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-medium">Contributors</h2>
        <span className="text-sm text-stone-500">
          {work.confirmedCount} of {work.contributorCount} confirmed
        </span>
      </div>

      <div className="-mx-5 overflow-x-auto">
        <table className="w-full min-w-[32rem] text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-left text-xs uppercase tracking-wide text-stone-500">
              <th className="px-5 py-2 font-medium">Wallet</th>
              <th className="px-2 py-2 font-medium">Role</th>
              <th className="px-2 py-2 text-right font-medium">Share</th>
              <th className="px-5 py-2 text-right font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {contributors.map((c) => (
              <tr key={c.wallet} className="border-b border-stone-100 last:border-0">
                <td className="px-5 py-2.5">
                  <AddressText address={c.wallet} />
                </td>
                <td className="px-2 py-2.5">{c.role}</td>
                <td className="px-2 py-2.5 text-right tabular-nums">{bpsToPercent(c.shareBps)}</td>
                <td className="px-5 py-2.5 text-right">
                  {c.confirmed ? (
                    <span className="text-emerald-700">✓ Confirmed</span>
                  ) : (
                    <span className="text-amber-700">Pending</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(canConfirm || confirm.status !== "idle") && (
        <div className="space-y-2 rounded-lg bg-indigo-50 p-4">
          {canConfirm && (
            <>
              <p className="text-sm text-indigo-900">
                You&apos;re listed as <b>{me.role}</b> with a <b>{bpsToPercent(me.shareBps)}</b> share.
                Confirm to agree to this split.
              </p>
              <Button onClick={() => confirm.confirm(work.id)} loading={confirm.isPending}>
                Confirm my contribution
              </Button>
            </>
          )}
          <TxFeedback
            tx={confirm}
            success={work.active ? "Confirmed. Everyone has agreed and the work is now active!" : "Confirmed!"}
          />
        </div>
      )}
    </Card>
  );
}

function PayCard({ work, contributors }: { work: Work; contributors: Contributor[] }) {
  const { isConnected } = useConnection();
  const pay = usePay();
  const [amount, setAmount] = useState("");

  let wei: bigint | undefined;
  try {
    wei = amount.trim() ? parseEther(amount.trim()) : undefined;
  } catch {
    wei = undefined;
  }
  const amountError = amount.trim() && (wei === undefined || wei <= 0n) ? "Enter an amount of ETH above 0" : undefined;
  const remaining = work.contributorCount - work.confirmedCount;

  return (
    <Card className="space-y-4">
      <h2 className="font-medium">Pay / tip this work</h2>
      {!work.active ? (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          Payments open once every contributor has confirmed their share. Waiting on {remaining} more{" "}
          {remaining === 1 ? "confirmation" : "confirmations"}.
        </p>
      ) : (
        <p className="text-sm text-stone-600">
          Your payment is split automatically between the contributors by their shares.
        </p>
      )}

      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!wei || wei <= 0n) return;
          if (await pay.pay(work.id, wei)) setAmount("");
        }}
      >
        <fieldset disabled={!work.active} className="space-y-3 disabled:opacity-60">
          <div className="relative">
            <input
              aria-label="Amount in ETH"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              placeholder="0.01"
              className="w-full rounded-lg border border-stone-300 py-2 pl-3 pr-12 text-sm"
            />
            <span className="absolute right-3 top-2 text-sm text-stone-400">ETH</span>
          </div>
          {amountError && <p className="text-xs text-red-700">{amountError}</p>}

          {wei !== undefined && wei > 0n && (
            <ul className="space-y-1 rounded-lg bg-stone-50 p-3 text-xs text-stone-600">
              {contributors.map((c, i) => {
                const share = (wei! * BigInt(c.shareBps)) / BigInt(BPS_TOTAL);
                const dust =
                  i === 0
                    ? wei! - contributors.reduce((s, x) => s + (wei! * BigInt(x.shareBps)) / BigInt(BPS_TOTAL), 0n)
                    : 0n;
                return (
                  <li key={c.wallet} className="flex justify-between gap-2">
                    <span>
                      {c.role} <span className="font-mono">{shortAddress(c.wallet)}</span>
                    </span>
                    <span className="tabular-nums">{formatEth(share + dust)}</span>
                  </li>
                );
              })}
            </ul>
          )}

          {isConnected ? (
            <Button type="submit" disabled={!wei || wei <= 0n} loading={pay.isPending}>
              {pay.status === "signing" ? "Confirm in wallet…" : pay.status === "confirming" ? "Paying…" : "Pay"}
            </Button>
          ) : (
            work.active && (
              <div className="flex items-center gap-3 text-sm text-stone-600">
                <ConnectButton /> to pay
              </div>
            )
          )}
        </fieldset>
        <TxFeedback tx={pay} success="Payment split between the contributors." />
      </form>
    </Card>
  );
}

function VerifyCard({ work }: { work: Work }) {
  const [hash, setHash] = useState<Hex>();
  const matches = hash !== undefined && hash.toLowerCase() === work.contentHash.toLowerCase();

  return (
    <Card className="space-y-4">
      <div>
        <h2 className="font-medium">Verify a file</h2>
        <p className="text-sm text-stone-600">
          Check whether a file is exactly the one registered here. Anyone can do this.
        </p>
      </div>
      <FileHashInput onHash={(h) => setHash(h)} hint="Hashed locally. Nothing is uploaded." />
      {hash &&
        (matches ? (
          <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">
            ✓ <b>Match.</b> This file is identical to the one registered on{" "}
            {formatTimestamp(work.registeredAt)}.
          </p>
        ) : (
          <div className="space-y-1 rounded-lg bg-red-50 p-3 text-sm text-red-900">
            <p>
              ✕ <b>No match.</b> This file is different from the registered one.
            </p>
            <p className="break-all font-mono text-xs text-red-800/80">Your file: {hash}</p>
          </div>
        ))}
    </Card>
  );
}
