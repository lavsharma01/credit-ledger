"use client";

import { useEffect, useRef, useState } from "react";
import { USE_MOCK } from "@/config/env";
import { onTxEvent, type TxEvent } from "@/lib/txEvents";
import { ExplorerLink, Spinner } from "./ui";

type Toast = TxEvent & { id: number };

const HIDE_AFTER_MS = { success: 6_000, error: 9_000 } as const;

/** Bottom-right toast for every transaction started through the contract hooks. */
export function TxToaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);
  // A tx is identified by its label until it finishes, so one toast updates in place.
  const openByLabel = useRef(new Map<string, number>());

  useEffect(
    () =>
      onTxEvent((event) => {
        let id = openByLabel.current.get(event.label);
        if (id === undefined) {
          id = nextId.current++;
          openByLabel.current.set(event.label, id);
        }
        const toastId = id;
        setToasts((ts) => [...ts.filter((t) => t.id !== toastId), { ...event, id: toastId }]);

        if (event.status === "success" || event.status === "error") {
          openByLabel.current.delete(event.label);
          setTimeout(() => setToasts((ts) => ts.filter((t) => t.id !== toastId)), HIDE_AFTER_MS[event.status]);
        }
      }),
    [],
  );

  if (toasts.length === 0) return null;
  return (
    <div aria-live="polite" className="fixed inset-x-4 bottom-4 z-50 flex flex-col items-end gap-2 sm:left-auto">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`w-full max-w-sm rounded-xl border bg-white p-4 text-sm shadow-lg ${
            t.status === "error" ? "border-red-200" : t.status === "success" ? "border-emerald-200" : "border-stone-200"
          }`}
        >
          <div className="flex items-start gap-3">
            <span className="mt-0.5">
              {t.status === "success" ? (
                <span className="text-emerald-600">✓</span>
              ) : t.status === "error" ? (
                <span className="text-red-600">✕</span>
              ) : (
                <Spinner className="text-indigo-600" />
              )}
            </span>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="font-medium">{t.label}</p>
              <p className="text-stone-600">
                {t.status === "signing" && "Confirm in your wallet…"}
                {t.status === "confirming" &&
                  `Transaction sent. Waiting for it to be mined${USE_MOCK ? "" : " (~15 s)"}…`}
                {t.status === "success" && (USE_MOCK ? "Done (mock transaction)." : "Confirmed on-chain.")}
                {t.status === "error" && t.error}
              </p>
              {t.txHash && <ExplorerLink hash={t.txHash} />}
            </div>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => setToasts((ts) => ts.filter((x) => x.id !== t.id))}
              className="text-stone-400 hover:text-stone-700"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
