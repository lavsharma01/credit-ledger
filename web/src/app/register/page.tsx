"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Hex } from "viem";
import { useConnection } from "wagmi";
import { ConnectButton } from "@/components/ConnectButton";
import { FileHashInput } from "@/components/FileHashInput";
import { Button, Card, CopyText, ErrorBox, TxFeedback } from "@/components/ui";
import { useRegisterWork, useWorkIdByHash } from "@/hooks";
import {
  evenPercents,
  rowsToArgs,
  validateRows,
  type ContributorRow,
} from "@/lib/contributors";
import { BPS_TOTAL, MAX_CONTRIBUTORS } from "@/lib/types";

const ROLE_SUGGESTIONS = [
  "Writer",
  "Composer",
  "Producer",
  "Vocalist",
  "Illustrator",
  "Editor",
  "AI tool: ChatGPT",
  "AI tool: Claude",
  "AI tool: Midjourney",
  "AI tool: Suno",
];

let nextKey = 1;
const emptyRow = (wallet = ""): ContributorRow => ({ key: nextKey++, wallet, role: "", percent: "" });

export default function RegisterPage() {
  const router = useRouter();
  const { address, isConnected } = useConnection();
  const [contentHash, setContentHash] = useState<Hex>();
  const [title, setTitle] = useState("");
  const [metadataURI, setMetadataURI] = useState("");
  const [aiAssisted, setAiAssisted] = useState(false);
  const [rows, setRows] = useState<ContributorRow[]>(() => [emptyRow()]);
  const [showErrors, setShowErrors] = useState(false);

  const existing = useWorkIdByHash(contentHash);
  const register = useRegisterWork();

  // Prefill the first contributor with the connected wallet, once.
  const prefilled = useRef(false);
  useEffect(() => {
    if (!address || prefilled.current) return;
    prefilled.current = true;
    setRows((rs) => (rs[0] && !rs[0].wallet ? [{ ...rs[0], wallet: address }, ...rs.slice(1)] : rs));
  }, [address]);

  const { errors, totalBps, valid: rowsValid } = validateRows(rows);
  const alreadyRegistered = existing.data !== undefined && existing.data > 0n;
  const checkingHash = !!contentHash && existing.isLoading;
  const canSubmit =
    isConnected && !!contentHash && !alreadyRegistered && !checkingHash && title.trim() !== "" && rowsValid;

  const update = (key: number, patch: Partial<ContributorRow>) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowErrors(true);
    if (!canSubmit || !contentHash) return;
    const workId = await register.registerWork({
      contentHash,
      title: title.trim(),
      metadataURI: metadataURI.trim(),
      aiAssisted,
      ...rowsToArgs(rows),
    });
    if (workId !== undefined) router.push(`/work/${workId}`);
  };

  const totalPercent = (totalBps / 100).toFixed(2).replace(/\.00$/, "");
  const totalOk = totalBps === BPS_TOTAL;

  return (
    <form onSubmit={submit} className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Register a work</h1>
        <p className="mt-1 text-sm text-stone-600">
          Record the file&apos;s fingerprint and everyone who made it. Each contributor then
          confirms their share from their own wallet.
        </p>
      </div>

      <Card className="space-y-4">
        <h2 className="font-medium">1. The work</h2>
        <FileHashInput onHash={(hash) => setContentHash(hash)} />
        {contentHash && (
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-stone-500">SHA-256: </span>
              <CopyText text={contentHash} />
            </div>
            {checkingHash && <p className="text-stone-500">Checking whether it&apos;s already registered…</p>}
            {alreadyRegistered && (
              <ErrorBox>
                This file is already registered as{" "}
                <Link className="font-medium underline" href={`/work/${existing.data}`}>
                  work #{existing.data!.toString()}
                </Link>
                . Each file can only be registered once.
              </ErrorBox>
            )}
          </div>
        )}

        <label className="block space-y-1">
          <span className="text-sm font-medium">Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Midnight Circuit (single)"
            maxLength={120}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
          {showErrors && !title.trim() && <span className="text-xs text-red-700">Title required</span>}
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium">
            Link <span className="font-normal text-stone-500">(optional: IPFS, website…)</span>
          </span>
          <input
            value={metadataURI}
            onChange={(e) => setMetadataURI(e.target.value)}
            placeholder="ipfs://… or https://…"
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={aiAssisted}
            onChange={(e) => setAiAssisted(e.target.checked)}
            className="peer sr-only"
          />
          <span className="relative h-6 w-11 rounded-full bg-stone-300 transition peer-checked:bg-violet-600 after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-5" />
          <span className="text-sm">
            <span className="font-medium">AI-assisted</span>{" "}
            <span className="text-stone-500">AI tools helped create this work</span>
          </span>
        </label>
      </Card>

      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-medium">2. Contributors and shares</h2>
          <Button
            variant="ghost"
            className="px-2 py-1"
            onClick={() => {
              const even = evenPercents(rows.length);
              setRows((rs) => rs.map((r, i) => ({ ...r, percent: even[i] })));
            }}
          >
            Split evenly
          </Button>
        </div>

        <datalist id="role-suggestions">
          {ROLE_SUGGESTIONS.map((r) => (
            <option key={r} value={r} />
          ))}
        </datalist>

        <div className="space-y-3">
          {rows.map((row, i) => {
            const e = errors[i];
            const err = {
              wallet: showErrors || row.wallet ? e.wallet : undefined,
              percent: showErrors || row.percent ? e.percent : undefined,
              role: showErrors ? e.role : undefined,
            };
            return (
              <div key={row.key} className="grid gap-2 rounded-lg bg-stone-50 p-3 sm:grid-cols-[1fr_12rem_7rem_auto]">
                <Field error={err.wallet}>
                  <input
                    aria-label={`Contributor ${i + 1} wallet`}
                    value={row.wallet}
                    onChange={(e) => update(row.key, { wallet: e.target.value })}
                    placeholder="0x… wallet address"
                    spellCheck={false}
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 font-mono text-xs"
                  />
                </Field>
                <Field error={err.role}>
                  <input
                    aria-label={`Contributor ${i + 1} role`}
                    value={row.role}
                    onChange={(e) => update(row.key, { role: e.target.value })}
                    list="role-suggestions"
                    placeholder="Role, e.g. Writer"
                    maxLength={64}
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
                  />
                </Field>
                <Field error={err.percent}>
                  <div className="relative">
                    <input
                      aria-label={`Contributor ${i + 1} share percent`}
                      value={row.percent}
                      onChange={(e) => update(row.key, { percent: e.target.value })}
                      inputMode="decimal"
                      placeholder="0"
                      className="w-full rounded-lg border border-stone-300 bg-white py-2 pl-3 pr-7 text-right text-sm"
                    />
                    <span className="absolute right-3 top-2 text-sm text-stone-400">%</span>
                  </div>
                </Field>
                <button
                  type="button"
                  aria-label={`Remove contributor ${i + 1}`}
                  disabled={rows.length === 1}
                  onClick={() => setRows((rs) => rs.filter((r) => r.key !== row.key))}
                  className="h-9 rounded-lg px-2 text-stone-400 hover:bg-red-50 hover:text-red-600 disabled:invisible"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="secondary"
            disabled={rows.length >= MAX_CONTRIBUTORS}
            onClick={() => setRows((rs) => [...rs, emptyRow()])}
          >
            + Add contributor
          </Button>
          <p className={`text-sm font-medium ${totalOk ? "text-emerald-700" : "text-amber-700"}`}>
            Total: {totalPercent}% {totalOk ? "✓" : "(must be exactly 100%)"}
          </p>
        </div>
        {rows.length >= MAX_CONTRIBUTORS && (
          <p className="text-xs text-stone-500">Maximum of {MAX_CONTRIBUTORS} contributors.</p>
        )}
      </Card>

      <div className="space-y-3">
        {!isConnected ? (
          <div className="flex items-center gap-3 text-sm text-stone-600">
            <ConnectButton /> Connect a wallet to register.
          </div>
        ) : (
          <Button type="submit" disabled={!canSubmit} loading={register.isPending} className="w-full sm:w-auto">
            {register.status === "signing"
              ? "Confirm in wallet…"
              : register.status === "confirming"
                ? "Registering…"
                : "Register work"}
          </Button>
        )}
        {isConnected && !canSubmit && !register.isPending && (
          <p className="text-xs text-stone-500">
            {!contentHash
              ? "Choose a file to fingerprint."
              : alreadyRegistered
                ? "This file is already registered."
                : !title.trim()
                  ? "Add a title."
                  : !totalOk
                    ? "Shares must add up to exactly 100%."
                    : "Fix the highlighted contributor fields."}
          </p>
        )}
        <TxFeedback tx={register} success="Registered! Opening the work page…" />
      </div>
    </form>
  );
}

function Field({ error, children }: { error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      {children}
      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  );
}
