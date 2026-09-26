# Credit Ledger: submission

## Project name

Credit Ledger

## One-line pitch

An on-chain record of who contributed to a creative work, humans and AI tools alike, with automatic payment splits.

## Description (150 words)

Credit Ledger lets a creator register a work on Ethereum by its content hash, together with everyone who contributed: human collaborators and the AI tools used, each with a role and a percentage share. Every contributor confirms from their own wallet, and the work becomes active only when all of them have. Anyone can then pay the work in ETH, and the contract credits each contributor their share automatically. Contributors withdraw their balance whenever they like. The registration timestamp is set by the chain, so it cannot be backdated. A web app lets anyone check a file against the registered hash. The contract is about 200 lines of Solidity, has no admin keys and is not upgradeable. It is a hackathon prototype deployed on the Sepolia testnet, covered by 25 Foundry tests, and it has not been audited. It is built for the AI-Native Creator Economy and Digital Rights track.

## The problem

Creative work increasingly involves several people and AI tools, but credit is informal. There is no neutral record of who took part, no agreed split that everyone has actually accepted, and no easy way to prove a work existed at a given time. When money arrives, someone has to divide it by hand and everyone else has to trust them. AI tools make this worse: their role is rarely written down at all.

## How it works

1. **Register.** The registrant submits a content hash, a title, a metadata link, an "AI assisted" flag, and 1 to 10 contributors with wallet, role and share in basis points. Shares must total exactly 10,000 (100%). Each content hash can be registered only once.
2. **Confirm.** A registrant who is also a contributor is confirmed automatically. Every other contributor confirms from their own wallet. When the last one confirms, the work becomes active.
3. **Pay.** Anyone can send ETH to an active work. The contract credits each contributor `amount * share / 10000`, and any rounding remainder goes to the first contributor, so the credited total always equals the payment.
4. **Withdraw.** Contributors pull their balance with `withdraw()`. The contract never pushes ETH to contributors inside a payment, and withdraw is protected against reentrancy.

## Why Ethereum

- **Tamper-proof, timestamped provenance.** The block timestamp and the content hash are public and cannot be edited after the fact, with no company or server to trust.
- **Trustless automatic splits.** The split is fixed in code at registration. Nobody has to be trusted to divide the money correctly, and no admin can change shares afterwards.
- **Contributors confirm from their own wallets.** A credit is only binding once the credited wallet has signed for it, so nobody can be listed and paid against their will.
- **Open and composable.** The record and the ABI are public, so other tools can read them or build on them.

## Fit with Track 5: AI-Native Creator Economy and Digital Rights

| Track theme | How Credit Ledger addresses it |
| --- | --- |
| Content provenance and attribution | A content hash is registered with an on-chain timestamp, and the app can check any file against it. The "AI assisted" flag and AI tool contributors make AI involvement explicit. |
| Verifiable contribution records | Each contributor, role and share is stored on-chain and marked confirmed only after that wallet confirms. |
| Multi-party revenue sharing and automated royalty distribution | `payWork` splits every payment by the agreed shares, with exact accounting and pull withdrawals. |
| Creator payments | Anyone can pay a work directly in ETH, and contributors withdraw without an intermediary. |
| Open-source tools for creators | The contract, tests, ABI, deployment address, web app and docs are all in one public repository. |

## Deployment

- Network: Sepolia testnet (chain id 11155111)
- Contract: `0x7E6edc504D7e3e75307fDC8Dcb91788D52c17097`
- Etherscan (source code verified): https://sepolia.etherscan.io/address/0x7E6edc504D7e3e75307fDC8Dcb91788D52c17097#code
- Repository: https://github.com/lavsharma01/credit-ledger
- Live app: https://credit-ledger-olive.vercel.app/

## Limitations and next steps

Limitations:

- **Testnet only and unaudited.** This is a prototype. Do not use it with real funds.
- **A timestamp is not proof of authorship.** It shows that an address registered a hash at a time. Someone who obtains a file first can register its hash first.
- **AI tool identity is just a wallet.** Nothing on-chain proves that an AI tool was used, or that a wallet belongs to a given tool. The "AI assisted" flag is self-declared.
- **ETH only.** No stablecoins or other tokens.
- **No royalty on resale or reuse.** The contract splits payments that are sent to it. It cannot force anyone to pay, and it does not track secondary sales.
- **Fixed after registration.** Contributors and shares cannot be edited or removed, and a work cannot be cancelled. If one contributor never confirms, the work never becomes active and cannot be paid.
- **Content is off-chain.** Only the hash is stored. The metadata link is not validated or pinned.
- **Immutable.** There is no upgrade path, so a bug cannot be patched on the deployed contract.

Next steps:

- An independent audit before any mainnet use.
- ERC-20 and stablecoin payments.
- A way to invite, replace or drop a contributor before activation, and an expiry for unconfirmed works.
- Attestations (for example EAS) or signed statements from AI tool providers to back up AI credits.
- Resale and licensing hooks, for example an ERC-2981 style royalty signal for marketplaces.
- Support for L2 networks to make small payments cheaper.

## Submission checklist

- [ ] Repository: https://github.com/lavsharma01/credit-ledger
- [ ] Verified contract on Etherscan: https://sepolia.etherscan.io/address/0x7E6edc504D7e3e75307fDC8Dcb91788D52c17097#code
- [ ] Live app: https://credit-ledger-olive.vercel.app/
- [ ] Demo video: TODO_ADD_VIDEO_LINK_HERE
- [ ] Track: AI-Native Creator Economy and Digital Rights (Track 5)
