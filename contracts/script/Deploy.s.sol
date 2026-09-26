// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {CreditLedger} from "../src/CreditLedger.sol";

/// @notice Deploys CreditLedger. Reads the deployer key from the PRIVATE_KEY env var.
contract Deploy is Script {
    function run() external returns (CreditLedger ledger) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);
        ledger = new CreditLedger();
        vm.stopBroadcast();

        console.log("CreditLedger deployed at:", address(ledger));
    }
}
