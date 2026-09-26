# Demo script (about 2 minutes)

Live on Sepolia with three wallets. Contract: `0x7E6edc504D7e3e75307fDC8Dcb91788D52c17097`
([Etherscan](https://sepolia.etherscan.io/address/0x7E6edc504D7e3e75307fDC8Dcb91788D52c17097)).

## Cast

| Wallet | Role in the demo | Share |
| --- | --- | --- |
| Alice | Registrant, writer | 50% |
| Bob | Human collaborator, producer | 30% |
| AI tool wallet | The AI tool credited on the work (for example "AI tool: Suno") | 20% |

## Before you go on stage (10 minutes, do it the day before and again an hour before)

1. Create three MetaMask accounts and name them Alice, Bob and AI tool. Copy each address.
2. Fund each with about 0.01 Sepolia ETH from a faucet. Gas is the only cost besides the 0.001 ETH payment. Fund from Alice if faucets are rate limited.
3. Prepare a **fresh demo file** (a short text file, image or audio clip). The contract rejects a hash that is already registered, so **every rehearsal uses up a file**. Make several copies with one changed character each, and keep one untouched for the live run.
4. Open the app on Sepolia (`NEXT_PUBLIC_USE_MOCK=false`), with MetaMask connected on Sepolia.
5. Keep an Etherscan tab open on the contract address.
6. Record a backup video of a full run (see Fallback).

## The script

| Time | Who | Action | What the audience sees | Handled by |
| --- | --- | --- | --- | --- |
| 0:00 | Presenter | One sentence pitch: "Credit Ledger records who made a work, human or AI, proves it existed at a time, and splits payments automatically." | Landing page | Web UI |
| 0:15 | Alice | Register a work: choose the demo file, title, tick "AI assisted", add contributors Alice 50%, Bob 30%, AI tool wallet 20%, with roles. Confirm in MetaMask. | Work created, status "Awaiting confirmations 1/3" (Alice is auto-confirmed because she is a contributor) | Web UI (form, file hashing) + contract |
| 0:40 | Bob | Switch MetaMask to Bob, open the work, click Confirm. | 2/3 confirmed | Web UI + contract |
| 0:55 | AI tool wallet | Switch to the AI wallet, confirm from the work page or dashboard. | 3/3, status turns **Active** | Web UI + contract |
| 1:10 | Alice (or anyone) | Pay **0.001 ETH** to the work. | Split preview: Alice 0.0005, Bob 0.0003, AI tool 0.0002 ETH. Toast with a transaction link. | Web UI + contract |
| 1:25 | Bob | Open the dashboard: pending balance 0.0003 ETH. Click Withdraw. | Balance moves to Bob's wallet, pending goes to 0 | Web UI + contract |
| 1:40 | Presenter | Open the transaction link from the toast on Etherscan. Point at the `PaymentReceived` and `Withdrawn` events. Optionally open the contract's verified source tab. | Public, permanent record | Etherscan |
| 1:50 | Presenter | "Verify a file": drop the original file (match), then a different file (no match). Close with the limitations line below. | Match / No match | Web UI |

Closing line (honest): "This is a testnet prototype. It proves a file hash and its credited split existed at a
time, not that the people credited actually made it."

## Numbers to have ready

Paying 0.001 ETH (1,000,000,000,000,000 wei) with shares 50/30/20 credits exactly
0.0005 / 0.0003 / 0.0002 ETH. There is no rounding dust in this case. Any dust in other
cases goes to the first contributor.

## Fallback plan

Decide at the 10 minute mark before presenting, not while on stage.

1. **Sepolia is slow or the RPC fails.** Switch the RPC (set `NEXT_PUBLIC_RPC_URL` in `web/.env.local` to another provider) and reload. Give it one retry.
2. **Out of Sepolia ETH or the faucet is down.** Use a pre-funded wallet. Keep a spare funded account and never rely on a faucet during the demo. If gas is the only problem, do steps 1 to 3 live and show the earlier completed work as the payment and withdraw result.
3. **Wallet or MetaMask trouble.** Switch the app to **mock mode** (`NEXT_PUBLIC_USE_MOCK=true`, restart `npm run dev`). It runs the same flow in one browser with "Mock: Alice", "Mock: Bob" and "Mock: AI tool wallet". Say plainly that this is mock mode and not the chain.
4. **Everything fails.** Play the **pre-recorded video** of a real Sepolia run, and open a previously created work and its transactions on Etherscan as proof that it ran on-chain.

Always tell the audience which mode they are looking at. Do not present mock mode as live on-chain data.

## What Person 2's UI covers

Person 2's web app (`/web`) covers the register form, hashing the file in the browser, the work page with contributor list and confirm buttons, the dashboard with pending balance and Withdraw, the payment form with split preview, the transaction toast linking to Etherscan, the "Verify a file" page, mock mode and an in-app demo guide at `/demo`. See `web/README.md`. The in-app guide uses 0.01 ETH per payment; this script uses 0.001 ETH to save faucet funds, so type that amount if the field is prefilled.

Contract-side behavior (rules, split, events) is covered by 25 Foundry tests in `contracts/test`.

At the time of writing, Person 2's PRs #4 to #7 were still open, so check that the UI in your build matches this table.
