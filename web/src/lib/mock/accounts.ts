import type { Address } from "viem";

/** Demo personas for mock mode. These are well-known Anvil dev addresses (no real funds). */
export const MOCK_ACCOUNTS: { label: string; address: Address }[] = [
  { label: "Mock: Alice (writer)", address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" },
  { label: "Mock: Bob (producer)", address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC" },
  { label: "Mock: AI tool wallet", address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906" },
];
