import React, { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const CYCLING_WORDS = [
  'microscopic flaws',
  'hidden exploits',
  'critical risks',
  'every vulnerability',
]

export default function Hero() {
  const [index, setIndex] = useState(0)
  const words = useMemo(() => CYCLING_WORDS, [])

  useEffect(() => {
    const id = setTimeout(() => {
      setIndex(i => (i + 1) % words.length)
    }, 2200)
    return () => clearTimeout(id)
  }, [index, words])

  return (
    <section
      style={{
        paddingTop: '72px',
        paddingBottom: '56px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle radial glow behind heading */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: '0',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '600px',
          height: '300px',
          background:
            'radial-gradient(ellipse at center, rgba(201,151,58,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Badge */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '7px',
          backgroundColor: 'rgba(201,151,58,0.08)',
          border: '0.5px solid rgba(201,151,58,0.3)',
          borderRadius: '20px',
          padding: '5px 13px',
          marginBottom: '32px',
        }}
      >
        {/* Gold dot */}
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: '#C9973A',
            flexShrink: 0,
            boxShadow: '0 0 6px rgba(201,151,58,0.6)',
          }}
        />
        <span
          style={{
            color: 'rgba(201,151,58,0.9)',
            fontSize: '12px',
            fontWeight: 500,
            letterSpacing: '0.03em',
          }}
        >
          Adversarial AI analysis
        </span>
      </motion.div>

      {/* H1 */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: 'easeOut', delay: 0.1 }}
        style={{ marginBottom: '20px' }}
      >
        <h1
          style={{
            margin: 0,
            padding: 0,
            color: '#F0EBE1',
            fontWeight: 500,
            letterSpacing: '-0.02em',
            lineHeight: 1.18,
          }}
        >
          <style>{`
            .hero-h1 {
              font-size: 42px;
            }
            @media (max-width: 640px) {
              .hero-h1 {
                font-size: 28px;
              }
            }
          `}</style>
          <span className="hero-h1" style={{ display: 'block' }}>
            Inspect your contracts for
          </span>

          {/* Cycling word container */}
          <span
            className="hero-h1"
            style={{
              display: 'inline-block',
              position: 'relative',
              color: '#C9973A',
              verticalAlign: 'bottom',
              overflow: 'hidden',
            }}
          >
            <span style={{ visibility: 'hidden', display: 'inline-block', padding: '0 4px' }}>
              every vulnerability
            </span>

            <AnimatePresence mode="wait">
              <motion.span
                key={words[index]}
                initial={{ opacity: 0, y: 28, x: "-50%" }}
                animate={{ opacity: 1, y: 0, x: "-50%" }}
                exit={{ opacity: 0, y: -28, x: "-50%" }}
                transition={{ duration: 0.38, ease: 'easeInOut' }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                  whiteSpace: 'nowrap',
                  color: '#C9973A',
                }}
              >
                {words[index]}
              </motion.span>
            </AnimatePresence>
          </span>
        </h1>
      </motion.div>

      {/* Subtext */}
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut', delay: 0.22 }}
        style={{
          margin: 0,
          color: 'rgba(240,235,225,0.45)',
          fontSize: '15px',
          lineHeight: 1.65,
          maxWidth: '440px',
          fontWeight: 400,
        }}
      >
        Paste a contract address or raw Solidity. Loupe runs a full security
        audit — no setup, no signup.
      </motion.p>
    </section>
  )
}
