import React, { useRef, useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const MODELS = [
  { label: 'Gemini 2.0 Flash',  value: 'google/gemini-2.0-flash-001' },
  { label: 'DeepSeek Coder',    value: 'deepseek/deepseek-chat-v3-0324:free' },
  { label: 'Llama 4 Maverick',  value: 'meta-llama/llama-4-maverick:free' },
]

interface AuditInputProps {
  onAudit: (input: string, model: string) => void
  isLoading: boolean
}

export default function AuditInput({ onAudit, isLoading }: AuditInputProps) {
  const [input, setInput]   = useState('')
  const [model, setModel]   = useState(MODELS[0].value)
  const [error, setError]   = useState('')
  const [focused, setFocused] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-expand textarea
  const resize = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    const next = Math.min(el.scrollHeight, 160)
    el.style.height = `${Math.max(next, 52)}px`
  }, [])

  useEffect(() => { resize() }, [input, resize])

  const handleSubmit = () => {
    if (!input.trim()) {
      setError('Please enter a contract address or Solidity source code.')
      return
    }
    setError('')
    onAudit(input.trim(), model)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const borderColor = error
    ? 'rgba(224,75,75,0.5)'
    : focused
    ? 'rgba(201,151,58,0.4)'
    : 'rgba(240,235,225,0.12)'

  return (
    <div style={{ width: '100%', maxWidth: '640px', margin: '0 auto' }}>

      {/* Textarea wrapper */}
      <div style={{ position: 'relative' }}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => { setInput(e.target.value); if (error) setError('') }}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={isLoading}
          placeholder="0x... or paste Solidity code"
          rows={1}
          style={{
            width: '100%',
            minHeight: '52px',
            maxHeight: '160px',
            resize: 'none',
            overflowY: 'auto',
            boxSizing: 'border-box',
            backgroundColor: 'rgba(240,235,225,0.04)',
            border: `0.5px solid ${borderColor}`,
            borderRadius: '10px',
            padding: '14px 130px 14px 16px',
            color: '#F0EBE1',
            fontSize: '14px',
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
            lineHeight: 1.6,
            outline: 'none',
            transition: 'border-color 0.2s ease',
            caretColor: '#C9973A',
          }}
        />

        {/* Placeholder color override */}
        <style>{`
          textarea::placeholder { color: rgba(240,235,225,0.25) !important; }
          textarea::-webkit-scrollbar { width: 4px; }
          textarea::-webkit-scrollbar-track { background: transparent; }
          textarea::-webkit-scrollbar-thumb { background: rgba(240,235,225,0.1); border-radius: 2px; }
          select option { background: #1c1a17; color: #F0EBE1; }
        `}</style>

        {/* Audit button — absolute right */}
        <div
          style={{
            position: 'absolute',
            right: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
          }}
        >
          <AuditButton
            onClick={handleSubmit}
            disabled={isLoading}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.p
            key="error"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            style={{
              margin: '6px 0 0 4px',
              fontSize: '12px',
              color: '#E04B4B',
              fontFamily: 'inherit',
            }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Model selector row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginTop: '10px',
          paddingLeft: '2px',
        }}
      >
        <span
          style={{
            fontSize: '12px',
            color: 'rgba(240,235,225,0.3)',
            flexShrink: 0,
          }}
        >
          Model
        </span>

        <select
          value={model}
          onChange={e => setModel(e.target.value)}
          disabled={isLoading}
          style={{
            backgroundColor: 'transparent',
            border: '0.5px solid rgba(240,235,225,0.1)',
            borderRadius: '6px',
            color: 'rgba(240,235,225,0.5)',
            fontSize: '12px',
            padding: '3px 8px',
            outline: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'border-color 0.2s, color 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'rgba(240,235,225,0.25)'
            e.currentTarget.style.color = 'rgba(240,235,225,0.75)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'rgba(240,235,225,0.1)'
            e.currentTarget.style.color = 'rgba(240,235,225,0.5)'
          }}
        >
          {MODELS.map(m => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>

        <span
          style={{
            fontSize: '11px',
            color: 'rgba(240,235,225,0.18)',
          }}
        >
          Ctrl+Enter to run
        </span>
      </div>
    </div>
  )
}


// ── Audit Button ───────────────────────────────────────────────────────────────

interface AuditButtonProps {
  onClick: () => void
  disabled: boolean
  isLoading: boolean
}

function AuditButton({ onClick, disabled, isLoading }: AuditButtonProps) {
  const [hovered, setHovered] = useState(false)

  const bg = disabled
    ? 'rgba(201,151,58,0.5)'
    : hovered
    ? '#B8882F'
    : '#C9973A'

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        backgroundColor: bg,
        color: '#141210',
        fontSize: '13px',
        fontWeight: 500,
        fontFamily: 'inherit',
        border: 'none',
        borderRadius: '6px',
        padding: '8px 16px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled && !isLoading ? 0.5 : 1,
        transition: 'background-color 0.15s ease, opacity 0.15s ease',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {isLoading ? (
        <Spinner />
      ) : (
        <SearchIcon />
      )}
      {isLoading ? 'Auditing…' : 'Audit'}
    </button>
  )
}


// ── Icons ──────────────────────────────────────────────────────────────────────

function SearchIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <line x1="16.5" y1="16.5" x2="22" y2="22" />
    </svg>
  )
}

function Spinner() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      style={{ animation: 'loupe-spin 0.75s linear infinite' }}
    >
      <style>{`
        @keyframes loupe-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
      <path d="M12 2a10 10 0 0 1 10 10" opacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  )
}
