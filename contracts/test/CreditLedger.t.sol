// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {CreditLedger} from "../src/CreditLedger.sol";

contract MaliciousContributor {
    CreditLedger public ledger;
    bool public attacked;

    constructor(CreditLedger _ledger) {
        ledger = _ledger;
    }

    receive() external payable {
        if (!attacked) {
            attacked = true;
            ledger.withdraw();
        }
    }

    function withdraw() external {
        ledger.withdraw();
    }
}

contract CreditLedgerTest is Test {
    CreditLedger internal ledger;

    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");
    address internal carol = makeAddr("carol");
    address internal payer = makeAddr("payer");

    function setUp() public {
        ledger = new CreditLedger();
        vm.deal(payer, 100 ether);
    }

    function _singleContributorArrays(address wallet)
        internal
        pure
        returns (address[] memory wallets, string[] memory roles, uint16[] memory shares)
    {
        wallets = new address[](1);
        wallets[0] = wallet;
        roles = new string[](1);
        roles[0] = "author";
        shares = new uint16[](1);
        shares[0] = 10000;
    }

    // ---------------------------------------------------------------------
    // registerWork — success paths
    // ---------------------------------------------------------------------

    function test_registerWork_success() public {
        (address[] memory wallets, string[] memory roles, uint16[] memory shares) = _singleContributorArrays(alice);

        vm.expectEmit(true, true, true, true);
        emit CreditLedger.WorkRegistered(1, address(this), keccak256("work1"));
        uint256 workId = ledger.registerWork(keccak256("work1"), "Title", "ipfs://meta", false, wallets, roles, shares);

        assertEq(workId, 1);
        assertEq(ledger.workCount(), 1);
        assertEq(ledger.workIdByHash(keccak256("work1")), 1);

        CreditLedger.Work memory work = ledger.getWork(workId);
        assertEq(work.registrant, address(this));
        assertEq(work.contentHash, keccak256("work1"));
        assertEq(work.title, "Title");
        assertEq(work.metadataURI, "ipfs://meta");
        assertFalse(work.aiAssisted);
        assertEq(work.contributorCount, 1);
    }

    function test_registerWork_autoConfirmsRegistrantAndActivates() public {
        (address[] memory wallets, string[] memory roles, uint16[] memory shares) = _singleContributorArrays(alice);

        vm.prank(alice);
        uint256 workId = ledger.registerWork(keccak256("solo"), "Solo", "uri", false, wallets, roles, shares);

        CreditLedger.Work memory work = ledger.getWork(workId);
        assertTrue(work.active);
        assertEq(work.confirmedCount, 1);

        CreditLedger.Contributor[] memory contributors = ledger.getContributors(workId);
        assertTrue(contributors[0].confirmed);
    }

    function test_registerWork_notAllConfirmedNotActive() public {
        address[] memory wallets = new address[](2);
        wallets[0] = alice;
        wallets[1] = bob;
        string[] memory roles = new string[](2);
        roles[0] = "writer";
        roles[1] = "illustrator";
        uint16[] memory shares = new uint16[](2);
        shares[0] = 6000;
        shares[1] = 4000;

        uint256 workId = ledger.registerWork(keccak256("collab"), "Collab", "uri", true, wallets, roles, shares);

        CreditLedger.Work memory work = ledger.getWork(workId);
        assertFalse(work.active);
        assertEq(work.confirmedCount, 0);
    }

    // ---------------------------------------------------------------------
    // registerWork — revert cases
    // ---------------------------------------------------------------------

    function test_registerWork_revertsEmptyContributors() public {
        address[] memory wallets = new address[](0);
        string[] memory roles = new string[](0);
        uint16[] memory shares = new uint16[](0);

        vm.expectRevert(CreditLedger.EmptyContributors.selector);
        ledger.registerWork(keccak256("x"), "t", "u", false, wallets, roles, shares);
    }

    function test_registerWork_revertsTooManyContributors() public {
        address[] memory wallets = new address[](11);
        string[] memory roles = new string[](11);
        uint16[] memory shares = new uint16[](11);
        for (uint256 i = 0; i < 11; i++) {
            wallets[i] = address(uint160(i + 1));
            roles[i] = "role";
            shares[i] = 1;
        }

        vm.expectRevert(CreditLedger.TooManyContributors.selector);
        ledger.registerWork(keccak256("x"), "t", "u", false, wallets, roles, shares);
    }

    function test_registerWork_revertsLengthMismatch() public {
        address[] memory wallets = new address[](2);
        wallets[0] = alice;
        wallets[1] = bob;
        string[] memory roles = new string[](1);
        roles[0] = "writer";
        uint16[] memory shares = new uint16[](2);
        shares[0] = 5000;
        shares[1] = 5000;

        vm.expectRevert(CreditLedger.LengthMismatch.selector);
        ledger.registerWork(keccak256("x"), "t", "u", false, wallets, roles, shares);
    }

    function test_registerWork_revertsZeroShare() public {
        address[] memory wallets = new address[](2);
        wallets[0] = alice;
        wallets[1] = bob;
        string[] memory roles = new string[](2);
        roles[0] = "writer";
        roles[1] = "editor";
        uint16[] memory shares = new uint16[](2);
        shares[0] = 10000;
        shares[1] = 0;

        vm.expectRevert(CreditLedger.ZeroShare.selector);
        ledger.registerWork(keccak256("x"), "t", "u", false, wallets, roles, shares);
    }

    function test_registerWork_revertsSharesNot100Percent() public {
        address[] memory wallets = new address[](2);
        wallets[0] = alice;
        wallets[1] = bob;
        string[] memory roles = new string[](2);
        roles[0] = "writer";
        roles[1] = "editor";
        uint16[] memory shares = new uint16[](2);
        shares[0] = 5000;
        shares[1] = 4000;

        vm.expectRevert(CreditLedger.SharesNot100Percent.selector);
        ledger.registerWork(keccak256("x"), "t", "u", false, wallets, roles, shares);
    }

    function test_registerWork_revertsZeroAddress() public {
        address[] memory wallets = new address[](1);
        wallets[0] = address(0);
        string[] memory roles = new string[](1);
        roles[0] = "writer";
        uint16[] memory shares = new uint16[](1);
        shares[0] = 10000;

        vm.expectRevert(CreditLedger.ZeroAddress.selector);
        ledger.registerWork(keccak256("x"), "t", "u", false, wallets, roles, shares);
    }

    function test_registerWork_revertsDuplicateWallet() public {
        address[] memory wallets = new address[](2);
        wallets[0] = alice;
        wallets[1] = alice;
        string[] memory roles = new string[](2);
        roles[0] = "writer";
        roles[1] = "editor";
        uint16[] memory shares = new uint16[](2);
        shares[0] = 5000;
        shares[1] = 5000;

        vm.expectRevert(CreditLedger.DuplicateWallet.selector);
        ledger.registerWork(keccak256("x"), "t", "u", false, wallets, roles, shares);
    }

    function test_registerWork_revertsHashAlreadyRegistered() public {
        (address[] memory wallets, string[] memory roles, uint16[] memory shares) = _singleContributorArrays(alice);
        ledger.registerWork(keccak256("dup"), "t", "u", false, wallets, roles, shares);

        vm.expectRevert(CreditLedger.HashAlreadyRegistered.selector);
        ledger.registerWork(keccak256("dup"), "t2", "u2", false, wallets, roles, shares);
    }

    // ---------------------------------------------------------------------
    // confirmContribution
    // ---------------------------------------------------------------------

    function _registerTwoPartyWork() internal returns (uint256 workId) {
        address[] memory wallets = new address[](2);
        wallets[0] = alice;
        wallets[1] = bob;
        string[] memory roles = new string[](2);
        roles[0] = "writer";
        roles[1] = "illustrator";
        uint16[] memory shares = new uint16[](2);
        shares[0] = 7000;
        shares[1] = 3000;

        workId = ledger.registerWork(keccak256("two-party"), "Two Party", "uri", false, wallets, roles, shares);
    }

    function test_confirmContribution_revertsWorkNotFound() public {
        vm.expectRevert(CreditLedger.WorkNotFound.selector);
        ledger.confirmContribution(999);
    }

    function test_confirmContribution_revertsNotAContributor() public {
        uint256 workId = _registerTwoPartyWork();

        vm.prank(carol);
        vm.expectRevert(CreditLedger.NotAContributor.selector);
        ledger.confirmContribution(workId);
    }

    function test_confirmContribution_flowAndActivation() public {
        uint256 workId = _registerTwoPartyWork();

        vm.prank(alice);
        ledger.confirmContribution(workId);
        assertFalse(ledger.getWork(workId).active);

        vm.expectEmit(true, false, false, true);
        emit CreditLedger.WorkActivated(workId);
        vm.prank(bob);
        ledger.confirmContribution(workId);

        assertTrue(ledger.getWork(workId).active);
    }

    function test_confirmContribution_revertsAlreadyConfirmed() public {
        uint256 workId = _registerTwoPartyWork();

        vm.startPrank(alice);
        ledger.confirmContribution(workId);
        vm.expectRevert(CreditLedger.AlreadyConfirmed.selector);
        ledger.confirmContribution(workId);
        vm.stopPrank();
    }

    // ---------------------------------------------------------------------
    // payWork
    // ---------------------------------------------------------------------

    function test_payWork_revertsWorkNotActive() public {
        uint256 workId = _registerTwoPartyWork();

        vm.prank(payer);
        vm.expectRevert(CreditLedger.WorkNotActive.selector);
        ledger.payWork{value: 1 ether}(workId);
    }

    function test_payWork_revertsZeroPayment() public {
        (address[] memory wallets, string[] memory roles, uint16[] memory shares) = _singleContributorArrays(alice);
        vm.prank(alice);
        uint256 workId = ledger.registerWork(keccak256("zp"), "t", "u", false, wallets, roles, shares);

        vm.expectRevert(CreditLedger.ZeroPayment.selector);
        ledger.payWork{value: 0}(workId);
    }

    function test_payWork_unevenSplitWithRoundingDust() public {
        // Three contributors with shares that don't divide 1 wei evenly.
        address[] memory wallets = new address[](3);
        wallets[0] = alice;
        wallets[1] = bob;
        wallets[2] = carol;
        string[] memory roles = new string[](3);
        roles[0] = "a";
        roles[1] = "b";
        roles[2] = "c";
        uint16[] memory shares = new uint16[](3);
        shares[0] = 3334;
        shares[1] = 3333;
        shares[2] = 3333;

        vm.prank(alice);
        uint256 workId = ledger.registerWork(keccak256("dust"), "t", "u", false, wallets, roles, shares);
        vm.prank(bob);
        ledger.confirmContribution(workId);
        vm.prank(carol);
        ledger.confirmContribution(workId);

        uint256 amount = 1 wei;
        vm.prank(payer);
        ledger.payWork{value: amount}(workId);

        uint256 total = ledger.pendingWithdrawal(alice) + ledger.pendingWithdrawal(bob) + ledger.pendingWithdrawal(carol);
        assertEq(total, amount);
        // With 1 wei, floor division gives everyone 0 except the dust recipient (alice, index 0).
        assertEq(ledger.pendingWithdrawal(alice), 1);
        assertEq(ledger.pendingWithdrawal(bob), 0);
        assertEq(ledger.pendingWithdrawal(carol), 0);
    }

    function test_payWork_multiplePaymentsAccumulate() public {
        (address[] memory wallets, string[] memory roles, uint16[] memory shares) = _singleContributorArrays(alice);
        vm.prank(alice);
        uint256 workId = ledger.registerWork(keccak256("accum"), "t", "u", false, wallets, roles, shares);

        vm.prank(payer);
        ledger.payWork{value: 1 ether}(workId);
        vm.prank(payer);
        ledger.payWork{value: 2 ether}(workId);

        assertEq(ledger.pendingWithdrawal(alice), 3 ether);
        assertEq(ledger.getWork(workId).totalPaid, 3 ether);
    }

    function test_payWork_emitsPaymentReceived() public {
        (address[] memory wallets, string[] memory roles, uint16[] memory shares) = _singleContributorArrays(alice);
        vm.prank(alice);
        uint256 workId = ledger.registerWork(keccak256("emit-pay"), "t", "u", false, wallets, roles, shares);

        vm.expectEmit(true, true, false, true);
        emit CreditLedger.PaymentReceived(workId, payer, 1 ether);
        vm.prank(payer);
        ledger.payWork{value: 1 ether}(workId);
    }

    // ---------------------------------------------------------------------
    // withdraw
    // ---------------------------------------------------------------------

    function test_withdraw_success() public {
        (address[] memory wallets, string[] memory roles, uint16[] memory shares) = _singleContributorArrays(alice);
        vm.prank(alice);
        uint256 workId = ledger.registerWork(keccak256("wd"), "t", "u", false, wallets, roles, shares);

        vm.prank(payer);
        ledger.payWork{value: 1 ether}(workId);

        uint256 balBefore = alice.balance;
        vm.prank(alice);
        ledger.withdraw();

        assertEq(alice.balance, balBefore + 1 ether);
        assertEq(ledger.pendingWithdrawal(alice), 0);
    }

    function test_withdraw_revertsNothingToWithdraw() public {
        vm.prank(alice);
        vm.expectRevert(CreditLedger.NothingToWithdraw.selector);
        ledger.withdraw();
    }

    function test_withdraw_revertsOnDoubleWithdraw() public {
        (address[] memory wallets, string[] memory roles, uint16[] memory shares) = _singleContributorArrays(alice);
        vm.prank(alice);
        uint256 workId = ledger.registerWork(keccak256("dw"), "t", "u", false, wallets, roles, shares);

        vm.prank(payer);
        ledger.payWork{value: 1 ether}(workId);

        vm.prank(alice);
        ledger.withdraw();

        vm.prank(alice);
        vm.expectRevert(CreditLedger.NothingToWithdraw.selector);
        ledger.withdraw();
    }

    function test_withdraw_reentrancyAttemptFails() public {
        MaliciousContributor attacker = new MaliciousContributor(ledger);

        address[] memory wallets = new address[](1);
        wallets[0] = address(attacker);
        string[] memory roles = new string[](1);
        roles[0] = "attacker";
        uint16[] memory shares = new uint16[](1);
        shares[0] = 10000;

        vm.prank(address(attacker));
        uint256 workId = ledger.registerWork(keccak256("reentrancy"), "t", "u", false, wallets, roles, shares);

        vm.prank(payer);
        ledger.payWork{value: 1 ether}(workId);

        // The attacker's receive() hook tries to reenter withdraw(); nonReentrant blocks the
        // inner call, which makes the outer ETH transfer fail, and the whole withdrawal reverts —
        // so the attacker cannot walk away with more than their legitimate share, and their
        // pending balance is left untouched by the failed attempt.
        vm.expectRevert(CreditLedger.TransferFailed.selector);
        attacker.withdraw();

        assertEq(address(attacker).balance, 0);
        assertEq(ledger.pendingWithdrawal(address(attacker)), 1 ether);
    }

    // ---------------------------------------------------------------------
    // Fuzz
    // ---------------------------------------------------------------------

    function testFuzz_payWork_creditedSumAlwaysEqualsMsgValue(uint16 shareA, uint256 value) public {
        shareA = uint16(bound(uint256(shareA), 1, 9999));
        uint16 shareB = uint16(10000 - shareA);
        value = bound(value, 1, 1000 ether);

        address[] memory wallets = new address[](2);
        wallets[0] = alice;
        wallets[1] = bob;
        string[] memory roles = new string[](2);
        roles[0] = "a";
        roles[1] = "b";
        uint16[] memory shares = new uint16[](2);
        shares[0] = shareA;
        shares[1] = shareB;

        vm.prank(alice);
        uint256 workId = ledger.registerWork(keccak256(abi.encode(shareA, value)), "t", "u", false, wallets, roles, shares);
        vm.prank(bob);
        ledger.confirmContribution(workId);

        vm.deal(payer, value);
        vm.prank(payer);
        ledger.payWork{value: value}(workId);

        assertEq(ledger.pendingWithdrawal(alice) + ledger.pendingWithdrawal(bob), value);
    }
}
