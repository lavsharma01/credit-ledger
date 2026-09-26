"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import type { Hash } from "viem";
import { txUrl, USE_MOCK } from "@/config/env";
import type { TxState, Work } from "@/lib/types";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-stone-200 bg-white p-5 shadow-sm ${className}`}>
      {children}
    </section>
  );
}

export function AiBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-800">
      ✦ AI-assisted
    </span>
  );
}

export function StatusBadge({ work }: { work: Work }) {
  return work.active ? (
    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
      Active
    </span>
  ) : (
    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
      Awaiting confirmations {work.confirmedCount}/{work.contributorCount}
    </span>
  );
}

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent align-[-2px] ${className}`}
    />
  );
}

export function Button({
  children,
  variant = "primary",
  loading,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  loading?: boolean;
}) {
  const styles = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700",
    secondary: "border border-stone-300 bg-white text-stone-800 hover:bg-stone-100",
    ghost: "text-stone-600 hover:bg-stone-100",
  }[variant];
  return (
    <button
      type="button"
      {...props}
      disabled={props.disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${styles} ${className}`}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-stone-300 p-8 text-center">
      <p className="font-medium text-stone-700">{title}</p>
      {children && <div className="mt-2 text-sm text-stone-500">{children}</div>}
    </div>
  );
}

export function ErrorBox({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
      {children}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-stone-200 ${className}`} />;
}

/** Inline status line for a write hook: wallet prompt, mining, success or error. */
export function TxFeedback({ tx, success }: { tx: TxState; success?: ReactNode }) {
  if (tx.status === "idle") return null;
  if (tx.status === "error") return <ErrorBox>{tx.error}</ErrorBox>;
  return (
    <p className="flex flex-wrap items-center gap-2 text-sm text-stone-600">
      {tx.status === "signing" && (
        <>
          <Spinner /> Confirm the transaction in your wallet…
        </>
      )}
      {tx.status === "confirming" && (
        <>
          <Spinner /> Waiting for the transaction to be mined{USE_MOCK ? "" : " (usually ~15 s on Sepolia)"}…
        </>
      )}
      {tx.status === "success" && <span className="text-emerald-700">✓ {success ?? "Done!"}</span>}
      {tx.txHash && <ExplorerLink hash={tx.txHash} />}
    </p>
  );
}

export function ExplorerLink({ hash }: { hash: Hash }) {
  const url = txUrl(hash);
  if (!url) return null;
  return (
    <a href={url} target="_blank" rel="noreferrer" className="text-indigo-600 underline">
      View on explorer ↗
    </a>
  );
}

export function CopyText({ text, display }: { text: string; display?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      title="Copy"
      onClick={() => {
        navigator.clipboard?.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        });
      }}
      className="break-all text-left font-mono text-xs text-stone-600 hover:text-stone-900"
    >
      {display ?? text} <span className="text-stone-400">{copied ? "✓ copied" : "⧉"}</span>
    </button>
  );
}

export function WorkLink({ id, children }: { id: bigint; children: ReactNode }) {
  return (
    <Link href={`/work/${id}`} className="hover:underline">
      {children}
    </Link>
  );
}
