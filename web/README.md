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
