// Read-only smoke test against the deployed CreditLedger (no wallet needed).
// Usage: node scripts/smoke-read.mjs [sepolia|anvil]
// Optional: RPC_URL=https://... to override the chain's default public RPC.
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createPublicClient, formatEther, http } from "viem";
import { foundry, sepolia } from "viem/chains";

const here = dirname(fileURLToPath(import.meta.url));
const shared = resolve(here, "../../shared");
const abi = JSON.parse(readFileSync(resolve(shared, "CreditLedger.abi.json"), "utf8"));
const deployments = JSON.parse(readFileSync(resolve(shared, "deployments.json"), "utf8"));

const key = process.argv[2] === "anvil" ? "anvil" : "sepolia";
const chain = key === "anvil" ? foundry : sepolia;
const address = deployments[key]?.address;
if (!address) {
  console.error(`No ${key} address in shared/deployments.json`);
  process.exit(1);
}

const rpc = process.env.RPC_URL || chain.rpcUrls.default.http[0];
const client = createPublicClient({ chain, transport: http(rpc) });
const read = (functionName, args = []) => client.readContract({ address, abi, functionName, args });

console.log(`chain    ${chain.name} (${chain.id})`);
console.log(`rpc      ${rpc}`);
console.log(`address  ${address}`);

const [chainId, code] = await Promise.all([client.getChainId(), client.getCode({ address })]);
console.log(`rpc chainId ${chainId}, contract bytecode ${code ? `${(code.length - 2) / 2} bytes` : "MISSING"}`);
if (!code) process.exit(1);

console.log(`BPS_TOTAL ${await read("BPS_TOTAL")}, MAX_CONTRIBUTORS ${await read("MAX_CONTRIBUTORS")}`);
const count = await read("workCount");
console.log(`workCount ${count}`);

if (count > 0n) {
  const work = await read("getWork", [1n]);
  const contributors = await read("getContributors", [1n]);
  console.log("getWork(1)", {
    ...work,
    registeredAt: new Date(Number(work.registeredAt) * 1000).toISOString(),
    totalPaid: `${formatEther(work.totalPaid)} ETH`,
  });
  console.log("getContributors(1)", contributors);
}

// A missing work must revert with the WorkNotFound custom error (what the UI decodes).
try {
  await read("getWork", [count + 1n]);
  console.log("getWork(count+1) unexpectedly succeeded");
} catch (err) {
  const name = err.walk?.((e) => e.data?.errorName)?.data?.errorName;
  console.log(`getWork(${count + 1n}) reverted with: ${name ?? err.shortMessage}`);
}
