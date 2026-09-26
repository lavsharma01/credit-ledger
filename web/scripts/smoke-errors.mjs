// Simulates (eth_call, no signing, no gas) every failure path against the deployed
// CreditLedger and checks that each revert decodes to a custom error that
// src/lib/errors.ts has a friendly message for.
// Usage: node scripts/smoke-errors.mjs [workId]   (RPC_URL=... to override the RPC)
// Pass the id of an Active work (after the demo flow) to also check
// NotAContributor, AlreadyConfirmed, HashAlreadyRegistered and ZeroPayment.
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createPublicClient, http, keccak256, toHex } from "viem";
import { sepolia } from "viem/chains";

const here = dirname(fileURLToPath(import.meta.url));
const shared = resolve(here, "../../shared");
const abi = JSON.parse(readFileSync(resolve(shared, "CreditLedger.abi.json"), "utf8"));
const address = JSON.parse(readFileSync(resolve(shared, "deployments.json"), "utf8")).sepolia.address;
const friendly = readFileSync(resolve(here, "../src/lib/errors.ts"), "utf8");
const client = createPublicClient({ chain: sepolia, transport: http(process.env.RPC_URL) });

// Arbitrary addresses used only as eth_call "from"; nobody signs anything.
const STRANGER = "0x000000000000000000000000000000000000dEaD";
const A = "0x1111111111111111111111111111111111111111";
const B = "0x2222222222222222222222222222222222222222";
const freshHash = keccak256(toHex(`smoke-${Date.now()}`));

let failures = 0;
async function expect(label, expected, call) {
  let got;
  try {
    await client.simulateContract({ address, abi, ...call });
    got = "(no revert)";
  } catch (err) {
    got = err.walk?.((e) => e.data?.errorName)?.data?.errorName ?? `undecoded: ${err.shortMessage}`;
  }
  const hasMessage = new RegExp(`\\b${got}:`).test(friendly);
  const ok = got === expected && hasMessage;
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}: ${got}${hasMessage ? "" : " (no friendly message!)"}`);
}

const reg = (wallets, shares, hash = freshHash) => ({
  functionName: "registerWork",
  account: A,
  args: [hash, "smoke", "", true, wallets, wallets.map(() => "role"), shares],
});

await expect("shares add to 90%", "SharesNot100Percent", reg([A, B], [5000, 4000]));
await expect("duplicate wallet", "DuplicateWallet", reg([A, A], [5000, 5000]));
await expect("zero share", "ZeroShare", reg([A, B], [10000, 0]));
await expect("no contributors", "EmptyContributors", reg([], []));
await expect("pay unknown work", "WorkNotActive", {
  functionName: "payWork", account: STRANGER, args: [999_999n], value: 1n,
});
await expect("confirm unknown work", "WorkNotFound", {
  functionName: "confirmContribution", account: STRANGER, args: [999_999n],
});
await expect("withdraw with nothing pending", "NothingToWithdraw", {
  functionName: "withdraw", account: STRANGER,
});

const workId = process.argv[2] ? BigInt(process.argv[2]) : undefined;
if (workId) {
  const work = await client.readContract({ address, abi, functionName: "getWork", args: [workId] });
  const contributors = await client.readContract({ address, abi, functionName: "getContributors", args: [workId] });
  await expect(`confirm work #${workId} as non-contributor`, "NotAContributor", {
    functionName: "confirmContribution", account: STRANGER, args: [workId],
  });
  const confirmed = contributors.find((c) => c.confirmed);
  if (confirmed) {
    await expect(`confirm work #${workId} twice`, "AlreadyConfirmed", {
      functionName: "confirmContribution", account: confirmed.wallet, args: [workId],
    });
  }
  await expect(`register work #${workId}'s file again`, "HashAlreadyRegistered", reg([A], [10000], work.contentHash));
  if (work.active) {
    await expect(`pay work #${workId} with 0 ETH`, "ZeroPayment", {
      functionName: "payWork", account: STRANGER, args: [workId], value: 0n,
    });
  } else {
    await expect(`pay work #${workId} before it is active`, "WorkNotActive", {
      functionName: "payWork", account: STRANGER, args: [workId], value: 1n,
    });
  }
}

console.log(failures ? `\n${failures} check(s) failed` : "\nAll checks passed");
process.exit(failures ? 1 : 0);
