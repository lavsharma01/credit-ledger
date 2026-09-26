import { createConfig, fallback, http, injected, mock, type CreateConnectorFn } from "wagmi";
import { foundry, sepolia } from "wagmi/chains";
import { MOCK_ACCOUNTS } from "@/lib/mock/accounts";
import { OTHER_CHAIN, RPC_URL, TARGET_CHAIN, USE_MOCK } from "./env";

// In mock mode, each demo persona is its own connector so you can switch
// "wallets" from the connect menu without MetaMask. defaultConnected lets wagmi
// restore the last-used persona after a page reload.
const mockConnectors: CreateConnectorFn[] = MOCK_ACCOUNTS.map(({ address, label }, i) => {
  const base = mock({ accounts: [address], features: { defaultConnected: true, reconnect: true } });
  return (config) => ({ ...base(config), id: `mock-${i}`, name: label });
});

// Public Sepolia RPCs rate-limit or go down, so reads fall back through several.
// NEXT_PUBLIC_RPC_URL (if set) is tried first, then the chain's default.
const SEPOLIA_FALLBACK_RPCS = ["https://ethereum-sepolia-rpc.publicnode.com"];

// JSON-RPC batching keeps "read every work" to one HTTP request (Anvil has no multicall3).
const rpc = (chainId: number) => {
  const urls = [
    chainId === TARGET_CHAIN.id ? RPC_URL : undefined,
    undefined, // the chain's default public RPC
    ...(chainId === sepolia.id ? SEPOLIA_FALLBACK_RPCS : []),
  ];
  const unique = urls.filter((u, i) => urls.indexOf(u) === i);
  return fallback(unique.map((url) => http(url, { batch: true })));
};

export const wagmiConfig = createConfig({
  // The first chain is the default for disconnected reads and mock connectors.
  chains: [TARGET_CHAIN, OTHER_CHAIN],
  connectors: USE_MOCK ? [...mockConnectors, injected()] : [injected()],
  transports: {
    [sepolia.id]: rpc(sepolia.id),
    [foundry.id]: rpc(foundry.id),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
