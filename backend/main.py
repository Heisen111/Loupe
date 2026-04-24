from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI(
    title="Loupe API",
    description="Autonomous smart contract security audit agent",
    version="1.0.0",
)

ALLOWED_ORIGIN = os.getenv("ALLOWED_ORIGIN", "http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[ALLOWED_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request / Response models ──────────────────────────────────────────────────

class AuditRequest(BaseModel):
    mode: str                  # "address" | "code"
    address: str | None = None
    source_code: str | None = None
    chain_id: int = 1


class AuditResponse(BaseModel):
    job_id: str
    status: str
    message: str


class HealthResponse(BaseModel):
    status: str
    version: str


# ── Routes ─────────────────────────────────────────────────────────────────────

@app.get("/health", response_model=HealthResponse, tags=["System"])
async def health():
    """Health check endpoint."""
    return HealthResponse(status="ok", version="1.0.0")


@app.post("/audit", response_model=AuditResponse, tags=["Audit"])
async def start_audit(request: AuditRequest, background_tasks: BackgroundTasks):
    """
    Start an audit job.
    Returns a job_id to poll via GET /stream/{job_id}.
    Accepts either a contract address (mode='address') or raw
    Solidity source code (mode='code').
    """
    import uuid
    job_id = str(uuid.uuid4())

    # TODO: background_tasks.add_task(run_audit, job_id, request)

    return AuditResponse(
        job_id=job_id,
        status="queued",
        message="Audit job queued. Connect to /stream/{job_id} for live updates.",
    )


@app.get("/stream/{job_id}", tags=["Audit"])
async def stream_audit(job_id: str):
    """
    SSE stream for a running audit job.
    Emits JSON events: { status, message, progress, data?, error? }
    Progress is forward-only (never decrements).
    """
    async def event_generator():
        # TODO: yield real SSE events from services/streaming.py
        import json
        import asyncio

        stub_events = [
            {"status": "fetching_contract", "message": "Fetching contract source...",   "progress": 10},
            {"status": "running_phase1",    "message": "Running Phase 1 audit...",       "progress": 35},
            {"status": "running_phase2",    "message": "Running adversarial simulation...", "progress": 65},
            {"status": "generating_exploits","message": "Generating Foundry exploit tests...", "progress": 85},
            {"status": "attesting",         "message": "Writing on-chain attestation...", "progress": 95},
            {"status": "complete",          "message": "Audit complete.",                "progress": 100},
        ]

        for event in stub_events:
            yield f"data: {json.dumps(event)}\n\n"
            await asyncio.sleep(1)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


@app.get("/samples", tags=["Samples"])
async def get_samples():
    """
    Returns a list of sample audit reports for the landing page.
    """
    # TODO: load from services/auditor.py or a static JSON file
    return {
        "samples": [
            {
                "id": "sample-1",
                "name": "SimpleVault.sol",
                "overall_risk": "Critical",
                "risk_score": 82,
                "vulnerability_count": 5,
            },
            {
                "id": "sample-2",
                "name": "ERC20Token.sol",
                "overall_risk": "Medium",
                "risk_score": 41,
                "vulnerability_count": 2,
            },
            {
                "id": "sample-3",
                "name": "StakingPool.sol",
                "overall_risk": "High",
                "risk_score": 67,
                "vulnerability_count": 4,
            },
        ]
    }


# ── Entry point ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)