// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DDoSMitigation {
    struct RequestLog {
        uint256 requestCount;
        uint256 lastRequestTime;
    }

    struct Attacker {
        string ip;
        string message;
        uint256 timestamp;
    }

    mapping(address => RequestLog) public requestLogs;
    mapping(address => bool) public blockedAddresses;
    mapping(address => Attacker) public attackers;  // Store attacker details

    uint256 public maxRequestsPerMinute = 10;
    uint256 public blockDuration = 10 minutes;

    // Event for logging blocked addresses
    event AddressBlocked(address indexed user, string ip, string message, uint256 timestamp);

    // Check if address is blocked
    modifier notBlocked() {
        require(!blockedAddresses[msg.sender], "Your address is blocked due to DDoS attack");
        _;
    }

    // Handle a user request (e.g., a message request)
    function handleRequest(string memory _ip, string memory _message) external notBlocked {
        RequestLog storage log = requestLogs[msg.sender];

        uint256 currentTime = block.timestamp;

        // Reset request count if last request was more than 1 minute ago
        if (currentTime > log.lastRequestTime + 1 minutes) {
            log.requestCount = 0;
        }

        log.lastRequestTime = currentTime;
        log.requestCount++;

        if (log.requestCount > maxRequestsPerMinute) {
            // Block the address if rate limit exceeded
            blockedAddresses[msg.sender] = true;
            attackers[msg.sender] = Attacker(_ip, _message, currentTime);
            emit AddressBlocked(msg.sender, _ip, _message, currentTime);
        }
    }

    // Function to unblock an address (could be called by admin)
    function unblockAddress(address user) external {
        blockedAddresses[user] = false;
    }

    // Fetch attacker details
    function getAttackerDetails(address attacker) public view returns (string memory, string memory, uint256) {
        require(blockedAddresses[attacker], "Address is not blocked");
        Attacker memory att = attackers[attacker];
        return (att.ip, att.message, att.timestamp);
    }
}
