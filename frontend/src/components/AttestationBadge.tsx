import React from 'react'
import { motion } from 'framer-motion'
import type { Attestation } from '../types/audit'

interface AttestationBadgeProps {
  attestation?: Attestation
}

export default function AttestationBadge({ attestation }: AttestationBadgeProps) {
  if (!attestation) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      style={{
        backgroundColor: 'rgba(99,153,34,0.05)',
        border: '0.5px solid rgba(99,153,34,0.2)',
        borderRadius: '8px',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        flexWrap: 'wrap',
      }}
    >
      {/* Left — shield + text */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Shield check icon */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#639922"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flexShrink: 0 }}
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <polyline points="9 12 11 14 15 10" />
        </svg>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span
            style={{
              color: '#639922',
              fontSize: '13px',
              fontWeight: 500,
              lineHeight: 1.3,
            }}
          >
            Audit recorded on-chain
          </span>
          <span
            style={{
              color: 'rgba(240,235,225,0.3)',
              fontSize: '11px',
              lineHeight: 1.3,
            }}
          >
            Base Sepolia Testnet
          </span>
        </div>
      </div>

      {/* Right — view tx link */}
      <a
        href={attestation.explorer_url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          color: '#C9973A',
          fontSize: '12px',
          textDecoration: 'none',
          flexShrink: 0,
          transition: 'opacity 0.2s ease',
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
      >
        View transaction
        {/* External link icon */}
        <svg
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      </a>
    </motion.div>
  )
}