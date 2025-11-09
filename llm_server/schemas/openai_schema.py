"""
OpenAI-compatible API schemas.

Pydantic models for request/response validation matching OpenAI API contract.
"""

from typing import Literal, Optional, Union
from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    """Chat message with role and content."""

    role: Literal["system", "user", "assistant"]
    content: str


class ChatCompletionRequest(BaseModel):
    """Request schema for chat completions endpoint."""

    model: str
    messages: list[ChatMessage] = Field(..., min_length=1)
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: int = Field(default=512, ge=1, le=4096)
    top_p: float = Field(default=0.9, ge=0.0, le=1.0)
    stream: bool = False
    stop: Optional[Union[str, list[str]]] = None
    presence_penalty: float = Field(default=0.0, ge=-2.0, le=2.0)
    frequency_penalty: float = Field(default=0.0, ge=-2.0, le=2.0)


class ChatChoice(BaseModel):
    """Single choice in chat completion response."""

    index: int
    message: ChatMessage
    finish_reason: Literal["stop", "length", "error"]


class UsageInfo(BaseModel):
    """Token usage information."""

    prompt_tokens: int
    completion_tokens: int
    total_tokens: int


class ChatCompletionResponse(BaseModel):
    """Response schema for chat completions (non-streaming)."""

    id: str
    object: Literal["chat.completion"] = "chat.completion"
    created: int
    model: str
    choices: list[ChatChoice]
    usage: UsageInfo


class DeltaMessage(BaseModel):
    """Delta message for streaming chunks."""

    role: Optional[Literal["assistant"]] = None
    content: Optional[str] = None


class ChatCompletionChunkChoice(BaseModel):
    """Choice in streaming chunk."""

    index: int
    delta: DeltaMessage
    finish_reason: Optional[Literal["stop", "length"]] = None


class ChatCompletionChunk(BaseModel):
    """Streaming chunk response."""

    id: str
    object: Literal["chat.completion.chunk"] = "chat.completion.chunk"
    created: int
    model: str
    choices: list[ChatCompletionChunkChoice]


class ErrorDetail(BaseModel):
    """Error detail structure."""

    message: str
    type: Literal["invalid_request_error", "server_error"]
    code: Optional[str] = None


class ErrorResponse(BaseModel):
    """Error response schema."""

    error: ErrorDetail


class ModelInfo(BaseModel):
    """Model information."""

    id: str
    object: Literal["model"] = "model"
    created: int
    owned_by: Literal["local"] = "local"


class ModelsResponse(BaseModel):
    """Response for models endpoint."""

    object: Literal["list"] = "list"
    data: list[ModelInfo]


class HealthResponse(BaseModel):
    """Health check response."""

    status: Literal["ok", "error"]
    model_loaded: bool
    model_name: Optional[str] = None
    uptime_seconds: float
