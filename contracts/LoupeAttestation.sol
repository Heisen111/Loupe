// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract LoupeAttestation {

    // ── Structs ────────────────────────────────────────────────────────────────

    struct AuditRecord {
        address auditor;
        uint256 timestamp;
        string  contractAddress;
        string  overallRisk;
        uint8   riskScore;
        bool    exists;
    }

    // ── State ──────────────────────────────────────────────────────────────────

    mapping(bytes32 => AuditRecord) private _audits;

    // ── Events ─────────────────────────────────────────────────────────────────

    event AuditRecorded(
        bytes32 indexed auditHash,
        address indexed auditor,
        string          contractAddress,
        string          overallRisk,
        uint8           riskScore,
        uint256         timestamp
    );

    // ── Write ──────────────────────────────────────────────────────────────────

    function recordAudit(
        bytes32        auditHash,
        string calldata contractAddress,
        string calldata overallRisk,
        uint8          riskScore
    ) external {
        require(!_audits[auditHash].exists, "LoupeAttestation: hash already recorded");

        _audits[auditHash] = AuditRecord({
            auditor:         msg.sender,
            timestamp:       block.timestamp,
            contractAddress: contractAddress,
            overallRisk:     overallRisk,
            riskScore:       riskScore,
            exists:          true
        });

        emit AuditRecorded(
            auditHash,
            msg.sender,
            contractAddress,
            overallRisk,
            riskScore,
            block.timestamp
        );
    }

    // ── Read ───────────────────────────────────────────────────────────────────

    function getAudit(bytes32 auditHash)
        external
        view
        returns (AuditRecord memory)
    {
        require(_audits[auditHash].exists, "LoupeAttestation: record not found");
        return _audits[auditHash];
    }

    function auditExists(bytes32 auditHash)
        external
        view
        returns (bool)
    {
        return _audits[auditHash].exists;
    }
}