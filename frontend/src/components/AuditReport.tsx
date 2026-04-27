import React from 'react'
import { motion } from 'framer-motion'
import type { AuditReport as AuditReportType, Vulnerability } from '../types/audit'
import RiskScoreCard from './RiskScoreCard'
import VulnerabilityCard from './VulnerabilityCard'
import Phase2Findings from './Phase2Findings'
import AttestationBadge from './AttestationBadge'
import { exportAuditPDF } from '../lib/exportPdf'


interface AuditReportProps {
  report: AuditReportType
  contractInput: string
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low', 'informational']

function sortVulns(vulns: Vulnerability[]): Vulnerability[] {
  return [...vulns].sort(
    (a, b) =>
      SEVERITY_ORDER.indexOf(a.severity.toLowerCase()) -
      SEVERITY_ORDER.indexOf(b.severity.toLowerCase())
  )
}

function deriveContractName(input: string): string {
  if (input.startsWith('0x') && input.length === 42) {
    return `${input.slice(0, 6)}…${input.slice(-4)}`
  }
  const match = input.match(/contract\s+([A-Za-z_][A-Za-z0-9_]*)\s*[\{|is]/)
  return match ? match[1] : 'Contract'
}

function deriveContractAddress(input: string): string | null {
  return input.startsWith('0x') && input.length === 42 ? input : null
}

function formatTimestamp(): string {
  return new Date().toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ── Divider ────────────────────────────────────────────────────────────────────

function Divider() {
  return (
    <div
      style={{
        width: '100%',
        height: '0.5px',
        backgroundColor: 'rgba(240,235,225,0.07)',
        margin: '28px 0',
      }}
    />
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function AuditReport({ report, contractInput }: AuditReportProps) {
  const contractName    = deriveContractName(contractInput)
  const contractAddress = deriveContractAddress(contractInput)
  const sortedVulns     = sortVulns(report.vulnerabilities)
  const timestamp       = formatTimestamp()

  const handleExportPdf = () => {
    exportAuditPDF(report, contractName)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      style={{
        width: '100%',
        maxWidth: '780px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── 1. Header row ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          marginBottom: '20px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              color: '#F0EBE1',
              fontSize: '16px',
              fontWeight: 500,
            }}
          >
            Audit complete
          </h2>
          <p
            style={{
              margin: '3px 0 0',
              color: 'rgba(240,235,225,0.3)',
              fontSize: '12px',
            }}
          >
            {timestamp}
          </p>
        </div>

        {/* Export PDF button */}
        <button
          onClick={handleExportPdf}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'transparent',
            border: '0.5px solid rgba(240,235,225,0.15)',
            borderRadius: '6px',
            color: '#F0EBE1',
            fontSize: '13px',
            fontWeight: 400,
            fontFamily: 'inherit',
            padding: '8px 16px',
            cursor: 'pointer',
            transition: 'border-color 0.2s, background-color 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'rgba(240,235,225,0.3)'
            e.currentTarget.style.backgroundColor = 'rgba(240,235,225,0.04)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'rgba(240,235,225,0.15)'
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export PDF
        </button>
      </div>

      {/* ── 2. Risk score card ── */}
      <RiskScoreCard
        overallRisk={report.overall_risk}
        riskScore={report.risk_score}
        contractSummary={report.contract_summary}
        contractName={contractName}
        contractAddress={contractAddress}
        metadata={report.audit_metadata}
      />

      <AttestationBadge attestation={report.attestation} />

      <Divider />

      {/* ── 4. Vulnerabilities ── */}
      <div>
        {/* Heading + count badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '14px',
          }}
        >
          <h3
            style={{
              margin: 0,
              color: '#F0EBE1',
              fontSize: '15px',
              fontWeight: 500,
            }}
          >
            Vulnerabilities found
          </h3>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: report.audit_metadata.total_vulnerabilities > 0
                ? 'rgba(224,75,75,0.1)'
                : 'rgba(99,153,34,0.1)',
              border: `0.5px solid ${report.audit_metadata.total_vulnerabilities > 0
                ? 'rgba(224,75,75,0.25)'
                : 'rgba(99,153,34,0.25)'}`,
              color: report.audit_metadata.total_vulnerabilities > 0
                ? '#E04B4B'
                : '#639922',
              borderRadius: '20px',
              padding: '2px 10px',
              fontSize: '12px',
              fontWeight: 500,
            }}
          >
            {report.audit_metadata.total_vulnerabilities}
          </span>
        </div>

        {/* Zero state */}
        {sortedVulns.length === 0 ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '20px',
              backgroundColor: 'rgba(99,153,34,0.04)',
              border: '0.5px solid rgba(99,153,34,0.15)',
              borderRadius: '8px',
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#639922"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span style={{ color: '#639922', fontSize: '14px' }}>
              No vulnerabilities detected
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {sortedVulns.map((vuln, i) => (
              <motion.div
                key={vuln.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut', delay: i * 0.05 }}
              >
                <VulnerabilityCard vulnerability={vuln} index={i} />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Divider />

      {/* ── 6. Phase 2 findings ── */}
      <Phase2Findings 
        phase2={report.phase2_findings || {
          assumptions_violated: [],
          edge_cases: [],
          combined_attack_vectors: [],
          mev_risks: [],
          overall_hacker_assessment: "No advanced phase 2 vectors were identified in this audit."
        }} 
      />

      <Divider />

      {/* ── 8. Positive findings ── */}
      {report.positive_findings && report.positive_findings.length > 0 && (
        <div>
          <h3
            style={{
              margin: '0 0 14px',
              color: '#F0EBE1',
              fontSize: '15px',
              fontWeight: 500,
            }}
          >
            What the contract does well
          </h3>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            {report.positive_findings.map((finding, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25, delay: i * 0.05 }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'rgba(99,153,34,0.08)',
                  border: '0.5px solid rgba(99,153,34,0.2)',
                  color: '#639922',
                  fontSize: '12px',
                  borderRadius: '20px',
                  padding: '4px 12px',
                  lineHeight: 1.5,
                }}
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ flexShrink: 0 }}
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {finding}
              </motion.span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}