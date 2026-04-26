import React, { useState } from 'react'

interface LinkProps {
  href: string
  children: React.ReactNode
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void
}

function FooterLink({ href, children, onClick }: LinkProps) {
  const [hovered, setHovered] = useState(false)
  return (
    <a
      href={href}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        color: hovered ? 'rgba(240,235,225,0.45)' : 'rgba(240,235,225,0.2)',
        fontSize: '12px',
        textDecoration: 'none',
        transition: 'color 0.2s ease',
        fontFamily: 'inherit',
      }}
    >
      {children}
    </a>
  )
}

export default function Footer() {
  const handleHowItWorks = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <footer
      style={{
        backgroundColor: '#141210',
        borderTop: '0.5px solid rgba(240,235,225,0.06)',
        padding: '24px 32px',
      }}
    >
      <style>{`
        @media (max-width: 639px) {
          .footer-inner {
            flex-direction: column !important;
            align-items: center !important;
            gap: 12px !important;
            text-align: center;
          }
        }
      `}</style>

      <div
        className="footer-inner"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        {/* Left — logo + tagline */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          {/* Loupe icon 18px */}
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="10" cy="10" r="7" stroke="rgba(240,235,225,0.25)" strokeWidth="1.5" />
            <circle cx="10" cy="10" r="3" stroke="rgba(240,235,225,0.15)" strokeWidth="1" />
            <line
              x1="15.5" y1="15.5" x2="21" y2="21"
              stroke="rgba(240,235,225,0.25)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>

          {/* Loupe text */}
          <span
            style={{
              color: 'rgba(240,235,225,0.25)',
              fontSize: '13px',
              fontWeight: 500,
              letterSpacing: '0.01em',
            }}
          >
            Loupe
          </span>

          {/* Dot separator */}
          <span style={{ color: 'rgba(240,235,225,0.12)', fontSize: '12px' }}>·</span>

          {/* Tagline */}
          <span
            style={{
              color: 'rgba(240,235,225,0.2)',
              fontSize: '12px',
            }}
          >
            Smart contract security, automated.
          </span>
        </div>

        {/* Right — nav links */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <FooterLink href="#how-it-works" onClick={handleHowItWorks}>
            How it works
          </FooterLink>
          <FooterLink href="#">
            GitHub
          </FooterLink>
          <FooterLink href="#">
            Docs
          </FooterLink>
        </div>
      </div>
    </footer>
  )
}