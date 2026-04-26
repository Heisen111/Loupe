import React, { useState } from 'react'
import { motion } from 'framer-motion'
import type { AuditReport, RiskLevel } from '../types/audit'

// ── Sample data ────────────────────────────────────────────────────────────────

const SAMPLE_1: AuditReport = {
  overall_risk: 'Critical',
  risk_score: 78,
  contract_summary:
    'VulnerableBank is a simple ETH deposit/withdraw contract with a classic reentrancy vulnerability in the withdraw function. The contract updates the user balance after the external call, allowing an attacker to recursively drain all funds before the balance is zeroed.',
  vulnerabilities: [
    {
      id: 'V-001',
      title: 'Reentrancy in withdraw()',
      severity: 'critical',
      category: 'Reentrancy',
      location: 'VulnerableBank.sol:withdraw() L34',
      description:
        `The withdraw function sends ETH via call{value}() before updating the sender's balance. An attacker can deploy a contract whose receive() function calls withdraw() recursively, draining the entire contract balance.`,
      attack_scenario:
        'Attacker deposits 1 ETH. Calls withdraw(). Before balance is zeroed, receive() re-enters withdraw(). Repeats until contract is drained.',
      recommendation:
        'Apply checks-effects-interactions: zero the balance before the external call, or use OpenZeppelin ReentrancyGuard.',
      master_hacker_note:
        'Flash loan the initial deposit to amplify the drain to the full contract TVL in a single transaction.',
    },
    {
      id: 'V-002',
      title: 'tx.origin used for authentication',
      severity: 'high',
      category: 'Authentication',
      location: 'VulnerableBank.sol:transfer() L52',
      description:
        'The transfer() function uses tx.origin instead of msg.sender for ownership checks. A malicious intermediary contract can forward calls while the original signer remains the apparent owner.',
      attack_scenario:
        'Phish the owner into calling a malicious contract. The malicious contract calls transfer() — tx.origin is still the owner, so the check passes.',
      recommendation: 'Replace tx.origin with msg.sender for all authorization checks.',
      master_hacker_note:
        'Pair this with a fake airdrop UI targeting the owner wallet for a low-effort phishing drain.',
    },
    {
      id: 'V-003',
      title: 'Unchecked return value on external call',
      severity: 'high',
      category: 'Unchecked Returns',
      location: 'VulnerableBank.sol:emergencyWithdraw() L71',
      description:
        'emergencyWithdraw() uses a low-level call() but ignores the boolean return value. A failed transfer silently passes, leaving funds locked or allowing inconsistent state.',
      attack_scenario:
        'If the recipient is a contract that reverts on receive, the call fails silently and the balance is still zeroed, permanently locking the funds.',
      recommendation:
        'Always check the return value of low-level calls: require(success, "Transfer failed").',
      master_hacker_note:
        'Deploy a griefing contract as the emergency recipient to permanently lock all funds in the contract.',
    },
    {
      id: 'V-004',
      title: 'Missing event on critical state change',
      severity: 'medium',
      category: 'Events / Monitoring',
      location: 'VulnerableBank.sol:setOwner() L18',
      description:
        'setOwner() silently updates the owner address with no event emission. Off-chain monitoring systems and indexers cannot detect ownership changes.',
      attack_scenario:
        'An attacker who gains owner access can quietly rotate to a new key before executing a drain, leaving no on-chain trail.',
      recommendation: 'Emit OwnershipTransferred(oldOwner, newOwner) on every ownership change.',
      master_hacker_note:
        'Silence is stealth. No event means no alert, giving maximum time before detection.',
    },
  ],
  phase2_findings: {
    assumptions_violated: [
      'Assumes external calls are safe before state updates',
      'Assumes tx.origin reliably identifies the authorized user',
      'Assumes the emergency recipient will always accept ETH',
    ],
    edge_cases: [
      'withdraw(0) passes all checks, wastes gas, emits no event',
      'Direct ETH sends via receive() are tracked nowhere in the balance mapping',
      'Integer wrap not possible in 0.8.x but unchecked blocks are not used here',
    ],
    combined_attack_vectors: [
      'Reentrancy + flash loan: borrow 500 ETH, deposit, drain full TVL, repay in one tx',
      'tx.origin phish + ownership rotation: silently take ownership then drain via emergencyWithdraw',
    ],
    mev_risks: [
      'Reentrancy attack is atomic — MEV searchers can copy and front-run',
      'Large deposits visible in mempool — bots can sandwich deposit+withdraw sequences',
    ],
    overall_hacker_assessment:
      'This contract would be drained within minutes of mainnet deployment. Two independent critical paths (reentrancy and tx.origin auth) both lead to total fund loss. The reentrancy is textbook but the tx.origin vulnerability requires slightly more sophistication — a phishing UI. Combined with the unchecked return value, there are three independent paths to total loss.',
  },
  positive_findings: [
    'Uses Solidity 0.8.x — built-in overflow/underflow protection',
    'Emits Deposit and Withdrawal events for basic off-chain monitoring',
  ],
  audit_metadata: {
    total_vulnerabilities: 4,
    critical_count: 1,
    high_count: 2,
    medium_count: 1,
    low_count: 0,
    informational_count: 0,
  },
}

const SAMPLE_2: AuditReport = {
  overall_risk: 'Medium',
  risk_score: 35,
  contract_summary:
    'SimpleToken is a basic ERC-20 implementation with mint and burn functionality gated behind an owner check. The contract is well-structured and uses safe math, but has a centralization risk from the uncapped mint function and two minor informational findings.',
  vulnerabilities: [
    {
      id: 'V-001',
      title: 'Centralized mint — unlimited supply inflation',
      severity: 'medium',
      category: 'Centralization Risk',
      location: 'SimpleToken.sol:mint() L29',
      description:
        'The owner can mint unlimited tokens at any time with no cap, timelock, or multi-sig requirement. A compromised or malicious owner can inflate supply to zero value.',
      attack_scenario:
        'Owner key compromised or malicious. Attacker mints max uint256 tokens, dumps on DEX, crashes price to zero in a single block.',
      recommendation:
        'Implement a max supply cap, a timelock delay, or migrate ownership to a Gnosis Safe multi-sig before adding liquidity.',
      master_hacker_note:
        'No timelock means no warning for holders. A rug can be executed in a single block with no on-chain warning.',
    },
    {
      id: 'V-002',
      title: 'Missing zero-address check in transfer()',
      severity: 'low',
      category: 'Input Validation',
      location: 'SimpleToken.sol:transfer() L44',
      description:
        'transfer() does not check that the recipient is not address(0). Tokens sent to address(0) are permanently burned without emitting a Burn event, making supply tracking inaccurate.',
      attack_scenario:
        'User accidentally passes address(0). Tokens are silently lost with no recovery path.',
      recommendation:
        "Add require(to != address(0), 'ERC20: transfer to zero address').",
      master_hacker_note:
        'Not directly exploitable for profit but can grief token holders by front-running their transactions with a zero-address redirect.',
    },
    {
      id: 'V-003',
      title: 'No event emitted on ownership transfer',
      severity: 'low',
      category: 'Events / Monitoring',
      location: 'SimpleToken.sol:transferOwnership() L18',
      description:
        'transferOwnership() silently updates the owner with no event. Off-chain monitoring cannot detect admin key rotation.',
      attack_scenario:
        'No direct exploit. Silently hides admin key changes from the community and monitoring tools.',
      recommendation: 'Emit OwnershipTransferred(oldOwner, newOwner) on every ownership change.',
      master_hacker_note:
        'Useful for a slow-rug: quietly rotate to attacker key weeks before executing the mint+dump.',
    },
  ],
  phase2_findings: {
    assumptions_violated: [
      'Assumes the owner private key is always secure and the owner is always trustworthy',
      'Assumes users will never pass address(0) as a recipient',
    ],
    edge_cases: [
      'mint(0) succeeds silently with no state change and no event',
      'burn() on an account with zero balance throws a generic underflow panic with no clear message',
      'approve() followed by transferFrom() has the standard ERC-20 race condition for allowance changes',
    ],
    combined_attack_vectors: [
      'Compromised owner: mint max supply + DEX dump in a single flashbot bundle for atomic execution',
    ],
    mev_risks: [
      'Large mint transactions are visible in the mempool — arbitrage bots will front-run any resulting DEX sell',
    ],
    overall_hacker_assessment:
      'No path to direct exploit without owner key compromise. The centralization risk is the dominant threat vector. For a community token this is a significant trust assumption. Safe for controlled or internal use — not recommended for permissionless DeFi without a timelock and multi-sig.',
  },
  positive_findings: [
    'Solidity 0.8.20 — safe math built in, no overflow risk',
    'Clean separation of mint and burn logic with clear access control',
    'Full ERC-20 interface implemented including allowance and approve',
    'No external calls anywhere — reentrancy risk is zero',
  ],
  audit_metadata: {
    total_vulnerabilities: 3,
    critical_count: 0,
    high_count: 0,
    medium_count: 1,
    low_count: 2,
    informational_count: 0,
  },
}

// ── Risk colors ────────────────────────────────────────────────────────────────

const RISK_COLORS: Record<RiskLevel, { bar: string; badge: string; badgeBg: string; badgeBorder: string }> = {
  Critical: { bar: '#E04B4B', badge: '#E04B4B', badgeBg: 'rgba(224,75,75,0.1)',  badgeBorder: 'rgba(224,75,75,0.25)'  },
  High:     { bar: '#EF9F27', badge: '#EF9F27', badgeBg: 'rgba(239,159,39,0.1)', badgeBorder: 'rgba(239,159,39,0.25)' },
  Medium:   { bar: '#C9973A', badge: '#C9973A', badgeBg: 'rgba(201,151,58,0.1)', badgeBorder: 'rgba(201,151,58,0.25)' },
  Low:      { bar: '#639922', badge: '#639922', badgeBg: 'rgba(99,153,34,0.1)',  badgeBorder: 'rgba(99,153,34,0.25)'  },
  Minimal:  { bar: '#639922', badge: '#639922', badgeBg: 'rgba(99,153,34,0.1)',  badgeBorder: 'rgba(99,153,34,0.25)'  },
}

const SEVERITY_PILLS = [
  { key: 'critical_count', label: 'C', color: '#E04B4B', bg: 'rgba(224,75,75,0.1)'  },
  { key: 'high_count',     label: 'H', color: '#EF9F27', bg: 'rgba(239,159,39,0.1)' },
  { key: 'medium_count',   label: 'M', color: '#C9973A', bg: 'rgba(201,151,58,0.1)' },
  { key: 'low_count',      label: 'L', color: '#639922', bg: 'rgba(99,153,34,0.1)'  },
] as const

// ── Card ───────────────────────────────────────────────────────────────────────

interface SampleCardProps {
  report: AuditReport
  filename: string
  delay: number
  onLoad: () => void
}

function SampleCard({ report, filename, delay, onLoad }: SampleCardProps) {
  const [hovered, setHovered] = useState(false)
  const colors = RISK_COLORS[report.overall_risk] ?? RISK_COLORS.Medium

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay }}
      onClick={onLoad}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: hovered ? 'rgba(240,235,225,0.05)' : 'rgba(240,235,225,0.03)',
        border: `0.5px solid ${hovered ? 'rgba(240,235,225,0.15)' : 'rgba(240,235,225,0.08)'}`,
        borderRadius: '10px',
        padding: '20px',
        cursor: 'pointer',
        transition: 'background-color 0.2s ease, border-color 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
    >
      {/* Top row — filename + risk badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <span
          style={{
            color: '#F0EBE1',
            fontSize: '13px',
            fontWeight: 500,
            fontFamily: "'JetBrains Mono','Fira Code',monospace",
          }}
        >
          {filename}
        </span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            backgroundColor: colors.badgeBg,
            border: `0.5px solid ${colors.badgeBorder}`,
            borderRadius: '4px',
            padding: '2px 8px',
            fontSize: '11px',
            fontWeight: 600,
            color: colors.badge,
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {report.overall_risk}
        </span>
      </div>

      {/* Mini score bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
          <span style={{ color: 'rgba(240,235,225,0.3)', fontSize: '11px' }}>Risk score</span>
          <span style={{ color: colors.bar, fontSize: '11px', fontFamily: "'JetBrains Mono',monospace" }}>
            {report.risk_score} / 100
          </span>
        </div>
        <div
          style={{
            width: '100%',
            height: '3px',
            backgroundColor: 'rgba(240,235,225,0.06)',
            borderRadius: '999px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${report.risk_score}%`,
              height: '100%',
              backgroundColor: colors.bar,
              borderRadius: '999px',
            }}
          />
        </div>
      </div>

      {/* 2-line summary */}
      <p
        style={{
          margin: 0,
          color: 'rgba(240,235,225,0.4)',
          fontSize: '12px',
          lineHeight: 1.55,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {report.contract_summary}
      </p>

      {/* Severity count pills */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {SEVERITY_PILLS.map(({ key, label, color, bg }) => {
          const count = report.audit_metadata[key]
          if (count === 0) return null
          return (
            <span
              key={key}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                backgroundColor: bg,
                borderRadius: '4px',
                padding: '2px 7px',
                fontSize: '11px',
                color,
                fontWeight: 500,
              }}
            >
              {count} {label}
            </span>
          )
        })}
        <span
          style={{
            fontSize: '11px',
            color: 'rgba(240,235,225,0.2)',
            alignSelf: 'center',
          }}
        >
          · {report.audit_metadata.total_vulnerabilities} total
        </span>
      </div>

      {/* CTA */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span style={{ color: '#C9973A', fontSize: '12px', fontWeight: 500 }}>
          View report
        </span>
        <span style={{ color: '#C9973A', fontSize: '12px' }}>→</span>
      </div>
    </motion.div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

interface SampleReportsProps {
  onLoadSample: (report: AuditReport, input: string) => void
}

export default function SampleReports({ onLoadSample }: SampleReportsProps) {
  return (
    <section
      style={{
        padding: '0 32px 64px',
        maxWidth: '900px',
        margin: '0 auto',
        boxSizing: 'border-box',
        width: '100%',
      }}
    >
      {/* Divider + header */}
      <div
        style={{
          borderTop: '0.5px solid rgba(240,235,225,0.07)',
          paddingTop: '48px',
          marginBottom: '24px',
        }}
      >
        <p
          style={{
            margin: '0 0 6px',
            color: 'rgba(240,235,225,0.25)',
            fontSize: '11px',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}
        >
          Example audits
        </p>
        <p
          style={{
            margin: 0,
            color: 'rgba(240,235,225,0.4)',
            fontSize: '13px',
          }}
        >
          See what a Loupe report looks like
        </p>
      </div>

      {/* Cards grid */}
      <style>{`
        @media (max-width: 639px) {
          .sample-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <div
        className="sample-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '16px',
        }}
      >
        <SampleCard
          report={SAMPLE_1}
          filename="VulnerableBank.sol"
          delay={0}
          onLoad={() => onLoadSample(SAMPLE_1, 'VulnerableBank.sol')}
        />
        <SampleCard
          report={SAMPLE_2}
          filename="SimpleToken.sol"
          delay={0.1}
          onLoad={() => onLoadSample(SAMPLE_2, 'SimpleToken.sol')}
        />
      </div>
    </section>
  )
}