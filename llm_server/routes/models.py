"""
Models endpoint.

Lists available models in OpenAI-compatible format.
"""

import time
from fastapi import APIRouter

from llm_server.schemas import ModelInfo, ModelsResponse

router = APIRouter()

# Supported models
SUPPORTED_MODELS = ["gpt-oss-20b"]


@router.get("/v1/models", response_model=ModelsResponse)
async def list_models():
    """
    List available models.

    Returns OpenAI-compatible model list with supported local models.
    """
    current_timestamp = int(time.time())

    models = [
        ModelInfo(
            id=model_id,
            object="model",
            created=current_timestamp,
            owned_by="local",
        )
        for model_id in SUPPORTED_MODELS
    ]

    return ModelsResponse(object="list", data=models)
