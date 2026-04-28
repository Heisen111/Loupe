import json
import logging
from typing import AsyncGenerator
from services.auditor import run_audit
from services.etherscan import fetch_contract_source

logger = logging.getLogger(__name__)


def _sse(payload: dict) -> str:
    """Format a dict as an SSE data line with double newline."""
    return f"data: {json.dumps(payload)}\n\n"


async def stream_audit(source_or_address: str, model: str) -> AsyncGenerator[str, None]:
    """
    Async generator that yields SSE-formatted strings.
    Handles address resolution, audit execution, and error reporting.
    """
    try:
        # ── Resolve source ──────────────────────────────────────────────────────
        is_address = source_or_address.startswith("0x") and len(source_or_address) == 42

        if is_address:
            yield _sse({"type": "status", "message": "Fetching contract source from Etherscan..."})
            try:
                source = await fetch_contract_source(source_or_address)
            except ValueError as e:
                yield _sse({"type": "error", "message": str(e)})
                return
            except Exception as e:
                yield _sse({"type": "error", "message": f"Failed to fetch contract: {str(e)}"})
                return
        else:
            source = source_or_address
            yield _sse({"type": "status", "message": "Parsing Solidity source..."})

        # ── Phase 1 ─────────────────────────────────────────────────────────────
        yield _sse({"type": "status", "message": "Running Phase 1 vulnerability scan..."})
        yield _sse({"type": "status", "message": "Checking reentrancy, access control, overflow..."})

        # ── Phase 2 ─────────────────────────────────────────────────────────────
        yield _sse({"type": "status", "message": "Running master hacker simulation..."})
        yield _sse({"type": "status", "message": "Analyzing MEV risks and edge cases..."})

        # ── LLM call ────────────────────────────────────────────────────────────
        yield _sse({"type": "status", "message": "Generating audit report..."})

        try:
            result = await run_audit(source, model)
        except ValueError as e:
            yield _sse({"type": "error", "message": str(e)})
            return
        except RuntimeError as e:
            yield _sse({"type": "error", "message": f"LLM providers failed: {str(e)}"})
            return
        except Exception as e:
            logger.error(f"[Streaming] Unexpected audit error: {e}")
            yield _sse({"type": "error", "message": f"Unexpected error: {str(e)}"})
            return

        # ── Attestation ─────────────────────────────────────────────────────────
        yield _sse({"type": "status", "message": "Writing on-chain attestation..."})

        try:
            from services.attestation import post_attestation
            attestation = await post_attestation(result, source_or_address)
            result["attestation"] = attestation
            logger.info(f"[Streaming] Attestation recorded: {attestation.get('tx_hash')}")
        except Exception as e:
            logger.warning(f"[Streaming] Attestation failed (non-fatal): {e}")

        # ── Final result ─────────────────────────────────────────────────────────
        yield _sse({"type": "status", "message": "Audit complete."})
        yield _sse({"type": "result", "data": result})

    except Exception as e:
        logger.error(f"[Streaming] Unhandled error: {e}")
        yield _sse({"type": "error", "message": f"Stream failed: {str(e)}"})