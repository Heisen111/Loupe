import httpx
import os
import json
from dotenv import load_dotenv

load_dotenv()

ETHERSCAN_API_KEY = os.getenv("ETHERSCAN_API_KEY", "")
ETHERSCAN_BASE_URL = "https://api.etherscan.io/v2/api"


def _is_valid_address(address: str) -> bool:
    if not address.startswith("0x"):
        return False
    if len(address) != 42:
        return False
    try:
        int(address, 16)
        return True
    except ValueError:
        return False


def _flatten_sources(source_code: str, contract_name: str) -> str:
    """
    Handles three formats Etherscan V2 returns:
    1. Standard JSON input  — source_code starts with {{ ... }}
    2. Standard JSON        — source_code starts with { ... }
    3. Single flat file     — plain Solidity string
    """
    source_code = source_code.strip()

    # Format 1: Standard JSON input wrapped in double braces {{ }}
    if source_code.startswith("{{"):
        source_code = source_code[1:-1]  # strip outer braces

    if source_code.startswith("{"):
        try:
            parsed = json.loads(source_code)
            sources: dict = {}

            # Standard JSON input format
            if "sources" in parsed:
                sources = parsed["sources"]
            # Plain mapping of filename -> { content }
            else:
                sources = parsed

            parts = []
            for filename, file_obj in sources.items():
                content = (
                    file_obj.get("content", "")
                    if isinstance(file_obj, dict)
                    else str(file_obj)
                )
                short_name = filename.split("/")[-1]
                parts.append(f"// === {short_name} ===\n{content.strip()}")

            return "\n\n".join(parts)

        except (json.JSONDecodeError, AttributeError):
            # Fall through to treat as plain source
            pass

    # Format 3: plain single-file Solidity
    short_name = f"{contract_name}.sol" if contract_name else "Contract.sol"
    return f"// === {short_name} ===\n{source_code.strip()}"


async def fetch_contract_source(address: str, chain_id: int = 1) -> str:
    """
    Fetch and flatten verified contract source code from Etherscan API V2.

    Args:
        address:  Contract address (0x-prefixed, 42 chars)
        chain_id: EVM chain ID (default 1 = Ethereum mainnet)

    Returns:
        Flattened Solidity source as a single string with file headers.

    Raises:
        ValueError: If address is invalid or contract is not verified.
        httpx.HTTPError: On network/timeout failures.
    """
    if not _is_valid_address(address):
        raise ValueError(f"Invalid contract address: {address!r}")

    params = {
        "chainid": chain_id,
        "module": "contract",
        "action": "getsourcecode",
        "address": address,
        "apikey": ETHERSCAN_API_KEY,
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(ETHERSCAN_BASE_URL, params=params)
        response.raise_for_status()
        data = response.json()

    if data.get("status") != "1" or not data.get("result"):
        raise ValueError(f"Etherscan error: {data.get('message', 'Unknown error')}")

    result = data["result"]

    if not isinstance(result, list) or len(result) == 0:
        raise ValueError("No result returned from Etherscan")

    contract_data = result[0]
    source_code: str = contract_data.get("SourceCode", "").strip()
    contract_name: str = contract_data.get("ContractName", "Contract")

    if not source_code:
        raise ValueError(
            f"Contract {address} is not verified on Etherscan. "
            "Only verified contracts can be audited."
        )

    return _flatten_sources(source_code, contract_name)