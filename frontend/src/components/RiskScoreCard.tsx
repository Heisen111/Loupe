import React from 'react'
import { motion } from 'framer-motion'
import type { RiskLevel, AuditMetadata } from '../types/audit'

interface RiskScoreCardProps {
  overallRisk: RiskLevel
  riskScore: number
  contractSummary: string
  contractName?: string
  contractAddress?: string | null
  metadata: AuditMetadata
}

const RISK_COLORS: Record<RiskLevel, string> = {
  Critical: '#E04B4B',
  High:     '#EF9F27',
  Medium:   '#C9973A',
  Low:      '#639922',
  Minimal:  '#639922',
}

const RISK_BADGE: Record<RiskLevel, { bg: string; border: string; text: string }> = {
  Critical: { bg: 'rgba(224,75,75,0.1)',   border: 'rgba(224,75,75,0.25)',   text: '#E04B4B' },
  High:     { bg: 'rgba(239,159,39,0.1)',  border: 'rgba(239,159,39,0.25)',  text: '#EF9F27' },
  Medium:   { bg: 'rgba(201,151,58,0.1)',  border: 'rgba(201,151,58,0.25)',  text: '#C9973A' },
  Low:      { bg: 'rgba(99,153,34,0.1)',   border: 'rgba(99,153,34,0.25)',   text: '#639922' },
  Minimal:  { bg: 'rgba(99,153,34,0.1)',   border: 'rgba(99,153,34,0.25)',   text: '#639922' },
}

const META_PILLS = [
  { key: 'total_vulnerabilities', label: 'Total',    color: 'rgba(240,235,225,0.7)' },
  { key: 'critical_count',        label: 'Critical', color: '#E04B4B' },
  { key: 'high_count',            label: 'High',     color: '#EF9F27' },
  { key: 'medium_count',          label: 'Medium',   color: '#C9973A' },
  { key: 'low_count',             label: 'Low',      color: '#639922' },
] as const

export default function RiskScoreCard({
  overallRisk,
  riskScore,
  contractSummary,
  contractName,
  contractAddress,
  metadata,
}: RiskScoreCardProps) {
  const barColor = RISK_COLORS[overallRisk] ?? '#C9973A'
  const badge    = RISK_BADGE[overallRisk]  ?? RISK_BADGE.Medium

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      style={{
        backgroundColor: 'rgba(240,235,225,0.03)',
        border: '0.5px solid rgba(240,235,225,0.08)',
        borderRadius: '10px',
        padding: '24px',
        boxSizing: 'border-box',
      }}
    >
      {/* Top row — name/address + risk badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '12px',
          marginBottom: '20px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span
            style={{
              color: '#F0EBE1',
              fontSize: '14px',
              fontWeight: 500,
              lineHeight: 1.3,
            }}
          >
            {contractName || 'Smart Contract'}
          </span>
          {contractAddress && (
            <span
              style={{
                color: 'rgba(240,235,225,0.3)',
                fontSize: '11px',
                fontFamily: "'JetBrains Mono','Fira Code',monospace",
                letterSpacing: '0.02em',
              }}
            >
              {contractAddress.slice(0, 6)}…{contractAddress.slice(-4)}
            </span>
          )}
        </div>

        {/* Risk badge */}
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            backgroundColor: badge.bg,
            border: `0.5px solid ${badge.border}`,
            borderRadius: '5px',
            padding: '4px 10px',
            fontSize: '12px',
            fontWeight: 600,
            color: badge.text,
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {overallRisk} Risk
        </span>
      </div>

      {/* Score bar */}
      <div style={{ marginBottom: '20px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
          }}
        >
          <span style={{ color: 'rgba(240,235,225,0.4)', fontSize: '12px' }}>
            Risk score
          </span>
          <span
            style={{
              color: barColor,
              fontSize: '12px',
              fontWeight: 500,
              fontFamily: "'JetBrains Mono','Fira Code',monospace",
            }}
          >
            {riskScore} / 100
          </span>
        </div>

        {/* Track */}
        <div
          style={{
            width: '100%',
            height: '4px',
            backgroundColor: 'rgba(240,235,225,0.06)',
            borderRadius: '999px',
            overflow: 'hidden',
          }}
        >
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: `${riskScore}%` }}
            transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }}
            style={{
              height: '100%',
              backgroundColor: barColor,
              borderRadius: '999px',
              boxShadow: `0 0 8px ${barColor}55`,
            }}
          />
        </div>
      </div>

      {/* Contract summary */}
      <p
        style={{
          margin: '0 0 20px',
          color: 'rgba(240,235,225,0.45)',
          fontSize: '13px',
          lineHeight: 1.6,
          fontFamily: 'inherit',
        }}
      >
        {contractSummary}
      </p>

      {/* Metadata pills */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        {META_PILLS.map(({ key, label, color }) => {
          const count = metadata[key]
          if (key !== 'total_vulnerabilities' && count === 0) return null
          return (
            <div
              key={key}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                backgroundColor: 'rgba(240,235,225,0.04)',
                border: '0.5px solid rgba(240,235,225,0.08)',
                borderRadius: '6px',
                padding: '4px 12px',
                minWidth: '48px',
              }}
            >
              <span
                style={{
                  color,
                  fontSize: '15px',
                  fontWeight: 600,
                  lineHeight: 1.3,
                  fontFamily: "'JetBrains Mono','Fira Code',monospace",
                }}
              >
                {count}
              </span>
              <span
                style={{
                  color: 'rgba(240,235,225,0.3)',
                  fontSize: '10px',
                  marginTop: '1px',
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
              </span>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}