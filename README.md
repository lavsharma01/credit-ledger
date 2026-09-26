# Credit Ledger

Credit Ledger records who contributed to a creative work — humans and AI tools alike —
proves the work existed at a point in time, and automatically splits incoming payments
among its contributors according to agreed shares.

Built for the **AI-Native Creator Economy & Digital Rights** track.

## How it works

1. A creator registers a work on-chain with a content hash (proof it existed at a
   timestamp), metadata, and a list of contributors with wallet addresses, roles
   (e.g. "writer", "illustrator", "AI model"), and percentage shares.
2. Each contributor confirms their participation. Once everyone has confirmed, the
   work becomes active.
3. Anyone can pay into an active work. The contract credits each contributor's share
   automatically using a pull-payment pattern.
4. Contributors withdraw their accumulated balance whenever they choose.

## Repo layout

- `/contracts` — Solidity smart contracts, Foundry project (Person 1)
- `/web` — frontend (Person 2)
- `/shared` — ABI and deployment addresses, generated from `/contracts` (Person 1)
- `/docs` — specs and design docs, including `docs/INTERFACE.md`

## Team workflow

- `main` only changes through pull requests — no direct pushes.
- **Person 1** owns `/contracts` and `/shared`.
- **Person 2** owns `/web`.
- Neither person edits the other's folder.
- Any change to the contract interface must be agreed in `docs/INTERFACE.md` first,
  then implemented in `/contracts` and `/shared` together in the same PR.

## Web

Next.js + wagmi frontend in `/web`. Full details are in [`web/README.md`](web/README.md).

```bash
cd web
npm install
cp .env.example .env.local   # NEXT_PUBLIC_USE_MOCK=true for demo data, false for the real contract
npm run dev                  # http://localhost:3000
```

- **Mock mode** (`NEXT_PUBLIC_USE_MOCK=true`) runs the whole flow in the browser with demo
  wallets. It needs no deployment and no MetaMask.
- **Sepolia** (`NEXT_PUBLIC_USE_MOCK=false`) reads the address from `shared/deployments.json`
  and needs MetaMask on Sepolia. Set `NEXT_PUBLIC_CHAIN=anvil` to use a local Anvil node instead.
- The 2-minute demo click path is on the app's **Demo guide** page (`/demo`).

## Contracts

### Build

```bash
cd contracts
forge build
```

### Test

```bash
cd contracts
forge test
```

### Deploy

Copy `contracts/.env.example` to `contracts/.env` and fill in `SEPOLIA_RPC_URL` and
`PRIVATE_KEY` (never commit this file).

Local Anvil:

```bash
anvil
# in another terminal
cd contracts
forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast
```

Sepolia:

```bash
cd contracts
forge script script/Deploy.s.sol --rpc-url $SEPOLIA_RPC_URL --broadcast
```

Add `--verify` (with an `ETHERSCAN_API_KEY` env var set) if you also want to verify
the source on Etherscan.

After each deployment, the address is written to `shared/deployments.json` and the
ABI is regenerated at `shared/CreditLedger.abi.json`.

### Security notes

- Pull payments only — the contract never pushes ETH to contributors; they withdraw
  their own balance via `withdraw()`.
- `withdraw()` follows checks-effects-interactions and is guarded by OpenZeppelin's
  `ReentrancyGuard`.
- No admin keys or privileged roles — nobody can alter a work's contributors or
  shares after registration.
- No upgradeability / no proxies — the deployed bytecode is immutable.
