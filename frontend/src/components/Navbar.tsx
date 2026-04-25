import React from 'react'
import { motion } from 'framer-motion'

export default function Navbar() {
  const handleHowItWorks = (e: React.MouseEvent) => {
    e.preventDefault()
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <motion.nav
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: '#141210',
        borderBottom: '0.5px solid rgba(240,235,225,0.08)',
        padding: '16px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      {/* Left — Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="10" cy="10" r="7" stroke="#C9973A" strokeWidth="1.5" />
          <circle cx="10" cy="10" r="3" stroke="#C9973A" strokeWidth="1" strokeOpacity="0.6" />
          <line x1="15.5" y1="15.5" x2="21" y2="21" stroke="#C9973A" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span style={{ color: '#F0EBE1', fontSize: '15px', fontWeight: 500, letterSpacing: '0.01em' }}>
          Loupe
        </span>
      </div>

      {/* Right — Nav links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        
        <a 
          href="#how-it-works"
          onClick={handleHowItWorks}
          className="hide-mobile"
          style={{
            color: 'rgba(240,235,225,0.45)',
            fontSize: '14px',
            fontWeight: 400,
            textDecoration: 'none',
            transition: 'color 0.2s ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#F0EBE1')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(240,235,225,0.45)')}
        >
          How it works
        </a>

        <a 
          href="#"
          style={{
            color: 'rgba(240,235,225,0.45)',
            fontSize: '14px',
            fontWeight: 400,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'color 0.2s ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#F0EBE1')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(240,235,225,0.45)')}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
          </svg>
          GitHub
        </a>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .hide-mobile {
            display: none !important;
          }
        }
      `}</style>
    </motion.nav>
  )
}