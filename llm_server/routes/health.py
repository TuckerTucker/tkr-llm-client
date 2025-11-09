"""
Health check endpoint.

Provides server health status and model readiness information.
"""

import time
from fastapi import APIRouter, Response, status

from llm_server.schemas import HealthResponse

router = APIRouter()

# Track server start time for uptime calculation
_start_time = time.time()


@router.get("/health", response_model=HealthResponse)
async def health_check(response: Response):
    """
    Health check endpoint.

    Returns server status, model loaded state, and uptime.
    Returns 503 if model is not loaded, 200 if healthy.
    """
    from llm_server.server import get_adapter

    adapter = get_adapter()

    if adapter is None:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return HealthResponse(
            status="error",
            model_loaded=False,
            model_name=None,
            uptime_seconds=time.time() - _start_time,
        )

    model_loaded = adapter.is_loaded()

    if not model_loaded:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    return HealthResponse(
        status="ok" if model_loaded else "error",
        model_loaded=model_loaded,
        model_name=adapter.config.model_name if model_loaded else None,
        uptime_seconds=time.time() - _start_time,
    )
