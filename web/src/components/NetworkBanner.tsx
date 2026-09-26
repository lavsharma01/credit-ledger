"use client";

import type { ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useConnection, useSwitchChain } from "wagmi";
import { CONTRACT_ADDRESS, TARGET_CHAIN, USE_MOCK } from "@/config/env";
import { QUERY_ROOT } from "@/hooks/internal";
import { friendlyError } from "@/lib/errors";
import { resetMockStore } from "@/lib/mock/store";

export function NetworkBanner() {
  const { isConnected, chainId } = useConnection();
  const switchChain = useSwitchChain();
  const queryClient = useQueryClient();

  if (USE_MOCK) {
    return (
      <Banner tone="amber">
        <span>
          <b>Mock mode:</b> demo data stored in this browser, no real transactions. Pick a
          &quot;Mock&quot; wallet from Connect wallet.
        </span>
        <button
          type="button"
          className="underline"
          onClick={() => {
            resetMockStore();
            queryClient.invalidateQueries({ queryKey: QUERY_ROOT });
          }}
        >
          Reset demo data
        </button>
      </Banner>
    );
  }

  if (isConnected && chainId !== TARGET_CHAIN.id) {
    return (
      <Banner tone="red">
        <span>
          Your wallet is on the wrong network. Credit Ledger runs on <b>{TARGET_CHAIN.name}</b>.
        </span>
        <button
          type="button"
          disabled={switchChain.isPending}
          onClick={() => switchChain.mutate({ chainId: TARGET_CHAIN.id })}
          className="rounded-full bg-red-600 px-3 py-1 font-medium text-white hover:bg-red-700 disabled:opacity-60"
        >
          {switchChain.isPending ? "Switching…" : `Switch to ${TARGET_CHAIN.name}`}
        </button>
        {switchChain.error && <span className="w-full">{friendlyError(switchChain.error)}</span>}
      </Banner>
    );
  }

  if (!CONTRACT_ADDRESS) {
    return (
      <Banner tone="red">
        <span>
          CreditLedger isn&apos;t deployed on {TARGET_CHAIN.name} yet (shared/deployments.json has
          no address). Run with NEXT_PUBLIC_USE_MOCK=true to use demo data.
        </span>
      </Banner>
    );
  }

  return null;
}

function Banner({ tone, children }: { tone: "amber" | "red"; children: ReactNode }) {
  const styles =
    tone === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-900"
      : "border-red-200 bg-red-50 text-red-900";
  return (
    <div className={`border-b ${styles}`}>
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 text-sm">
        {children}
      </div>
    </div>
  );
}
