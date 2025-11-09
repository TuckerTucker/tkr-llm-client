"""
Local LLM Server.

FastAPI-based server providing OpenAI-compatible API
for local LLM inference using gpt-oss-20b (MLX).
"""

__version__ = "1.0.0"

from llm_server.server import app, get_adapter, main

__all__ = [
    "app",
    "get_adapter",
    "main",
]
