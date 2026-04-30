# Loupe

> Autonomous smart contract security auditor with adversarial AI simulation and on-chain attestation.

---

## Problem

Professional smart contract audits cost $10,000–$50,000 and take weeks. Most projects ship unaudited. Loupe runs a full dual-phase security audit in under 60 seconds — free, no signup, no setup.

---

## Features

### Dual-Phase Analysis
- **Phase 1** — Standard vulnerability scan: reentrancy, integer overflow, access control, tx.origin auth, unchecked returns, timestamp dependence, front-running, DoS, delegatecall, flash loans, oracle manipulation, and more
- **Phase 2** — Master hacker adversarial simulation: violated assumptions, dangerous edge cases, multi-function combined exploits, MEV/mempool manipulation

### Foundry Exploit Test Generation
For every Critical and High severity vulnerability, Loupe generates a complete Foundry test that deploys the contract, executes the exploit, and asserts the attack succeeded.

### On-Chain Attestation
Every audit result is recorded on-chain via `LoupeAttestation.sol` deployed on Base Sepolia. The audit hash, risk score, and overall risk level are stored immutably. Fully automated — no wallet required from the user.

### Live Streaming Progress
Audit progress streams in real-time via SSE. Status messages update as each phase completes — no polling, no waiting for a single response.

### PDF Export
Full audit report exportable as a styled PDF: summary, vulnerability breakdown, attack scenarios, Phase 2 findings, and positive findings.

---

## Tech Stack

**Frontend**
- React 19 + Vite + TypeScript
- Tailwind CSS + shadcn/ui
- Framer Motion
- jsPDF (PDF export)

**Backend**
- FastAPI + Python 3.11
- httpx (async HTTP)
- web3.py (Base Sepolia attestation)
- OpenRouter API (Gemini 2.0 Flash, DeepSeek, Llama 4)
- Groq API (fallback)
- Etherscan API V2 (contract source resolution)

**Contracts**
- Solidity ^0.8.20
- Deployed on Base Sepolia via Remix
- `LoupeAttestation.sol` — stores audit records on-chain

---

## Local Setup

### Prerequisites
- Node.js 20+
- Python 3.11+
- Git

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Runs at `http://localhost:5173`

### Backend
```bash
cd backend
python -m venv venv
source venv/Scripts/activate  # Windows
# source venv/bin/activate    # Mac/Linux
pip install -r requirements.txt
cp .env.example .env          # fill in your keys
uvicorn main:app --reload --port 8000
```
Runs at `http://localhost:8000`

### Contract
Contract is pre-deployed on Base Sepolia. To redeploy:
1. Open `contracts/LoupeAttestation.sol` in [Remix](https://remix.ethereum.org)
2. Compile with Solidity 0.8.20+
3. Deploy to Base Sepolia via Browser Extension (MetaMask)
4. Copy deployed address → set `ATTESTATION_CONTRACT_ADDRESS` in `.env`

---

## Environment Variables

Copy `backend/.env.example` and fill in:

```env
# LLM Providers
OPENROUTER_API_KEY=        # openrouter.ai
GROQ_API_KEY=              # console.groq.com

# Blockchain
ETHERSCAN_API_KEY=         # etherscan.io
PRIVATE_KEY=               # wallet private key for attestation signing
BASE_SEPOLIA_RPC=https://sepolia.base.org
ATTESTATION_CONTRACT_ADDRESS=  # deployed LoupeAttestation address

# Server
ALLOWED_ORIGINS=http://localhost:5173
```

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (Vercel)                 │
│  React + Vite + TypeScript                          │
│                                                     │
│  AuditInput ──► streamAudit() ──► SSE stream        │
│                                      │              │
│  LoadingState (live status)          │              │
│  AuditReport                         │              │
│    ├── RiskScoreCard                 │              │
│    ├── VulnerabilityCard             │              │
│    │     └── Generate Foundry test   │              │
│    ├── Phase2Findings                │              │
│    └── AttestationBadge              │              │
└──────────────────────────────────────┼──────────────┘
                                       │ SSE / HTTP
┌──────────────────────────────────────▼──────────────┐
│                   Backend (Railway)                  │
│  FastAPI + Python 3.11                              │
│                                                     │
│  /audit/stream ──► streaming.py                     │
│  /audit        ──► auditor.py                       │
│  /generate-exploit ──► foundry_generator.py         │
│                                                     │
│  etherscan.py  ──► Etherscan API V2                 │
│  llm.py        ──► OpenRouter ──► Groq (fallback)   │
│  attestation.py ──► web3.py                         │
└──────────────────────────────────────┬──────────────┘
                                       │
┌──────────────────────────────────────▼──────────────┐
│              Base Sepolia (Blockchain)               │
│  LoupeAttestation.sol                               │
│  recordAudit(hash, address, risk, score)            │
│  getAudit(hash) → AuditRecord                       │
└─────────────────────────────────────────────────────┘
```

---

## Live Demo

- **Frontend:** https://loupe-six.vercel.app
- **Backend:** https://loupe-production.up.railway.app
- **Contract:** Base Sepolia — `LoupeAttestation.sol`

---

## License

MIT