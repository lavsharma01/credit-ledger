import { getAddress, isAddress, type Address, type Hash } from "viem";
import { foundry, sepolia } from "wagmi/chains";
import { deployments } from "@/contracts/deployments";

// NEXT_PUBLIC_* vars must be read literally so Next.js can inline them.
export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

const chainKey = process.env.NEXT_PUBLIC_CHAIN === "anvil" ? "anvil" : "sepolia";
export const TARGET_CHAIN = chainKey === "anvil" ? foundry : sepolia;
export const OTHER_CHAIN = chainKey === "anvil" ? sepolia : foundry;

export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || undefined;

function resolveAddress(): Address | undefined {
  const candidate =
    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || deployments[chainKey]?.address || "";
  return isAddress(candidate) ? getAddress(candidate) : undefined;
}

/** Undefined until the contract is deployed on the target chain (mock mode ignores it). */
export const CONTRACT_ADDRESS = resolveAddress();

// Etherscan links are built from the chain's explorer + address/tx hash.
const explorer = TARGET_CHAIN.blockExplorers?.default.url;

/** Block explorer link for a tx, or undefined on chains without an explorer (Anvil, mock). */
export function txUrl(hash: Hash): string | undefined {
  if (USE_MOCK || !explorer) return undefined;
  return `${explorer}/tx/${hash}`;
}

export function addressUrl(address: Address): string | undefined {
  if (USE_MOCK || !explorer) return undefined;
  return `${explorer}/address/${address}`;
}

/** Explorer link for the deployed CreditLedger contract. */
export const CONTRACT_URL = CONTRACT_ADDRESS ? addressUrl(CONTRACT_ADDRESS) : undefined;
