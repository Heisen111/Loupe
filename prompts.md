# Loupe prompts.md
## ETHGlobal OpenAgents 2026
## Stack: React+Vite+TS+Tailwind+shadcn / FastAPI+Python / Solidity+Remix
## Monorepo: loupe/frontend | loupe/backend | loupe/contracts
## Colors: #141210 bg | #F0EBE1 text | #C9973A accent
## Deploy: Vercel (frontend) + Railway (backend)
 
---
 
## TASK 1 — Project Scaffold
Scaffolded monorepo with Vite+React+TS+Tailwind+shadcn frontend,
FastAPI backend, contracts folder. Installed all deps (framer-motion,
lucide-react, axios, shadcn components). Set up global CSS variables
for color palette and Tailwind theme tokens. Created TypeScript
interfaces for AuditReport including vulnerabilities, phase2_findings,
audit_metadata, attestation fields.
 
---
 
## TASK 2 — Backend Core
Built Etherscan V2 integration (https://api.etherscan.io/v2/api) to
fetch and flatten multi-file verified contracts. Built LLM service with
OpenRouter as primary (gemini-2.0-flash-exp:free, deepseek-coder-v2:free,
llama-4-maverick:free) and Groq llama3-70b-8192 as auto-fallback.
Built robust JSON parser that strips markdown fences and handles all
LLM output variations. Wrote dual-phase AUDIT_PROMPT (standard vuln scan
plus master hacker adversarial sim). Wired POST /audit, GET /health,
GET /samples endpoints with proper error handling.
 
---
 
## TASK 3 — Frontend Core Components
Built Navbar (sticky, loupe SVG logo, smooth scroll). Built Hero with
21st.dev animated cycling words component restyled in Obsidian+Gold
palette. Built AuditInput with auto-expanding textarea, absolute Audit
button, model selector (3 OpenRouter models), Ctrl+Enter submit,
optimistic UI. Built LoadingState with forward-only progress bar
(never loops, slows near 85%), cycling status messages, pulsing gold
dot, skeleton preview lines. Wired App.tsx state (isLoading, auditResult,
error, lastInput) with axios calls to backend.
 
---
 
## TASK 4 — Audit Report UI
Built SeverityBadge with color map for Critical/High/Medium/Low/Info.
Built RiskScoreCard with animated score bar (framer-motion 0% to
riskScore%), metadata pills, contract summary. Built VulnerabilityCard
expandable with AnimatePresence — shows description, attack scenario
(red left border), recommendation (green left border), master hacker
note (gold left border). Built Phase2Findings with 2x2 grid of hacker
findings + overall assessment card in gold. Built full AuditReport
assembly with sorted vulns (Critical first), PDF export stub,
positive findings pills. Added robust fallback object for Phase2
findings to prevent crashes on missing LLM JSON fields.
 
---
 
## TASK 5 — Supporting Components + Deploy
Built HowItWorks with 3-step cards, SVG icons, dashed connector,
framer useInView stagger. Built SampleReports with 2 hardcoded
realistic audit samples (VulnerableBank Critical + SimpleToken Medium),
clickable to load full report. Built Footer. Set up PDF export with
jspdf. Deployed frontend to Vercel, backend to Railway. Fixed CORS
middleware to parse comma-separated origins from Railway env var.
Fixed TypeScript strict mode issues for Vercel production build.
Removed pywin32 from requirements.txt (Windows-only package).
 
---
 
## TASK 6 — On-Chain Attestation (Remix)
Wrote LoupeAttestation.sol — stores auditHash→AuditRecord mapping,
emits AuditRecorded event, recordAudit/getAudit/auditExists functions.
Deployed to Base Sepolia via Remix (no Foundry/WSL needed).
Built backend/services/attestation.py using web3.py — generates
keccak256 hash, signs and broadcasts recordAudit tx, returns tx_hash
and Basescan explorer URL. Wired into POST /audit endpoint as
non-blocking (audit still returns if attestation fails). Built
AttestationBadge.tsx frontend component with green on-chain badge
and Basescan link.