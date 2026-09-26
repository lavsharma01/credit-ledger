"use client";

import { useEffect, useRef, useState } from "react";
import { useConnect, useConnection, useConnectors, useDisconnect } from "wagmi";
import { USE_MOCK } from "@/config/env";
import { friendlyError } from "@/lib/errors";
import { shortAddress } from "@/lib/format";

export function ConnectButton() {
  const { address, connector, isConnected, isConnecting, isReconnecting } = useConnection();
  const connectors = useConnectors();
  const connect = useConnect();
  const disconnect = useDisconnect();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // close the menu on outside click
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const choose = async (index: number) => {
    setOpen(false);
    if (isConnected) await disconnect.mutateAsync();
    connect.mutate({ connector: connectors[index] });
  };

  const busy = isConnecting || isReconnecting || connect.isPending;
  const label =
    isConnected && address ? shortAddress(address) : busy ? "Connecting…" : "Connect wallet";
  // With a single injected wallet in real mode, skip the menu.
  const direct = !USE_MOCK && !isConnected && connectors.length === 1;

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => (direct ? choose(0) : setOpen((o) => !o))}
        disabled={busy}
        className={
          isConnected
            ? "rounded-full border border-stone-300 bg-white px-4 py-1.5 font-mono text-sm hover:bg-stone-100"
            : "rounded-full bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        }
      >
        {label}
      </button>

      {connect.error && !open && (
        <p className="absolute right-0 top-full z-20 mt-1 w-64 rounded-md bg-red-50 p-2 text-xs text-red-700 shadow">
          {friendlyError(connect.error)}
        </p>
      )}

      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 w-64 overflow-hidden rounded-lg border border-stone-200 bg-white text-sm shadow-lg">
          {isConnected && (
            <div className="border-b border-stone-100 px-3 py-2 text-xs text-stone-500">
              Connected via {connector?.name}
            </div>
          )}
          {connectors.map((c, i) => (
            <button
              key={c.uid}
              type="button"
              onClick={() => choose(i)}
              className="block w-full px-3 py-2 text-left hover:bg-stone-100"
            >
              {c.uid === connector?.uid ? "✓ " : ""}
              {c.name}
            </button>
          ))}
          {isConnected && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                disconnect.mutate();
              }}
              className="block w-full border-t border-stone-100 px-3 py-2 text-left text-red-600 hover:bg-red-50"
            >
              Disconnect
            </button>
          )}
        </div>
      )}
    </div>
  );
}
