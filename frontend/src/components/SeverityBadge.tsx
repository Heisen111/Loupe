import React from 'react'
import type { Severity } from '../types/audit'

const COLOR_MAP: Record<Severity, { bg: string; border: string; text: string }> = {
  critical: {
    bg: 'rgba(224,75,75,0.1)',
    border: 'rgba(224,75,75,0.25)',
    text: '#E04B4B',
  },
  high: {
    bg: 'rgba(239,159,39,0.1)',
    border: 'rgba(239,159,39,0.25)',
    text: '#EF9F27',
  },
  medium: {
    bg: 'rgba(201,151,58,0.1)',
    border: 'rgba(201,151,58,0.25)',
    text: '#C9973A',
  },
  low: {
    bg: 'rgba(99,153,34,0.1)',
    border: 'rgba(99,153,34,0.25)',
    text: '#639922',
  },
  informational: {
    bg: 'rgba(55,138,221,0.1)',
    border: 'rgba(55,138,221,0.25)',
    text: '#378ADD',
  },
}

interface SeverityBadgeProps {
  severity: Severity
}

export default function SeverityBadge({ severity }: SeverityBadgeProps) {
  const key = severity.toLowerCase() as Severity
  const colors = COLOR_MAP[key] ?? COLOR_MAP.informational

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        backgroundColor: colors.bg,
        border: `0.5px solid ${colors.border}`,
        borderRadius: '4px',
        padding: '3px 8px',
        fontSize: '11px',
        fontWeight: 500,
        color: colors.text,
        lineHeight: 1,
        whiteSpace: 'nowrap',
        fontFamily: 'inherit',
      }}
    >
      {severity.charAt(0).toUpperCase() + severity.slice(1).toLowerCase()}
    </span>
  )
}