import httpx
import os
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

OPENROUTER_MODELS = [
    "google/gemini-2.0-flash-001",
    "qwen/qwen3-coder:free",
    "meta-llama/llama-3.3-70b-instruct:free",
]

GROQ_MODEL = "llama-3.3-70b-versatile"

TIMEOUT = 60.0
MAX_TOKENS = 2000
TEMPERATURE = 0


def _build_payload(model: str, prompt: str) -> dict:
    return {
        "model": model,
        "max_tokens": MAX_TOKENS,
        "temperature": TEMPERATURE,
        "messages": [
            {"role": "user", "content": prompt}
        ],
    }


def _extract_text(data: dict) -> str:
    try:
        return data["choices"][0]["message"]["content"].strip()
    except (KeyError, IndexError) as e:
        raise ValueError(f"Unexpected LLM response shape: {data}") from e


async def _call_openrouter(prompt: str, model: str) -> str:
    if not OPENROUTER_API_KEY:
        raise ValueError("OPENROUTER_API_KEY is not set")

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://loupe.audit",
        "X-Title": "Loupe",
    }

    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        response = await client.post(
            OPENROUTER_URL,
            headers=headers,
            json=_build_payload(model, prompt),
        )
        response.raise_for_status()
        data = response.json()

    logger.info(f"[LLM] OpenRouter responded — model: {model}")
    return _extract_text(data)


async def _call_groq(prompt: str) -> str:
    if not GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY is not set")

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        response = await client.post(
            GROQ_URL,
            headers=headers,
            json=_build_payload(GROQ_MODEL, prompt),
        )
        response.raise_for_status()
        data = response.json()

    logger.info(f"[LLM] Groq fallback responded — model: {GROQ_MODEL}")
    return _extract_text(data)


async def call_llm(prompt: str, model: str = OPENROUTER_MODELS[0]) -> str:
    """
    Call an LLM with automatic Groq fallback.

    Args:
        prompt: The full prompt string to send.
        model:  OpenRouter model string. Defaults to gemini-2.0-flash-exp:free.

    Returns:
        Raw text response from the model.

    Raises:
        RuntimeError: If both OpenRouter and Groq fail.
    """
    # Validate model is a known OpenRouter model, warn but don't block
    if model not in OPENROUTER_MODELS:
        logger.warning(f"[LLM] Unknown model '{model}', proceeding anyway.")

    try:
        return await _call_openrouter(prompt, model)

    except Exception as e:
        logger.warning(f"[LLM] OpenRouter failed ({type(e).__name__}: {e}). Falling back to Groq...")

        try:
            return await _call_groq(prompt)

        except Exception as groq_error:
            logger.error(f"[LLM] Groq fallback also failed: {groq_error}")
            raise RuntimeError(
                f"All LLM providers failed. "
                f"OpenRouter: {e} | Groq: {groq_error}"
            ) from groq_error