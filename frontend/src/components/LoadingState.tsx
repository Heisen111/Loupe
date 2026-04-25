import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const MESSAGES = [
  'Fetching contract source...',
  'Parsing Solidity structure...',
  'Running vulnerability scan...',
  'Checking reentrancy vectors...',
  'Analyzing access control...',
  'Running master hacker simulation...',
  'Checking MEV attack surfaces...',
  'Identifying edge cases...',
  'Generating audit report...',
]

const SKELETON_WIDTHS = ['90%', '70%', '80%', '55%']

export default function LoadingState() {
  const [progress, setProgress] = useState(0)
  const [msgIndex, setMsgIndex] = useState(0)
  const progressRef = useRef(0)

  // Forward-only progress — never loops, never resets, caps at 85%
  useEffect(() => {
    const id = setInterval(() => {
      const current = progressRef.current
      if (current >= 85) return

      // Slow dramatically above 75%
      const range = current > 75
        ? Math.random() * 0.3
        : current > 60
        ? Math.random() * 0.8 + 0.2
        : Math.random() * 1.5 + 0.5

      const next = Math.min(current + range, 85)
      progressRef.current = next
      setProgress(next)
    }, 800)

    return () => clearInterval(id)
  }, [])

  // Cycle status messages every 3s
  useEffect(() => {
    const id = setInterval(() => {
      setMsgIndex(i => (i + 1) % MESSAGES.length)
    }, 3000)
    return () => clearInterval(id)
  }, [])

  return (
    <div
      style={{
        maxWidth: '580px',
        margin: '0 auto',
        backgroundColor: 'rgba(240,235,225,0.03)',
        border: '0.5px solid rgba(240,235,225,0.08)',
        borderRadius: '10px',
        padding: '24px',
        boxSizing: 'border-box',
      }}
    >
      {/* Progress bar — top */}
      <div
        style={{
          width: '100%',
          height: '2px',
          backgroundColor: 'rgba(240,235,225,0.06)',
          borderRadius: '999px',
          overflow: 'hidden',
          marginBottom: '20px',
        }}
      >
        <motion.div
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{
            height: '100%',
            backgroundColor: '#C9973A',
            borderRadius: '999px',
          }}
        />
      </div>

      {/* Status row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '20px',
          minHeight: '18px',
        }}
      >
        {/* Pulsing gold dot */}
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: '#C9973A',
            flexShrink: 0,
            animation: 'loupe-pulse-dot 1s ease-in-out infinite alternate',
          }}
        />

        {/* Cycling message */}
        <div style={{ position: 'relative', height: '18px', flex: 1, overflow: 'hidden' }}>
          <AnimatePresence mode="wait">
            <motion.span
              key={msgIndex}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                color: 'rgba(240,235,225,0.4)',
                fontSize: '12px',
                fontFamily: 'inherit',
                whiteSpace: 'nowrap',
              }}
            >
              {MESSAGES[msgIndex]}
            </motion.span>
          </AnimatePresence>
        </div>

        {/* Progress percentage */}
        <span
          style={{
            color: 'rgba(201,151,58,0.6)',
            fontSize: '11px',
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            flexShrink: 0,
          }}
        >
          {Math.round(progress)}%
        </span>
      </div>

      {/* Skeleton lines */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {SKELETON_WIDTHS.map((w, i) => (
          <div
            key={i}
            style={{
              width: w,
              height: '10px',
              backgroundColor: 'rgba(240,235,225,0.05)',
              borderRadius: '3px',
              animation: `loupe-skeleton-pulse 1.6s ease-in-out ${i * 0.15}s infinite`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes loupe-pulse-dot {
          from { opacity: 0.3; }
          to   { opacity: 1; }
        }
        @keyframes loupe-skeleton-pulse {
          0%, 100% { opacity: 0.5; }
          50%       { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
