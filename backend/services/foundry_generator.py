import logging
from services.llm import call_llm, OPENROUTER_MODELS

logger = logging.getLogger(__name__)

FOUNDRY_PROMPT_TEMPLATE = """
You are an elite Solidity security researcher.

Given this vulnerability:
Title: {title}
Location: {location}
Attack scenario: {attack_scenario}

Contract source:
{contract_source}

Generate a complete, compiling Foundry test that proves this exploit.

CRITICAL FOUNDRY GENERATION RULES:
1. CHEATCODE SCOPE: `vm.prank`, `vm.deal`, and `vm.expectRevert` MUST ONLY be used inside the main `Test` contract. The attacker/malicious contract cannot use `vm.` cheatcodes.
2. NO DIRECT STORAGE MUTATION: Do not attempt to manually set state variables of the target contract during setup (e.g., `bank.balances[x] = y`). You must use the contract's public functions like `deposit()` to alter state.
3. REENTRANCY FALLBACKS: Inside a fallback/receive function, do not hardcode a massive withdrawal amount that will revert if the target's balance is low. Calculate the remaining balance of the target or ensure the withdrawal amount does not exceed the target's current balance.
4. DELEGATECALL EXPLOITS: If exploiting a delegatecall vulnerability, the malicious attacker contract MUST perfectly mirror the storage layout (variable types and order) of the target contract. Do not make external calls back to the target inside the exploit function; simply overwrite the state variables directly (e.g., `owner = tx.origin`).
5. NO MOCK IMPORTS: Do not import hypothetical mock contracts. Only import `Test.sol` and interact with the provided source.

Output requirements:
- DO NOT include the original target contract code in your output. Assume it is already imported.
- Only write the malicious attacker contract(s) and the Test contract.
- Imports Test from forge-std
- Deploys the vulnerable contract in setUp()
- Executes the exact exploit in a test function
- Asserts the attack succeeded (funds drained, owner changed, etc.)
- Return ONLY the raw Solidity code. No markdown, no explanation.
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
        contract_source=contract_source[:25000], 
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