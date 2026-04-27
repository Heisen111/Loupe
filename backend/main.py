import os
import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv

from services.etherscan import fetch_contract_source
from services.auditor import run_audit
from services.llm import OPENROUTER_MODELS
from services.attestation import post_attestation

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

_raw = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173")
ALLOWED_ORIGINS = [o.strip() for o in _raw.split(",")]

app = FastAPI(
    title="Loupe API",
    description="Autonomous smart contract security audit agent",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Models ─────────────────────────────────────────────────────────────────────

class AuditRequest(BaseModel):
    input: str
    model: str = OPENROUTER_MODELS[0]


# ── Error helper ───────────────────────────────────────────────────────────────

def error(status: int, message: str):
    return JSONResponse(status_code=status, content={"error": message})


# ── Routes ─────────────────────────────────────────────────────────────────────

@app.get("/health", tags=["System"])
async def health():
    return {"status": "ok", "version": "1.0.0"}


@app.post("/audit", tags=["Audit"])
async def audit(request: AuditRequest):
    inp = request.input.strip()

    if not inp:
        return error(400, "Input is empty. Provide a contract address or Solidity source code.")

    # Resolve source
    source: str
    is_address = inp.startswith("0x") and len(inp) == 42

    if is_address:
        try:
            source = await fetch_contract_source(inp)
        except ValueError as e:
            return error(422, str(e))
        except Exception as e:
            logger.error(f"[/audit] Etherscan fetch failed: {e}")
            return error(500, f"Failed to fetch contract from Etherscan: {str(e)}")
    else:
        source = inp

    # Run audit
    try:
        result = await run_audit(source, request.model)
    except ValueError as e:
        return error(422, str(e))
    except RuntimeError as e:
        logger.error(f"[/audit] LLM failure: {e}")
        return error(500, f"LLM providers failed: {str(e)}")
    except Exception as e:
        logger.error(f"[/audit] Unexpected error: {e}")
        return error(500, f"Unexpected error during audit: {str(e)}")

    # Post attestation
    try:
        attestation = await post_attestation(result, inp)
        result["attestation"] = attestation
        logger.info(f"[/audit] Attestation recorded: {attestation.get('tx_hash')}")
    except Exception as e:
        logger.warning(f"[/audit] Attestation failed (non-fatal): {e}")

    return result


@app.get("/samples", tags=["Samples"])
async def samples():
    return {
        "samples": [
            {
                "id": "sample-vulnerable-bank",
                "overall_risk": "Critical",
                "risk_score": 91,
                "contract_summary": "VulnerableBank is a simple ETH deposit/withdraw contract with a classic reentrancy vulnerability in the withdraw function. The contract updates the user balance after the external call, allowing an attacker to recursively drain all funds before the balance is zeroed.",
                "vulnerabilities": [
                    {
                        "id": "V-001",
                        "title": "Reentrancy in withdraw()",
                        "severity": "critical",
                        "category": "Reentrancy",
                        "location": "VulnerableBank.sol:withdraw() L34",
                        "description": "The withdraw function sends ETH via call{value}() before updating the sender's balance. An attacker can deploy a contract whose receive() function calls withdraw() recursively, draining the entire contract balance.",
                        "attack_scenario": "Attacker deposits 1 ETH. Calls withdraw(). Before balance is zeroed, fallback re-enters withdraw(). Repeats until contract is drained.",
                        "recommendation": "Apply checks-effects-interactions: zero the balance before the external call, or use OpenZeppelin ReentrancyGuard.",
                        "master_hacker_note": "Flash loan the initial deposit to amplify the drain to the full contract TVL in a single transaction."
                    },
                    {
                        "id": "V-002",
                        "title": "Missing access control on setOwner()",
                        "severity": "critical",
                        "category": "Access Control",
                        "location": "VulnerableBank.sol:setOwner() L12",
                        "description": "setOwner() has no onlyOwner modifier. Any address can call it and take ownership, then call emergencyDrain() to steal all funds.",
                        "attack_scenario": "Call setOwner(attacker). Call emergencyDrain(). All ETH transferred.",
                        "recommendation": "Add require(msg.sender == owner) or use OpenZeppelin Ownable.",
                        "master_hacker_note": "Front-run the deployment transaction to claim ownership before the deployer can."
                    },
                    {
                        "id": "V-003",
                        "title": "tx.origin authentication",
                        "severity": "high",
                        "category": "Authentication",
                        "location": "VulnerableBank.sol:transfer() L58",
                        "description": "transfer() uses tx.origin instead of msg.sender for authorization. A malicious contract can trick the owner into calling it, forwarding the tx.origin check.",
                        "attack_scenario": "Phish owner into calling malicious contract. malicious.call() triggers transfer() — tx.origin is still the owner.",
                        "recommendation": "Replace tx.origin with msg.sender everywhere.",
                        "master_hacker_note": "Combine with a fake airdrop UI to lure the owner."
                    }
                ],
                "phase2_findings": {
                    "assumptions_violated": [
                        "Assumes external calls are safe before state updates",
                        "Assumes only the deployer can call setOwner"
                    ],
                    "edge_cases": [
                        "withdraw(0) passes all checks and wastes gas with no effect",
                        "Contract accepts ETH via receive() but tracks no balance for direct sends"
                    ],
                    "combined_attack_vectors": [
                        "Reentrancy + flash loan: borrow 100 ETH, deposit, drain full TVL, repay in one tx",
                        "setOwner + emergencyDrain in same block: atomic ownership takeover"
                    ],
                    "mev_risks": [
                        "Ownership takeover can be front-run by a bot watching the mempool",
                        "Reentrancy attack transaction is atomic — MEV bots can copy and sandwich"
                    ],
                    "overall_hacker_assessment": "This contract would be drained within minutes of mainnet deployment. Two independent critical paths both lead to total fund loss. The reentrancy is textbook but the missing access control on setOwner is arguably worse — it requires zero sophistication to exploit."
                },
                "positive_findings": [
                    "Uses Solidity 0.8.x — built-in overflow protection",
                    "Emits Deposit and Withdraw events for off-chain monitoring"
                ],
                "audit_metadata": {
                    "total_vulnerabilities": 3,
                    "critical_count": 2,
                    "high_count": 1,
                    "medium_count": 0,
                    "low_count": 0,
                    "informational_count": 0
                }
            },
            {
                "id": "sample-simple-token",
                "overall_risk": "Medium",
                "risk_score": 38,
                "contract_summary": "SimpleToken is a basic ERC-20 implementation with mint and burn functionality gated behind an owner check. The contract is generally well-structured but has a centralization risk and a missing zero-address check that could lead to token loss.",
                "vulnerabilities": [
                    {
                        "id": "V-001",
                        "title": "Unchecked zero-address in transfer()",
                        "severity": "medium",
                        "category": "Input Validation",
                        "location": "SimpleToken.sol:transfer() L44",
                        "description": "transfer() does not check that the recipient is not address(0). Tokens sent to address(0) are permanently burned without emitting a Burn event, making supply tracking inaccurate.",
                        "attack_scenario": "User accidentally passes address(0). Tokens are silently lost with no recovery path.",
                        "recommendation": "Add require(to != address(0), 'ERC20: transfer to zero address').",
                        "master_hacker_note": "Not directly exploitable for profit, but can be used to grief specific token holders by front-running their transactions."
                    },
                    {
                        "id": "V-002",
                        "title": "Centralized mint — single owner key controls supply",
                        "severity": "medium",
                        "category": "Centralization Risk",
                        "location": "SimpleToken.sol:mint() L29",
                        "description": "The owner can mint unlimited tokens at any time with no cap, timelock, or multi-sig requirement. A compromised or malicious owner can inflate supply to zero value.",
                        "attack_scenario": "Owner key compromised. Attacker mints max uint256 tokens, dumps on DEX, crashes price to zero.",
                        "recommendation": "Implement a max supply cap, a timelock, or migrate ownership to a multi-sig (e.g. Gnosis Safe).",
                        "master_hacker_note": "No timelock means no warning for holders. A rug can be executed in a single block."
                    },
                    {
                        "id": "V-003",
                        "title": "Missing event on ownership transfer",
                        "severity": "low",
                        "category": "Events / Monitoring",
                        "location": "SimpleToken.sol:transferOwnership() L18",
                        "description": "transferOwnership() does not emit an event. Off-chain monitoring tools and indexers cannot detect ownership changes.",
                        "attack_scenario": "No direct exploit, but silently hides admin key rotation from the community.",
                        "recommendation": "Emit OwnershipTransferred(oldOwner, newOwner) on every ownership change.",
                        "master_hacker_note": "Useful for an attacker who wants to quietly rotate to a new key before executing a rug."
                    }
                ],
                "phase2_findings": {
                    "assumptions_violated": [
                        "Assumes the owner private key is always secure",
                        "Assumes users will never pass address(0) as recipient"
                    ],
                    "edge_cases": [
                        "mint(0) succeeds silently with no state change",
                        "burn() on an account with zero balance throws a generic underflow panic instead of a clear error message"
                    ],
                    "combined_attack_vectors": [
                        "Compromised owner: mint max supply + immediate DEX dump in one bundle"
                    ],
                    "mev_risks": [
                        "Large mint transactions visible in mempool — arbitrage bots will front-run any resulting DEX sell"
                    ],
                    "overall_hacker_assessment": "No path to direct exploit without owner key compromise. The centralization risk is the dominant threat. For a community token this is a significant trust assumption. Recommend a timelock + multi-sig before any significant liquidity is added."
                },
                "positive_findings": [
                    "Solidity 0.8.20 — safe math built in",
                    "Clean separation of mint and burn logic",
                    "ERC-20 interface fully implemented including allowance/approve",
                    "No external calls — reentrancy risk is zero"
                ],
                "audit_metadata": {
                    "total_vulnerabilities": 3,
                    "critical_count": 0,
                    "high_count": 0,
                    "medium_count": 2,
                    "low_count": 1,
                    "informational_count": 0
                }
            }
        ]
    }


# ── Entry point ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)