// SPDX-License-Identifier: MIT

// Modified version of the Compound Timelock, compound license:
// Copyright 2020 Compound Labs, Inc.
// Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
// 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
// 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
// 3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.


pragma solidity ^0.8.6;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

/// @notice The multisig timelock requires 2/3 sep
contract MultisigTimelock {
    using EnumerableSet for EnumerableSet.AddressSet;

    event NewDelay(uint indexed newDelay);
    event CancelTransaction(address indexed admin, bytes32 indexed txHash, address indexed target, uint value, string signature,  bytes data, uint eta);
    event ExecuteTransaction(address indexed admin, bytes32 indexed txHash, address indexed target, uint value, string signature,  bytes data, uint eta);
    event QueueTransaction(address indexed admin, bytes32 indexed txHash, address indexed target, uint value, string signature, bytes data, uint eta);

    uint public constant GRACE_PERIOD = 14 days;
    uint public constant MINIMUM_DELAY = 2 hours;
    uint public constant MAXIMUM_DELAY = 30 days;

    /// @dev Admins are immutable and injected during the contract construction. Expected to be set to 3 hardware wallets owned by separate entities.
    EnumerableSet.AddressSet admins;


    /// @dev The minimum numbers of admins that have to sign a transaction. Expected to be set to 2 out of 3.
    uint public minimumQuorum;
    
    uint public delay = 6 hours;

    /// @dev UI function that shows whether 
    mapping (bytes32 => bool) public queuedTransactions;
    mapping (bytes32 => EnumerableSet.AddressSet) queuedTransactionsEndorcements;
    mapping (bytes32 => uint256) public queuedTransactionEndorcementCounts;
    
    address initializer;
    constructor() {
        initializer = msg.sender;
    }
    
    // Initialize pattern required for sourcify verification
    function initialize(address[] memory _admins, uint _minimumQuorum) external {
        require(msg.sender == initializer, "!initializer");
        require(admins.length() == 0, "!initialized");
        require(minimumQuorum == 0, "!initialized");
        require(_admins.length > 0, "!0 admins");
        require(_minimumQuorum > 0, "!0 quorum");
        require(_admins.length >= _minimumQuorum, "!unreachable quorum");

        for(uint256 i = 0; i < _admins.length; i++) {
            admins.add(_admins[i]);
        }

        minimumQuorum = _minimumQuorum;
    }

    modifier onlyAdmin() {
        require(admins.contains(msg.sender), "!admin");
        _;
    }

    receive() external payable { }
    
    function setDelay(uint delay_) public {
        require(msg.sender == address(this), "Timelock::setDelay: Call must come from Timelock.");
        require(delay_ >= MINIMUM_DELAY, "Timelock::setDelay: Delay must exceed minimum delay.");
        require(delay_ <= MAXIMUM_DELAY, "Timelock::setDelay: Delay must not exceed maximum delay.");
        delay = delay_;

        emit NewDelay(delay);
    }

    function queueTransaction(address target, uint value, string memory signature, bytes memory data, uint eta) external onlyAdmin returns (bytes32) {
        require(eta >= getBlockTimestamp() + delay, "Timelock::queueTransaction: Estimated execution block must satisfy delay.");
        bytes32 txHash = keccak256(abi.encode(target, value, signature, data, eta));
        require(!hasEndorced(txHash, msg.sender), "!already endorced");
        queuedTransactions[txHash] = true;
        queuedTransactionsEndorcements[txHash].add(msg.sender);
        queuedTransactionEndorcementCounts[txHash]++;

        emit QueueTransaction(msg.sender, txHash, target, value, signature, data, eta);
        return txHash;
    }

    function cancelTransaction(address target, uint value, string memory signature, bytes memory data, uint eta) external onlyAdmin {
        bytes32 txHash = keccak256(abi.encode(target, value, signature, data, eta));
        require(hasEndorced(txHash, msg.sender), "!not endorced");
        queuedTransactionsEndorcements[txHash].remove(msg.sender);
        queuedTransactionEndorcementCounts[txHash]--;
        if (queuedTransactionEndorcementCounts[txHash] == 0) {
            queuedTransactions[txHash] = false;
        }

        emit CancelTransaction(msg.sender, txHash, target, value, signature, data, eta);
    }

    function executeTransaction(address target, uint value, string memory signature, bytes memory data, uint eta) external onlyAdmin payable returns (bytes memory) {
        bytes32 txHash = keccak256(abi.encode(target, value, signature, data, eta));
        require(queuedTransactionEndorcementCounts[txHash] >= minimumQuorum, "!quorum not reached");
        require(getBlockTimestamp() >= eta, "Timelock::executeTransaction: Transaction hasn't surpassed time lock.");
        require(getBlockTimestamp() <= eta + GRACE_PERIOD, "Timelock::executeTransaction: Transaction is stale.");

        queuedTransactions[txHash] = false;
        queuedTransactionEndorcementCounts[txHash] = 0; 
        for (uint256 i = 0; i < admins.length(); i++) {
            queuedTransactionsEndorcements[txHash].remove(admins.at(i));
        }

        bytes memory callData;

        if (bytes(signature).length == 0) {
            callData = data;
        } else {
            callData = abi.encodePacked(bytes4(keccak256(bytes(signature))), data);
        }

        // solium-disable-next-line security/no-call-value
        (bool success, bytes memory returnData) = target.call{value: value}(callData);
        require(success, "Timelock::executeTransaction: Transaction execution reverted.");

        emit ExecuteTransaction(msg.sender, txHash, target, value, signature, data, eta);

        return returnData;
    }

    function getBlockTimestamp() internal view returns (uint) {
        // solium-disable-next-line security/no-block-members
        return block.timestamp;
    }

    function adminAt(uint256 i) external view returns (address) {
        return admins.at(i);
    }

    function hasEndorced(bytes32 txHash, address admin) public view returns (bool) {
        return queuedTransactionsEndorcements[txHash].contains(admin);
    }
    
    function endorcerAt(bytes32 txHash, uint256 i) external view returns (address) {
        return queuedTransactionsEndorcements[txHash].at(i);
    }
    
    function adminLength() external view returns (uint256) {
        return admins.length();
    }
}