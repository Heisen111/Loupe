import re
import json
import logging
from services.llm import call_llm, OPENROUTER_MODELS

logger = logging.getLogger(__name__)

MAX_SOURCE_CHARS = 12000

AUDIT_PROMPT = """
You are an elite smart contract security auditor. You have a defender's knowledge AND an attacker's mindset.

PHASE 1 - STANDARD SCAN:
Check for reentrancy, integer overflow, access control, tx.origin auth, unchecked returns, timestamp dependence, front-running, DoS, delegatecall, self-destruct, flash loans, oracle manipulation, gas limits, missing events, centralization risks.

PHASE 2 - MASTER HACKER:
Think like an attacker who bypassed standard checks. Find: violated assumptions, dangerous edge cases (zero balance, max uint256, empty arrays), multi-function combined exploits, MEV/mempool manipulation, subtle logic bugs from specific call sequences.

OUTPUT: Return ONLY valid JSON, no markdown, no text before { or after }.
Structure:
{
  "overall_risk": "Critical|High|Medium|Low|Minimal",
  "risk_score": 0-100,
  "contract_summary": "string",
  "vulnerabilities": [
    {
      "id": "V-001",
      "title": "string",
      "severity": "critical|high|medium|low|informational",
      "category": "string",
      "location": "string",
      "description": "string",
      "attack_scenario": "string",
      "recommendation": "string",
      "master_hacker_note": "string"
    }
  ],
  "phase2_findings": {
    "assumptions_violated": ["string"],
    "edge_cases": ["string"],
    "combined_attack_vectors": ["string"],
    "mev_risks": ["string"],
    "overall_hacker_assessment": "string"
  },
  "positive_findings": ["string"],
  "audit_metadata": {
    "total_vulnerabilities": 0,
    "critical_count": 0,
    "high_count": 0,
    "medium_count": 0,
    "low_count": 0,
    "informational_count": 0
  }
}
"""


# ── Parser ─────────────────────────────────────────────────────────────────────

def parse_audit_response(raw: str) -> dict:
    """
    Robustly parse an LLM response into a dict.

    Handles:
      1. Clean JSON
      2. ```json fenced blocks
      3. ``` fenced blocks (no language tag)
      4. Leading prose before first {
      5. Truncated JSON (best-effort extraction)

    Raises:
        ValueError: If no valid JSON object can be extracted.
    """
    if not raw or not raw.strip():
        raise ValueError("LLM returned an empty response.")

    text = raw.strip()

    # Step 1: strip markdown fences (```json ... ``` or ``` ... ```)
    text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\s*```$", "", text)
    text = text.strip()

    # Step 2: extract between first { and last }
    first_brace = text.find("{")
    last_brace = text.rfind("}")

    if first_brace == -1:
        raise ValueError(
            f"Failed to parse: no JSON object found. "
            f"First 200 chars: {raw[:200]}"
        )

    if last_brace == -1 or last_brace <= first_brace:
        # Truncated response — attempt to close open braces/brackets
        logger.warning("[Parser] Response appears truncated. Attempting repair.")
        text = text[first_brace:]
        text = _attempt_json_repair(text)
    else:
        text = text[first_brace: last_brace + 1]

    # Step 3: parse
    try:
        result = json.loads(text)
    except json.JSONDecodeError as e:
        # One more attempt: repair then parse
        try:
            repaired = _attempt_json_repair(text)
            result = json.loads(repaired)
            logger.warning("[Parser] Used repaired JSON successfully.")
        except json.JSONDecodeError:
            raise ValueError(
                f"Failed to parse LLM response as JSON. "
                f"Error: {e}. "
                f"First 200 chars: {raw[:200]}"
            )

    if not isinstance(result, dict) or not result:
        raise ValueError(
            f"Parsed result is empty or not an object. "
            f"First 200 chars: {raw[:200]}"
        )

    return result


def _attempt_json_repair(text: str) -> str:
    """
    Best-effort repair of truncated JSON by closing unclosed
    brackets and braces.
    """
    # Count unclosed structures
    open_braces = text.count("{") - text.count("}")
    open_brackets = text.count("[") - text.count("]")

    # Remove trailing comma before we close
    text = re.sub(r",\s*$", "", text.rstrip())

    # Close arrays first, then objects
    text += "]" * max(open_brackets, 0)
    text += "}" * max(open_braces, 0)

    return text


# ── Auditor ────────────────────────────────────────────────────────────────────

async def run_audit(source: str, model: str = OPENROUTER_MODELS[0]) -> dict:
    """
    Run a full dual-phase audit on Solidity source code.

    Args:
        source: Flattened Solidity source code string.
        model:  OpenRouter model to use for the audit.

    Returns:
        Parsed audit report as a dict matching AuditReport schema.

    Raises:
        ValueError: If source is empty or LLM response cannot be parsed.
        RuntimeError: If all LLM providers fail.
    """
    if not source or not source.strip():
        raise ValueError("Source code is empty. Nothing to audit.")

    # Truncate oversized contracts
    truncated = False
    if len(source) > MAX_SOURCE_CHARS:
        logger.warning(
            f"[Auditor] Source truncated from {len(source)} "
            f"to {MAX_SOURCE_CHARS} chars."
        )
        source = source[:MAX_SOURCE_CHARS]
        truncated = True

    truncation_note = (
        "\n\n// NOTE: Source was truncated to 12000 characters due to token limits. "
        "Audit the visible portion only.\n"
        if truncated else ""
    )

    full_prompt = (
        AUDIT_PROMPT
        + "\n\nHere is the Solidity source code to audit:"
        + truncation_note
        + "\n\n"
        + source
    )

    logger.info(f"[Auditor] Starting audit — model: {model}, "
                f"source length: {len(source)} chars")

    raw_response = await call_llm(full_prompt, model)

    logger.info(f"[Auditor] LLM responded — parsing response...")

    result = parse_audit_response(raw_response)

    # Ensure audit_metadata counts are consistent with vulnerabilities list
    result = _reconcile_metadata(result)

    logger.info(
        f"[Auditor] Audit complete — risk: {result.get('overall_risk')} "
        f"score: {result.get('risk_score')} "
        f"vulns: {result.get('audit_metadata', {}).get('total_vulnerabilities')}"
    )

    return result


def _reconcile_metadata(report: dict) -> dict:
    """
    Recount vulnerability severities from the actual list
    in case the LLM miscounted in audit_metadata.
    """
    vulns = report.get("vulnerabilities", [])

    counts = {
        "critical": 0,
        "high": 0,
        "medium": 0,
        "low": 0,
        "informational": 0,
    }

    for v in vulns:
        sev = str(v.get("severity", "")).lower()
        if sev in counts:
            counts[sev] += 1

    report["audit_metadata"] = {
        "total_vulnerabilities": len(vulns),
        "critical_count":        counts["critical"],
        "high_count":            counts["high"],
        "medium_count":          counts["medium"],
        "low_count":             counts["low"],
        "informational_count":   counts["informational"],
    }

    return report