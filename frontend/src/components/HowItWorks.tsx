import React, { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const STEPS = [
  {
    num: '01',
    title: 'Paste and trigger',
    desc: 'Drop a contract address or raw Solidity source. Loupe resolves verified source via Etherscan V2 or audits your paste directly — no setup required.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke="#C9973A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    num: '02',
    title: 'Dual-phase analysis',
    desc: 'Phase 1 runs a standard vulnerability scan. Phase 2 simulates an adversarial attacker — violated assumptions, MEV risks, and combined exploit chains.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke="#C9973A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
        <rect x="9" y="9" width="6" height="6" />
        <line x1="9" y1="1" x2="9" y2="4" />
        <line x1="15" y1="1" x2="15" y2="4" />
        <line x1="9" y1="20" x2="9" y2="23" />
        <line x1="15" y1="20" x2="15" y2="23" />
        <line x1="20" y1="9" x2="23" y2="9" />
        <line x1="20" y1="14" x2="23" y2="14" />
        <line x1="1" y1="9" x2="4" y2="9" />
        <line x1="1" y1="14" x2="4" y2="14" />
      </svg>
    ),
  },
  {
    num: '03',
    title: 'Structured report',
    desc: 'Severity-ranked vulnerabilities with attack scenarios, recommendations, and master hacker notes. Export as PDF or read inline — no account needed.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke="#C9973A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
    ),
  },
]

export default function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section
      id="how-it-works"
      ref={ref}
      style={{
        padding: '64px 32px',
        borderTop: '0.5px solid rgba(240,235,225,0.07)',
        maxWidth: '900px',
        margin: '0 auto',
        boxSizing: 'border-box',
        width: '100%',
      }}
    >
      {/* Section label */}
      <p
        style={{
          margin: '0 0 32px',
          color: 'rgba(240,235,225,0.25)',
          fontSize: '11px',
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
        }}
      >
        How it works
      </p>

      {/* Cards row */}
      <div style={{ position: 'relative' }}>
        {/* Dashed connector — desktop only */}
        <style>{`
          @media (min-width: 640px) {
            .hiw-connector { display: block !important; }
          }
          @media (max-width: 639px) {
            .hiw-grid { grid-template-columns: 1fr !important; }
            .hiw-connector { display: none !important; }
          }
        `}</style>

        <div
          className="hiw-connector"
          style={{
            display: 'none',
            position: 'absolute',
            top: '38px',
            left: 'calc(33.33% + 10px)',
            right: 'calc(33.33% + 10px)',
            height: '1px',
            borderTop: '1px dashed rgba(201,151,58,0.2)',
            zIndex: 0,
            pointerEvents: 'none',
          }}
        />

        <div
          className="hiw-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {STEPS.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
              transition={{ duration: 0.4, ease: 'easeOut', delay: i * 0.15 }}
              style={{
                backgroundColor: 'rgba(240,235,225,0.03)',
                border: '0.5px solid rgba(240,235,225,0.08)',
                borderRadius: '10px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {/* Step number + icon row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span
                  style={{
                    color: 'rgba(201,151,58,0.5)',
                    fontSize: '11px',
                    fontFamily: "'JetBrains Mono','Fira Code',monospace",
                    letterSpacing: '0.05em',
                  }}
                >
                  {step.num}
                </span>
                {step.icon}
              </div>

              {/* Title */}
              <h3
                style={{
                  margin: 0,
                  color: '#F0EBE1',
                  fontSize: '13px',
                  fontWeight: 500,
                  lineHeight: 1.3,
                }}
              >
                {step.title}
              </h3>

              {/* Description */}
              <p
                style={{
                  margin: 0,
                  color: 'rgba(240,235,225,0.35)',
                  fontSize: '12px',
                  lineHeight: 1.55,
                }}
              >
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}