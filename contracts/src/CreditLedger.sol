// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title CreditLedger
/// @notice Records contributors to a creative work, proves existence at a timestamp,
///         and splits incoming payments among contributors via pull payments.
contract CreditLedger is ReentrancyGuard {
    uint256 public constant BPS_TOTAL = 10000;
    uint256 public constant MAX_CONTRIBUTORS = 10;

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

    event WorkRegistered(uint256 indexed workId, address indexed registrant, bytes32 indexed contentHash);
    event ContributionConfirmed(uint256 indexed workId, address indexed wallet);
    event WorkActivated(uint256 indexed workId);
    event PaymentReceived(uint256 indexed workId, address indexed payer, uint256 amount);
    event Withdrawn(address indexed account, uint256 amount);

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

    /// @notice Registers a new creative work with its contributors.
    function registerWork(
        bytes32 contentHash,
        string calldata title,
        string calldata metadataURI,
        bool aiAssisted,
        address[] calldata wallets,
        string[] calldata roles,
        uint16[] calldata sharesBps
    ) external returns (uint256 workId) {}

    /// @notice Confirms the caller's participation as a contributor to a work.
    function confirmContribution(uint256 workId) external {}

    /// @notice Pays into an active work, crediting each contributor's pending withdrawal.
    function payWork(uint256 workId) external payable {}

    /// @notice Withdraws the caller's accumulated pending balance.
    function withdraw() external nonReentrant {}

    /// @notice Returns the total number of registered works.
    function workCount() external view returns (uint256) {}

    /// @notice Returns the full record for a work.
    function getWork(uint256 workId) external view returns (Work memory) {}

    /// @notice Returns the contributors for a work.
    function getContributors(uint256 workId) external view returns (Contributor[] memory) {}

    /// @notice Returns the workId registered for a content hash, or 0 if none.
    function workIdByHash(bytes32 contentHash) external view returns (uint256) {}

    /// @notice Returns the pending withdrawal balance for an account.
    function pendingWithdrawal(address account) external view returns (uint256) {}
}
