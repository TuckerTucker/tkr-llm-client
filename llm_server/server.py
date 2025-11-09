"""
FastAPI server for local LLM inference.

Provides OpenAI-compatible API for local model inference using MLX.
"""

import logging
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from llm_server.adapters import DeviceType, GPTOSSAdapter, ModelConfig
from llm_server.server_config import load_config
from llm_server.routes import anthropic_router, chat_router, health_router, models_router

# Configure logging (must be before any logger usage)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Global adapter instance
_adapter: Optional[GPTOSSAdapter] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for FastAPI application.

    Handles startup and shutdown events:
    - Startup: Load model
    - Shutdown: Unload model and cleanup
    """
    global _adapter

    # Startup
    logger.info("🚀 Starting LLM server...")

    try:
        # Load configuration
        config = load_config()

        # Create adapter
        model_config = ModelConfig(
            model_path=config.model_path,
            model_name=config.model_name,
            device=DeviceType(config.device),
            quantization=config.quantization,
        )

        _adapter = GPTOSSAdapter(model_config)

        # Load model
        await _adapter.load_model()

        logger.info("✅ Server startup complete")

    except Exception as e:
        logger.error(f"❌ Server startup failed: {e}")
        raise

    # Yield to application
    yield

    # Shutdown
    logger.info("🔄 Shutting down server...")

    if _adapter:
        await _adapter.unload_model()

    logger.info("✅ Server shutdown complete")


def get_adapter() -> Optional[GPTOSSAdapter]:
    """
    Get global adapter instance.

    Returns:
        GPTOSSAdapter instance or None if not initialized
    """
    return _adapter


# Create FastAPI application
app = FastAPI(
    title="Local LLM Server",
    description="OpenAI-compatible API for local LLM inference",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
config = load_config()
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(health_router, tags=["health"])
app.include_router(models_router, tags=["models"])
app.include_router(chat_router, tags=["chat"])
app.include_router(anthropic_router, tags=["anthropic"])


@app.get("/")
async def root():
    """Root endpoint with server information."""
    return {
        "name": "Local LLM Server",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "health": "/health",
            "models": "/v1/models",
            "chat_completions": "/v1/chat/completions",
            "messages": "/v1/messages (Anthropic-compatible)",
        },
    }


def main():
    """
    Main entry point for running server with uvicorn.

    Loads configuration and starts FastAPI application.
    """
    import uvicorn

    config = load_config()

    uvicorn.run(
        "llm_server.server:app",
        host=config.host,
        port=config.port,
        workers=config.workers,
        log_level=config.log_level,
        timeout_keep_alive=config.keepalive_timeout,
    )


if __name__ == "__main__":
    main()
