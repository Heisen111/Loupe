import React, { useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import Navbar from './components/Navbar'
import Hero from './components/Hero'
import AuditInput from './components/AuditInput'
import LoadingState from './components/LoadingState'
import HowItWorks from './components/HowItWorks'
import Footer from './components/Footer'

import { runAudit } from './lib/api'
import type { AuditReport } from './types/audit'

// ── Inline ErrorMessage ────────────────────────────────────────────────────────

function ErrorMessage({ error }: { error: string }) {
  return (
    <AnimatePresence>
      <motion.div
        key="error"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        style={{
          maxWidth: '580px',
          margin: '0 auto',
          padding: '14px 18px',
          backgroundColor: 'rgba(224,75,75,0.06)',
          border: '0.5px solid rgba(224,75,75,0.25)',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
        }}
      >
        {/* Error icon */}
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#E04B4B"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flexShrink: 0, marginTop: '1px' }}
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span
          style={{
            color: '#E04B4B',
            fontSize: '13px',
            lineHeight: 1.55,
            fontFamily: 'inherit',
          }}
        >
          {error}
        </span>
      </motion.div>
    </AnimatePresence>
  )
}


// ── App ────────────────────────────────────────────────────────────────────────

export default function App() {
  const [isLoading, setIsLoading]     = useState(false)
  const [auditResult, setAuditResult] = useState<AuditReport | null>(null)
  const [error, setError]             = useState<string | null>(null)
  const [lastInput, setLastInput]     = useState('')

  const reportRef = useRef<HTMLDivElement>(null)

  // Scroll to report when result arrives
  useEffect(() => {
    if (auditResult && reportRef.current) {
      setTimeout(() => {
        reportRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 120)
    }
  }, [auditResult])

  const handleAudit = async (input: string, model: string) => {
    setIsLoading(true)
    setError(null)
    setAuditResult(null)
    setLastInput(input)

    try {
      const result = await runAudit(input, model)
      setAuditResult(result)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Audit failed. Please try again.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#141210',
        color: '#F0EBE1',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <Navbar />

      <main
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
          padding: '0 24px 80px',
        }}
      >
        <Hero />

        <AuditInput onAudit={handleAudit} isLoading={isLoading} />

        {/* Loading state */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ width: '100%', maxWidth: '580px' }}
            >
              <LoadingState />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error message */}
        <AnimatePresence>
          {error && !isLoading && (
            <motion.div
              key="error-wrap"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ width: '100%', maxWidth: '580px' }}
            >
              <ErrorMessage error={error} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Audit result — placeholder until Day 4 */}
        <AnimatePresence>
          {auditResult && !isLoading && (
            <motion.div
              key="report"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              style={{ width: '100%', maxWidth: '780px' }}
            >
              <div
                ref={reportRef}
                style={{
                  backgroundColor: 'rgba(240,235,225,0.03)',
                  border: '0.5px solid rgba(240,235,225,0.08)',
                  borderRadius: '10px',
                  padding: '32px',
                  textAlign: 'center',
                }}
              >
                <p style={{ color: 'rgba(240,235,225,0.3)', fontSize: '13px', margin: 0 }}>
                  PLACEHOLDER — DAY 4
                </p>
                <p style={{ color: '#C9973A', fontSize: '12px', marginTop: '8px' }}>
                  overall_risk: {auditResult.overall_risk} | score: {auditResult.risk_score} | vulns: {auditResult.audit_metadata.total_vulnerabilities}
                </p>
                {/* Quick data dump for debugging */}
                <pre
                  style={{
                    marginTop: '16px',
                    textAlign: 'left',
                    fontSize: '11px',
                    color: 'rgba(240,235,225,0.2)',
                    overflow: 'auto',
                    maxHeight: '200px',
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    borderRadius: '6px',
                    padding: '12px',
                  }}
                >
                  {JSON.stringify(auditResult, null, 2)}
                </pre>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* How It Works section */}
      <section id="how-it-works">
        <HowItWorks />
      </section>

      <Footer />
    </div>
  )
}