import time
from collections import defaultdict
from typing import Dict

# ── Config ─────────────────────────────────────────────────────────────────────

DAILY_LIMIT = 5
WINDOW_SECONDS = 86400  # 24 hours

# ── Storage ────────────────────────────────────────────────────────────────────

# { ip: { "count": int, "reset_at": float } }
_store: Dict[str, dict] = defaultdict(lambda: {"count": 0, "reset_at": 0.0})


# ── Functions ──────────────────────────────────────────────────────────────────

def is_rate_limited(ip: str) -> bool:
    """Returns True if the IP has exceeded the daily limit."""
    now = time.time()
    record = _store[ip]

    # Reset window if expired
    if now > record["reset_at"]:
        record["count"] = 0
        record["reset_at"] = now + WINDOW_SECONDS

    if record["count"] >= DAILY_LIMIT:
        return True

    record["count"] += 1
    return False


def get_remaining(ip: str) -> int:
    """Returns how many audits the IP has left today."""
    now = time.time()
    record = _store[ip]

    if now > record["reset_at"]:
        return DAILY_LIMIT

    return max(0, DAILY_LIMIT - record["count"])


def get_reset_time(ip: str) -> int:
    """Returns seconds until the window resets."""
    now = time.time()
    record = _store[ip]
    return max(0, int(record["reset_at"] - now))