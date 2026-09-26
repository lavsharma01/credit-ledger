# Credit Ledger: web

Next.js (App Router, TypeScript, Tailwind) frontend for the `CreditLedger` contract,
using wagmi + viem + TanStack Query. Supports Sepolia (11155111) and local Anvil (31337)
with injected wallets (MetaMask).

## Run it

```bash
cd web
npm install          # also syncs the ABI/addresses from ../shared (see below)
cp .env.example .env.local
npm run dev          # http://localhost:3000
```

### Environment (`web/.env.local`, never committed)

| Variable | Default | Meaning |
| --- | --- | --- |
| `NEXT_PUBLIC_USE_MOCK` | `false` | `true` = in-memory fake contract, no deployment or MetaMask needed |
| `NEXT_PUBLIC_CHAIN` | `sepolia` | `sepolia` or `anvil`; the network the app targets |
| `NEXT_PUBLIC_RPC_URL` | public RPC | Optional RPC URL for the target chain |
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | from `shared/deployments.json` | Optional address override |

Restart `npm run dev` after changing `.env.local`.

## Mock mode

With `NEXT_PUBLIC_USE_MOCK=true`, the app serves three seeded works from an in-memory
store (`src/lib/mock/store.ts`) that enforces the same rules and throws the same custom
errors as the real contract. The **Connect wallet** menu lists demo wallets
("Mock: Alice", "Mock: Bob", "Mock: AI tool wallet"), so you can switch identities and
run the whole register, confirm, pay, withdraw flow in one browser. State persists in
localStorage; use **Reset demo data** in the yellow banner to start over.

## Running against Sepolia

The contract is live on Sepolia at `0x7E6edc504D7e3e75307fDC8Dcb91788D52c17097`
([Etherscan](https://sepolia.etherscan.io/address/0x7E6edc504D7e3e75307fDC8Dcb91788D52c17097)).
This is a **testnet prototype**: the contract is unaudited and uses free test ETH only.

1. In `web/.env.local`: `NEXT_PUBLIC_USE_MOCK=false` (optionally `NEXT_PUBLIC_RPC_URL=<your Sepolia RPC>`;
   by default reads fall back across public RPCs).
2. `npm run dev`, connect MetaMask, and approve the **Switch to Sepolia** prompt if it appears.
3. Optional checks that need no wallet: `node scripts/smoke-read.mjs` (address, ABI, reads) and
   `node scripts/smoke-errors.mjs [workId]` (simulates every revert and checks it has a friendly
   message).

For local Anvil: run `anvil`, deploy with the Foundry script, and set `NEXT_PUBLIC_CHAIN=anvil`.
Then import an Anvil dev key into MetaMask and add the network (RPC `http://127.0.0.1:8545`,
chain id 31337).

## Demo (2 minutes)

The full click path is on the in-app **Demo guide** page (`/demo`) and in `docs/DEMO_SCRIPT.md`.
It uses three MetaMask accounts, **Alice**, **Bob** and **AI tool**, each funded with about
0.01 Sepolia ETH, because each one pays gas for its own action. Use a fresh file for every run,
since a file can only be registered once.

1. **Alice** registers "Demo Song": Alice Writer 50%, Bob Producer 30%, AI tool wallet
   "AI tool: Suno" 20%. The work shows *Awaiting confirmations 1/3*.
2. **Bob** confirms on the work page. The **AI tool** wallet confirms from its Dashboard. The
   work turns **Active**.
3. Alice pays **0.001 ETH**. The preview shows 0.0005 / 0.0003 / 0.0002, and the toast links
   to Etherscan.
4. **Bob** opens Dashboard and clicks **Withdraw** (0.0003 ETH).
5. Finish with **Verify a file**: the original file gives ✓ Match, any other file gives ✕ No match.

In mock mode, the three accounts are "Mock: Alice / Bob / AI tool wallet" in the Connect menu.

## Deploying on Vercel

Import the repo in Vercel with **Root Directory = `web`**. Keep **"Include files outside the
root directory in the Build Step"** enabled (the default). `npm install` then runs
`scripts/sync-contracts.mjs`, which reads `../shared`. Environment variables:

| Deployment | Variables |
| --- | --- |
| Live (Sepolia) | `NEXT_PUBLIC_USE_MOCK=false`, `NEXT_PUBLIC_CHAIN=sepolia`, optional `NEXT_PUBLIC_RPC_URL` |
| Fallback (mock) | `NEXT_PUBLIC_USE_MOCK=true` |

`NEXT_PUBLIC_*` values are baked in at build time, so redeploy after changing them.

## Contract ABI and address

`/shared` is owned by the contracts team, and Turbopack can't import files outside
`web/`. So `scripts/sync-contracts.mjs` copies `../shared/CreditLedger.abi.json` and
`../shared/deployments.json` into typed modules in `src/contracts/` (gitignored). It runs
automatically on `npm install`, `npm run dev` and `npm run build`. After pulling a new
deployment while the dev server is running, run `npm run sync-contracts` (or restart dev).

## Code layout

- `src/hooks/`: **all contract access**. `useWorks`, `useWork`, `useWorkIdByHash`,
  `usePendingWithdrawal`, `useRegisterWork`, `useConfirm`, `usePay`, `useWithdraw`.
  Each hook picks mock or chain internally, so pages never know which mode they're in.
  Write hooks return `{ <action>, status, txHash, error, isPending, reset }`. `error` is
  already a friendly sentence.
- `src/lib/errors.ts`: maps the contract's custom errors (and wallet/RPC errors) to
  friendly messages. Raw hex is never shown.
- `src/lib/mock/`: mock contract and demo wallets.
- `src/config/`: env parsing and the wagmi config.
