import os
import json
import time
import logging
from pathlib import Path
from web3 import Web3
from web3.middleware import ExtraDataToPOAMiddleware
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# ── Config ─────────────────────────────────────────────────────────────────────

PRIVATE_KEY                 = os.getenv("PRIVATE_KEY", "")
BASE_SEPOLIA_RPC            = os.getenv("BASE_SEPOLIA_RPC", "https://sepolia.base.org")
ATTESTATION_CONTRACT_ADDRESS = os.getenv("ATTESTATION_CONTRACT_ADDRESS", "")

ABI_PATH = Path(__file__).parent / "attestation_abi.json"

# ── ABI ────────────────────────────────────────────────────────────────────────

def _load_abi() -> list:
    if not ABI_PATH.exists():
        raise FileNotFoundError(f"ABI file not found: {ABI_PATH}")
    with open(ABI_PATH) as f:
        return json.load(f)

# ── Web3 setup ─────────────────────────────────────────────────────────────────

def _get_web3() -> Web3:
    if not BASE_SEPOLIA_RPC:
        raise RuntimeError("BASE_SEPOLIA_RPC is not set")
    w3 = Web3(Web3.HTTPProvider(BASE_SEPOLIA_RPC))
    w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)
    if not w3.is_connected():
        raise RuntimeError(f"Cannot connect to RPC: {BASE_SEPOLIA_RPC}")
    return w3

# ── Hash ───────────────────────────────────────────────────────────────────────

def _generate_audit_hash(
    contract_address: str,
    overall_risk: str,
    risk_score: int,
    timestamp: int,
) -> bytes:
    raw = f"{contract_address}{overall_risk}{risk_score}{timestamp}".encode()
    return Web3.keccak(raw)

# ── Main ───────────────────────────────────────────────────────────────────────

async def post_attestation(audit_result: dict, contract_address: str) -> dict:
    """
    Record an audit result on-chain via LoupeAttestation contract.

    Args:
        audit_result:     The parsed audit report dict from run_audit().
        contract_address: The audited contract address (or filename for raw Solidity).

    Returns:
        dict with tx_hash, audit_hash, chain, explorer_url.

    Raises:
        RuntimeError: On RPC connection failure or missing config.
        ValueError:   On invalid input.
    """
    if not PRIVATE_KEY:
        raise RuntimeError("PRIVATE_KEY is not set in environment")
    if not ATTESTATION_CONTRACT_ADDRESS:
        raise RuntimeError("ATTESTATION_CONTRACT_ADDRESS is not set in environment")

    overall_risk = audit_result.get("overall_risk", "Unknown")
    risk_score   = int(audit_result.get("risk_score", 0))
    timestamp    = int(time.time())

    # Connect
    try:
        w3 = _get_web3()
    except Exception as e:
        raise RuntimeError(f"RPC connection failed: {e}") from e

    abi      = _load_abi()
    account  = w3.eth.account.from_key(PRIVATE_KEY)
    checksum = Web3.to_checksum_address(ATTESTATION_CONTRACT_ADDRESS)
    contract = w3.eth.contract(address=checksum, abi=abi)

    # Generate hash
    audit_hash_bytes = _generate_audit_hash(
        contract_address, overall_risk, risk_score, timestamp
    )
    audit_hash_hex = "0x" + audit_hash_bytes.hex()

    logger.info(f"[Attestation] audit_hash={audit_hash_hex} contract={contract_address}")

    # Check if already attested
    try:
        already_exists = contract.functions.auditExists(audit_hash_bytes).call()
        if already_exists:
            logger.warning("[Attestation] Hash already recorded — returning existing record.")
            record = contract.functions.getAudit(audit_hash_bytes).call()
            existing_tx = audit_hash_hex  # best we can return without storing tx separately
            return {
                "tx_hash":     existing_tx,
                "audit_hash":  audit_hash_hex,
                "chain":       "base-sepolia",
                "explorer_url": f"https://sepolia.basescan.org/tx/{existing_tx}",
                "already_existed": True,
            }
    except Exception as e:
        logger.warning(f"[Attestation] auditExists check failed: {e}")

    # Build transaction
    try:
        nonce    = w3.eth.get_transaction_count(account.address)
        gas_price = w3.eth.gas_price

        tx = contract.functions.recordAudit(
            audit_hash_bytes,
            contract_address,
            overall_risk,
            risk_score,
        ).build_transaction({
            "from":     account.address,
            "nonce":    nonce,
            "gasPrice": gas_price,
            "chainId":  84532,  # Base Sepolia
        })

        # Estimate gas
        tx["gas"] = w3.eth.estimate_gas(tx)

    except Exception as e:
        raise RuntimeError(f"Failed to build transaction: {e}") from e

    # Sign + broadcast
    try:
        signed  = account.sign_transaction(tx)
        tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
        tx_hash_hex = "0x" + tx_hash.hex()

        logger.info(f"[Attestation] Broadcast tx={tx_hash_hex}")

        # Wait for receipt (up to 60s)
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)

        if receipt.status != 1:
            raise RuntimeError(f"Transaction reverted: {tx_hash_hex}")

        logger.info(f"[Attestation] Confirmed in block {receipt.blockNumber}")

    except Exception as e:
        raise RuntimeError(f"Transaction failed: {e}") from e

    return {
        "tx_hash":      tx_hash_hex,
        "audit_hash":   audit_hash_hex,
        "chain":        "base-sepolia",
        "explorer_url": f"https://sepolia.basescan.org/tx/{tx_hash_hex}",
    }