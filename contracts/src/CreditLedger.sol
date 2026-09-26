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

    uint256 private _nextWorkId = 1;

    mapping(uint256 => Work) private _works;
    mapping(uint256 => Contributor[]) private _contributors;
    /// @dev workId => wallet => (index into _contributors[workId]) + 1; 0 means "not a contributor"
    mapping(uint256 => mapping(address => uint256)) private _contributorSlot;
    mapping(bytes32 => uint256) private _workIdByHash;
    mapping(address => uint256) private _pendingWithdrawal;

    /// @notice Registers a new creative work along with its contributors and their shares.
    /// @dev If the caller is one of the contributors, they are auto-confirmed. If every
    ///      contributor ends up confirmed, the work is activated immediately.
    function registerWork(
        bytes32 contentHash,
        string calldata title,
        string calldata metadataURI,
        bool aiAssisted,
        address[] calldata wallets,
        string[] calldata roles,
        uint16[] calldata sharesBps
    ) external returns (uint256 workId) {
        uint256 count = wallets.length;
        if (count == 0) revert EmptyContributors();
        if (count > MAX_CONTRIBUTORS) revert TooManyContributors();
        if (roles.length != count || sharesBps.length != count) revert LengthMismatch();
        if (_workIdByHash[contentHash] != 0) revert HashAlreadyRegistered();

        uint256 shareSum;
        for (uint256 i = 0; i < count; i++) {
            address wallet = wallets[i];
            if (wallet == address(0)) revert ZeroAddress();
            if (sharesBps[i] == 0) revert ZeroShare();
            for (uint256 j = 0; j < i; j++) {
                if (wallets[j] == wallet) revert DuplicateWallet();
            }
            shareSum += sharesBps[i];
        }
        if (shareSum != BPS_TOTAL) revert SharesNot100Percent();

        workId = _nextWorkId++;
        _workIdByHash[contentHash] = workId;

        Work storage work = _works[workId];
        work.registrant = msg.sender;
        work.contentHash = contentHash;
        work.title = title;
        work.metadataURI = metadataURI;
        work.registeredAt = uint64(block.timestamp);
        work.aiAssisted = aiAssisted;
        work.contributorCount = uint8(count);

        Contributor[] storage contributors = _contributors[workId];
        uint8 confirmedCount;
        for (uint256 i = 0; i < count; i++) {
            bool confirmed = wallets[i] == msg.sender;
            if (confirmed) confirmedCount++;
            contributors.push(Contributor({wallet: wallets[i], role: roles[i], shareBps: sharesBps[i], confirmed: confirmed}));
            _contributorSlot[workId][wallets[i]] = i + 1;
        }
        work.confirmedCount = confirmedCount;

        emit WorkRegistered(workId, msg.sender, contentHash);

        if (confirmedCount == work.contributorCount) {
            work.active = true;
            emit WorkActivated(workId);
        }
    }

    /// @notice Confirms the caller's participation as a contributor to a work.
    /// @dev Activates the work and emits WorkActivated when this is the last confirmation needed.
    function confirmContribution(uint256 workId) external {
        Work storage work = _works[workId];
        if (work.registeredAt == 0) revert WorkNotFound();

        uint256 slot = _contributorSlot[workId][msg.sender];
        if (slot == 0) revert NotAContributor();

        Contributor storage contributor = _contributors[workId][slot - 1];
        if (contributor.confirmed) revert AlreadyConfirmed();

        contributor.confirmed = true;
        work.confirmedCount++;
        emit ContributionConfirmed(workId, msg.sender);

        if (work.confirmedCount == work.contributorCount) {
            work.active = true;
            emit WorkActivated(workId);
        }
    }

    /// @notice Pays into an active work, crediting each contributor's pending withdrawal
    ///         according to their share. Never sends ETH directly — pull payments only.
    function payWork(uint256 workId) external payable {
        Work storage work = _works[workId];
        if (!work.active) revert WorkNotActive();
        if (msg.value == 0) revert ZeroPayment();

        Contributor[] storage contributors = _contributors[workId];
        uint256 count = contributors.length;
        uint256 distributed;
        for (uint256 i = 0; i < count; i++) {
            uint256 amount = (msg.value * contributors[i].shareBps) / BPS_TOTAL;
            distributed += amount;
            _pendingWithdrawal[contributors[i].wallet] += amount;
        }

        uint256 dust = msg.value - distributed;
        if (dust > 0) {
            _pendingWithdrawal[contributors[0].wallet] += dust;
        }

        work.totalPaid += msg.value;
        emit PaymentReceived(workId, msg.sender, msg.value);
    }

    /// @notice Withdraws the caller's accumulated pending balance.
    function withdraw() external nonReentrant {
        uint256 amount = _pendingWithdrawal[msg.sender];
        if (amount == 0) revert NothingToWithdraw();

        _pendingWithdrawal[msg.sender] = 0;

        (bool ok,) = msg.sender.call{value: amount}("");
        if (!ok) revert TransferFailed();

        emit Withdrawn(msg.sender, amount);
    }

    /// @notice Returns the total number of registered works.
    function workCount() external view returns (uint256) {
        return _nextWorkId - 1;
    }

    /// @notice Returns the full record for a work.
    function getWork(uint256 workId) external view returns (Work memory) {
        Work memory work = _works[workId];
        if (work.registeredAt == 0) revert WorkNotFound();
        return work;
    }

    /// @notice Returns the contributors for a work.
    function getContributors(uint256 workId) external view returns (Contributor[] memory) {
        if (_works[workId].registeredAt == 0) revert WorkNotFound();
        return _contributors[workId];
    }

    /// @notice Returns the workId registered for a content hash, or 0 if none.
    function workIdByHash(bytes32 contentHash) external view returns (uint256) {
        return _workIdByHash[contentHash];
    }

    /// @notice Returns the pending withdrawal balance for an account.
    function pendingWithdrawal(address account) external view returns (uint256) {
        return _pendingWithdrawal[account];
    }
}
