"""
Chat completions endpoint.

Handles both streaming and non-streaming chat completions
in OpenAI-compatible format.
"""

import json
import logging
import time
from typing import AsyncIterator
from uuid import uuid4

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse

logger = logging.getLogger(__name__)

from llm_server.adapters import GenerationParams, InvalidMessagesError, ModelNotLoadedError
from llm_server.schemas import (
    ChatChoice,
    ChatCompletionChunk,
    ChatCompletionChunkChoice,
    ChatCompletionRequest,
    ChatCompletionResponse,
    ChatMessage,
    DeltaMessage,
    ErrorDetail,
    ErrorResponse,
    UsageInfo,
)

router = APIRouter()


@router.post("/v1/chat/completions")
async def create_chat_completion(request: ChatCompletionRequest):
    """
    Create chat completion.

    Handles both streaming and non-streaming requests.
    Returns OpenAI-compatible response format.
    """
    from llm_server.server import get_adapter

    # Log incoming request
    logger.info("🔵 [LLM Server] Received chat completion request")
    logger.info(f"   Model: {request.model}")
    logger.info(f"   Messages: {len(request.messages)}")
    logger.info(f"   Stream: {request.stream}")
    logger.info(f"   Max tokens: {request.max_tokens}")

    # Log first user message preview
    for msg in request.messages:
        if msg.role == "user":
            content_preview = msg.content[:100] if len(msg.content) > 100 else msg.content
            logger.info(f"   User message preview: {content_preview}...")
            break

    adapter = get_adapter()

    if adapter is None or not adapter.is_loaded():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=ErrorResponse(
                error=ErrorDetail(
                    message="Model not loaded",
                    type="server_error",
                    code="model_not_loaded",
                )
            ).model_dump(),
        )

    # Validate model name
    if request.model not in ["gpt-oss-20b"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=ErrorResponse(
                error=ErrorDetail(
                    message=f"Model '{request.model}' not supported. Use 'gpt-oss-20b'",
                    type="invalid_request_error",
                    code="invalid_model",
                )
            ).model_dump(),
        )

    # Convert request to generation params
    stop_sequences = None
    if request.stop:
        stop_sequences = [request.stop] if isinstance(request.stop, str) else request.stop

    params = GenerationParams(
        temperature=request.temperature,
        max_tokens=request.max_tokens,
        top_p=request.top_p,
        stop_sequences=stop_sequences,
        presence_penalty=request.presence_penalty,
        frequency_penalty=request.frequency_penalty,
    )

    # Convert messages to dict format
    messages = [msg.model_dump() for msg in request.messages]

    # Handle streaming vs non-streaming
    if request.stream:
        return StreamingResponse(
            stream_chat_completion(adapter, request.model, messages, params),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            },
        )
    else:
        return await non_streaming_chat_completion(adapter, request.model, messages, params)


async def non_streaming_chat_completion(
    adapter, model: str, messages: list[dict], params: GenerationParams
) -> ChatCompletionResponse:
    """
    Generate non-streaming chat completion.

    Args:
        adapter: GPTOSSAdapter instance
        model: Model name
        messages: List of message dicts
        params: Generation parameters

    Returns:
        ChatCompletionResponse
    """
    try:
        # Generate response
        result = await adapter.generate(messages, params)

        # Create response
        completion_id = f"chatcmpl-{int(time.time())}-{uuid4().hex[:8]}"
        created_timestamp = int(time.time())

        response = ChatCompletionResponse(
            id=completion_id,
            object="chat.completion",
            created=created_timestamp,
            model=model,
            choices=[
                ChatChoice(
                    index=0,
                    message=ChatMessage(role="assistant", content=result.text),
                    finish_reason=result.finish_reason,
                )
            ],
            usage=UsageInfo(
                prompt_tokens=result.prompt_tokens,
                completion_tokens=result.tokens_generated,
                total_tokens=result.prompt_tokens + result.tokens_generated,
            ),
        )

        return response

    except InvalidMessagesError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=ErrorResponse(
                error=ErrorDetail(
                    message=str(e),
                    type="invalid_request_error",
                    code="invalid_messages",
                )
            ).model_dump(),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ErrorResponse(
                error=ErrorDetail(
                    message=f"Generation failed: {str(e)}",
                    type="server_error",
                    code="generation_error",
                )
            ).model_dump(),
        )


async def stream_chat_completion(
    adapter, model: str, messages: list[dict], params: GenerationParams
) -> AsyncIterator[str]:
    """
    Generate streaming chat completion.

    Yields Server-Sent Events (SSE) formatted chunks.

    Args:
        adapter: GPTOSSAdapter instance
        model: Model name
        messages: List of message dicts
        params: Generation parameters

    Yields:
        SSE formatted strings
    """
    try:
        completion_id = f"chatcmpl-{int(time.time())}-{uuid4().hex[:8]}"
        created_timestamp = int(time.time())

        # Send initial chunk with role
        initial_chunk = ChatCompletionChunk(
            id=completion_id,
            object="chat.completion.chunk",
            created=created_timestamp,
            model=model,
            choices=[
                ChatCompletionChunkChoice(
                    index=0,
                    delta=DeltaMessage(role="assistant"),
                    finish_reason=None,
                )
            ],
        )
        yield f"data: {initial_chunk.model_dump_json()}\n\n"

        # Stream tokens
        async for chunk in adapter.generate_stream(messages, params):
            if chunk.token:
                # Send content chunk
                content_chunk = ChatCompletionChunk(
                    id=completion_id,
                    object="chat.completion.chunk",
                    created=created_timestamp,
                    model=model,
                    choices=[
                        ChatCompletionChunkChoice(
                            index=0,
                            delta=DeltaMessage(content=chunk.token),
                            finish_reason=None,
                        )
                    ],
                )
                yield f"data: {content_chunk.model_dump_json()}\n\n"

            # Send final chunk if this is the last token
            if chunk.is_final:
                final_chunk = ChatCompletionChunk(
                    id=completion_id,
                    object="chat.completion.chunk",
                    created=created_timestamp,
                    model=model,
                    choices=[
                        ChatCompletionChunkChoice(
                            index=0,
                            delta=DeltaMessage(),
                            finish_reason=chunk.finish_reason or "stop",
                        )
                    ],
                )
                yield f"data: {final_chunk.model_dump_json()}\n\n"

        # Send [DONE] marker
        yield "data: [DONE]\n\n"

    except InvalidMessagesError as e:
        error_response = ErrorResponse(
            error=ErrorDetail(
                message=str(e),
                type="invalid_request_error",
                code="invalid_messages",
            )
        )
        yield f"data: {error_response.model_dump_json()}\n\n"
        yield "data: [DONE]\n\n"

    except Exception as e:
        error_response = ErrorResponse(
            error=ErrorDetail(
                message=f"Streaming generation failed: {str(e)}",
                type="server_error",
                code="generation_error",
            )
        )
        yield f"data: {error_response.model_dump_json()}\n\n"
        yield "data: [DONE]\n\n"
