import logging
from services.llm import call_llm, OPENROUTER_MODELS

logger = logging.getLogger(__name__)

FOUNDRY_PROMPT_TEMPLATE = """
You are an expert Solidity security researcher.

Given this vulnerability:
Title: {title}
Location: {location}
Attack scenario: {attack_scenario}

Contract source:
{contract_source}

Generate a complete Foundry test that:
1. Imports Test from forge-std
2. Deploys the vulnerable contract in setUp()
3. Executes the exact exploit in a test function
4. Asserts the attack succeeded (funds drained, etc)
5. Uses vm.deal() for ETH setup if needed
6. Has comments explaining each step

Return ONLY the Solidity file. No markdown, no explanation.
"""


async def generate_foundry_test(
    vulnerability: dict,
    contract_source: str,
    model: str = OPENROUTER_MODELS[0],
) -> str:
    """
    Generate a Foundry exploit test for a given vulnerability.

    Args:
        vulnerability:   A vulnerability dict from the audit report.
        contract_source: The flattened Solidity source code.
        model:           OpenRouter model to use.

    Returns:
        Raw Solidity test file as a string.

    Raises:
        RuntimeError: If all LLM providers fail.
    """
    prompt = FOUNDRY_PROMPT_TEMPLATE.format(
        title=vulnerability.get("title", "Unknown"),
        location=vulnerability.get("location", "Unknown"),
        attack_scenario=vulnerability.get("attack_scenario", "Unknown"),
        contract_source=contract_source[:6000],
    )

    logger.info(
        f"[FoundryGenerator] Generating test for: {vulnerability.get('title')} "
        f"— model: {model}"
    )

    raw = await call_llm(prompt, model)

    # Strip markdown fences if model wraps in ```solidity ... ```
    raw = raw.strip()
    if raw.startswith("```"):
        lines = raw.split("\n")
        # Remove first line (```solidity or ```) and last line (```)
        raw = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])

    logger.info(f"[FoundryGenerator] Test generated — {len(raw)} chars")

    return raw.strip()