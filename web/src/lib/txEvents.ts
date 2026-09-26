import type { Hash } from "viem";
import type { TxStatus } from "./types";

export type TxEvent = { label: string; status: TxStatus; txHash?: Hash; error?: string };

type Listener = (event: TxEvent) => void;
const listeners = new Set<Listener>();

/** Tiny pub/sub so the global toast can show every transaction without prop drilling. */
export function emitTxEvent(event: TxEvent) {
  listeners.forEach((l) => l(event));
}

export function onTxEvent(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
