import React from 'react'
import { motion } from 'framer-motion'
import type { Phase2Findings as Phase2FindingsType } from '../types/audit'

interface Phase2FindingsProps {
  phase2: Phase2FindingsType
}

const GRID_CARDS = [
  { key: 'assumptions_violated', label: 'Assumptions violated' },
  { key: 'edge_cases',           label: 'Edge cases'           },
  { key: 'combined_attack_vectors', label: 'Combined attack vectors' },
  { key: 'mev_risks',            label: 'MEV risks'            },
] as const

export default function Phase2Findings({ phase2 }: Phase2FindingsProps) {
    if (!phase2) {
    return null; 
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* Heading row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          marginBottom: '6px',
        }}
      >
        {/* Gold accent bar */}
        <div
          style={{
            width: '3px',
            minHeight: '36px',
            backgroundColor: '#C9973A',
            borderRadius: '2px',
            flexShrink: 0,
            marginTop: '2px',
          }}
        />
        <div>
          <h3
            style={{
              margin: 0,
              color: '#F0EBE1',
              fontSize: '15px',
              fontWeight: 500,
              lineHeight: 1.3,
            }}
          >
            Master hacker analysis
          </h3>
          <p
            style={{
              margin: '3px 0 0',
              color: 'rgba(240,235,225,0.3)',
              fontSize: '12px',
              lineHeight: 1.4,
            }}
          >
            Adversarial simulation beyond standard scanners
          </p>
        </div>
      </div>

      {/* 2x2 grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '10px',
          marginTop: '16px',
        }}
      >
        <style>{`
          @media (max-width: 580px) {
            .phase2-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>

        {GRID_CARDS.map(({ key, label }, i) => {
          const items = phase2[key] as string[]
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut', delay: i * 0.1 }}
              style={{
                backgroundColor: 'rgba(240,235,225,0.03)',
                border: '0.5px solid rgba(240,235,225,0.08)',
                borderRadius: '8px',
                padding: '16px',
              }}
            >
              {/* Label */}
              <p
                style={{
                  margin: '0 0 10px',
                  color: 'rgba(240,235,225,0.25)',
                  fontSize: '11px',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                }}
              >
                {label}
              </p>

              {/* Items */}
              {items && items.length > 0 ? (
                <ul
                  style={{
                    margin: 0,
                    padding: 0,
                    listStyle: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '7px',
                  }}
                >
                  {items.map((item, idx) => (
                    <li
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '7px',
                        color: 'rgba(240,235,225,0.55)',
                        fontSize: '13px',
                        lineHeight: 1.6,
                      }}
                    >
                      {/* Bullet */}
                      <span
                        style={{
                          color: 'rgba(240,235,225,0.2)',
                          fontSize: '10px',
                          marginTop: '4px',
                          flexShrink: 0,
                        }}
                      >
                        ◆
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p
                  style={{
                    margin: 0,
                    color: 'rgba(240,235,225,0.2)',
                    fontSize: '12px',
                    fontStyle: 'italic',
                  }}
                >
                  None identified
                </p>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Overall assessment — full width */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut', delay: 0.45 }}
        style={{
          marginTop: '10px',
          backgroundColor: 'rgba(201,151,58,0.04)',
          border: '0.5px solid rgba(201,151,58,0.15)',
          borderRadius: '8px',
          padding: '16px',
        }}
      >
        <p
          style={{
            margin: '0 0 8px',
            color: '#C9973A',
            fontSize: '12px',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
          }}
        >
          Overall assessment
        </p>
        <p
          style={{
            margin: 0,
            color: 'rgba(240,235,225,0.65)',
            fontSize: '14px',
            lineHeight: 1.7,
          }}
        >
          {phase2.overall_hacker_assessment}
        </p>
      </motion.div>
    </motion.div>
  )
}