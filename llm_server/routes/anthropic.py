"""
Anthropic API compatibility layer.

Translates Anthropic /v1/messages format to OpenAI /v1/chat/completions
for compatibility with Claude Code SDK.
"""

import logging
import os
from typing import List, Optional
from uuid import uuid4

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

router = APIRouter()


# Anthropic API schemas
class AnthropicContent(BaseModel):
    type: str
    text: Optional[str] = None


class AnthropicMessage(BaseModel):
    role: str
    content: str | List[AnthropicContent]


class AnthropicRequest(BaseModel):
    model: str
    messages: List[AnthropicMessage]
    max_tokens: int = 1024
    temperature: Optional[float] = 1.0
    top_p: Optional[float] = None
    top_k: Optional[int] = None
    stop_sequences: Optional[List[str]] = None
    stream: bool = False
    metadata: Optional[dict] = None
    system: Optional[str | List[AnthropicContent]] = None


class AnthropicContentBlock(BaseModel):
    type: str = "text"
    text: str


class AnthropicUsage(BaseModel):
    input_tokens: int
    output_tokens: int


class AnthropicResponse(BaseModel):
    id: str
    type: str = "message"
    role: str = "assistant"
    content: List[AnthropicContentBlock]
    model: str
    stop_reason: Optional[str] = None
    stop_sequence: Optional[str] = None
    usage: AnthropicUsage


@router.post("/v1/messages")
async def create_message(request: AnthropicRequest):
    """
    Anthropic Messages API endpoint.

    Translates to OpenAI chat completions format and forwards to LLM.
    """
    from llm_server.server import get_adapter
    from llm_server.adapters import GenerationParams

    # Override streaming setting from environment variable
    # This allows us to ignore Claude Code SDK's stream=True requests
    env_streaming = os.getenv("STREAMING", "false").lower() in ("true", "1", "yes")
    actual_stream = env_streaming  # Always use env setting, ignore request.stream

    logger.info("🟣 [Anthropic API] Received messages request")
    logger.info(f"   Model: {request.model}")
    logger.info(f"   Messages: {len(request.messages)}")
    logger.info(f"   Max tokens: {request.max_tokens}")
    logger.info(f"   Temperature: {request.temperature}")
    logger.info(f"   Stream (requested): {request.stream}")
    logger.info(f"   Stream (actual): {actual_stream} [from STREAMING env]")

    adapter = get_adapter()

    if adapter is None or not adapter.is_loaded():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"error": {"message": "Model not loaded", "type": "api_error"}}
        )

    # Convert Anthropic messages to OpenAI format
    openai_messages = []

    # Add system message if provided
    if request.system:
        system_text = request.system if isinstance(request.system, str) else " ".join(
            c.text for c in request.system if hasattr(c, 'text')
        )
        openai_messages.append({
            "role": "system",
            "content": system_text
        })

    # Convert messages
    for msg in request.messages:
        content = msg.content
        if isinstance(content, list):
            # Extract text from content blocks
            text_parts = [c.text for c in content if c.type == "text" and c.text]
            content = " ".join(text_parts)

        openai_messages.append({
            "role": msg.role,
            "content": content
        })

    logger.info(f"   Converted to {len(openai_messages)} OpenAI messages")

    # Map model name
    model = "gpt-oss-20b" if "claude" in request.model.lower() else request.model

    # Create generation params
    params = GenerationParams(
        temperature=request.temperature,
        max_tokens=request.max_tokens,
        top_p=request.top_p,
        stop_sequences=request.stop_sequences,
    )

    try:
        # Generate response
        result = await adapter.generate(openai_messages, params)

        # Build response text with thinking blocks if analysis channel is present
        response_text = result.text
        if result.analysis_channel:
            # Prepend thinking block (Harmony 'analysis' channel = chain-of-thought)
            # This allows Node.js ThinkingExtractor to parse it
            response_text = f"<thinking>\n{result.analysis_channel}\n</thinking>\n\n{result.text}"
            logger.info(f"🧠 [Anthropic API] Included {len(result.analysis_channel)} chars of thinking")

        # Convert to Anthropic format
        response = AnthropicResponse(
            id=f"msg_{uuid4().hex[:24]}",
            content=[AnthropicContentBlock(type="text", text=response_text)],
            model=request.model,
            stop_reason="end_turn" if result.finish_reason == "stop" else result.finish_reason,
            usage=AnthropicUsage(
                input_tokens=result.prompt_tokens,
                output_tokens=result.tokens_generated
            )
        )

        logger.info(f"✅ [Anthropic API] Generated {result.tokens_generated} tokens")

        return response

    except Exception as e:
        logger.error(f"❌ [Anthropic API] Generation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": {"message": str(e), "type": "api_error"}}
        )
