# CreditLedger Interface

This is the agreed interface for the `CreditLedger` contract. Any change to this
spec must be agreed here first, then implemented in `/contracts` and `/shared`
together in the same PR.

Solidity ^0.8.24, no external upgradeable proxies, OpenZeppelin ReentrancyGuard allowed.

## Constants

- `BPS_TOTAL = 10000`
- `MAX_CONTRIBUTORS = 10`
- `workId`s start at 1.

## Structs

```solidity
struct Contributor {
    address wallet;
    string role;
    uint16 shareBps;
    bool confirmed;
}

struct Work {
    address registrant;
    bytes32 contentHash;
    string title;
    string metadataURI;
    uint64 registeredAt;
    bool aiAssisted;
    bool active;
    uint8 confirmedCount;
    uint8 contributorCount;
    uint256 totalPaid;
}
```

## Functions

### `registerWork`

```solidity
function registerWork(
    bytes32 contentHash,
    string calldata title,
    string calldata metadataURI,
    bool aiAssisted,
    address[] calldata wallets,
    string[] calldata roles,
    uint16[] calldata sharesBps
) external returns (uint256 workId)
```

Rules:
- 1 to 10 contributors; array lengths equal.
- Each share > 0; shares sum to exactly 10000.
- No zero address; no duplicate wallets.
- `contentHash` not already registered.
- If `msg.sender` is one of the contributors, that contributor is auto-confirmed.
- If all contributors are confirmed at registration, the work is immediately active.
- Emits `WorkRegistered`.

### `confirmContribution`

```solidity
function confirmContribution(uint256 workId) external
```

Only an unconfirmed contributor of that work may call this. When the last one
confirms, the work becomes active and `WorkActivated` is emitted.

### `payWork`

```solidity
function payWork(uint256 workId) external payable
```

Work must be active and `msg.value > 0`. Credits each contributor's
`pendingWithdrawal += msg.value * shareBps / 10000`. Any rounding dust goes to
the first contributor so the credited total always equals `msg.value`. Adds to
`totalPaid`. Emits `PaymentReceived`. Uses pull payments only — never sends ETH
to contributors inside `payWork`.

### `withdraw`

```solidity
function withdraw() external
```

Pays out the caller's `pendingWithdrawal`. Follows checks-effects-interactions
and is `nonReentrant`. Emits `Withdrawn`. Reverts if nothing to withdraw.

## Views

```solidity
function workCount() external view returns (uint256)
function getWork(uint256 workId) external view returns (Work memory)
function getContributors(uint256 workId) external view returns (Contributor[] memory)
function workIdByHash(bytes32 contentHash) external view returns (uint256)
function pendingWithdrawal(address account) external view returns (uint256)
```

`workIdByHash` returns 0 if there is no work for that hash.

## Events

```solidity
event WorkRegistered(uint256 indexed workId, address indexed registrant, bytes32 indexed contentHash);
event ContributionConfirmed(uint256 indexed workId, address indexed wallet);
event WorkActivated(uint256 indexed workId);
event PaymentReceived(uint256 indexed workId, address indexed payer, uint256 amount);
event Withdrawn(address indexed account, uint256 amount);
```

## Custom errors

No revert strings — all reverts use these custom errors:

```solidity
error EmptyContributors();
error TooManyContributors();
error LengthMismatch();
error ZeroShare();
error SharesNot100Percent();
error ZeroAddress();
error DuplicateWallet();
error HashAlreadyRegistered();
error WorkNotFound();
error NotAContributor();
error AlreadyConfirmed();
error WorkNotActive();
error ZeroPayment();
error NothingToWithdraw();
error TransferFailed();
```
