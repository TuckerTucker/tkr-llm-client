"""
Server configuration.

Loads configuration from environment variables with sensible defaults.
"""

import os
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings


class ServerConfig(BaseSettings):
    """
    Configuration for LLM server.

    All settings can be overridden via environment variables.
    """

    # Server settings
    host: str = Field(default="127.0.0.1", description="Server host")
    port: int = Field(default=42002, description="Server port")
    workers: int = Field(default=1, description="Number of worker processes")
    log_level: Literal["debug", "info", "warning", "error"] = Field(
        default="info", description="Logging level"
    )

    # Model settings
    model_path: str = Field(
        default=os.path.join(os.path.dirname(os.path.dirname(__file__)), "models"),
        description="Path to model files directory",
    )
    model_name: str = Field(
        default="mlx-community/gpt-oss-20b-MXFP4-Q8",
        description="Model to load (supports full HuggingFace identifiers)",
    )
    device: Literal["auto", "mps", "cpu"] = Field(
        default="mps", description="Compute device (use MPS for Apple Silicon)"
    )
    quantization: Literal["int4", "int8", "fp16", "none"] = Field(
        default="int4", description="Quantization method"
    )
    warmup: bool = Field(
        default=False, description="Run warmup inference after loading (may cause OOM on low memory systems)"
    )

    # Server timeouts
    request_timeout: int = Field(
        default=300, description="Request timeout in seconds (for long inference)"
    )
    keepalive_timeout: int = Field(
        default=65, description="Keepalive timeout in seconds"
    )

    # CORS settings
    cors_origins: list[str] = Field(
        default=["*"], description="Allowed CORS origins (use ['*'] for development)"
    )

    class Config:
        """Pydantic config."""

        env_prefix = "LLM_"
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        extra = "ignore"  # Ignore extra env vars (e.g., ACE_*, ROUTER_*, etc.)


def load_config() -> ServerConfig:
    """
    Load server configuration from environment.

    Returns:
        ServerConfig instance with loaded settings
    """
    config = ServerConfig()

    # Print configuration summary
    print("=" * 60)
    print("LLM Server Configuration")
    print("=" * 60)
    print(f"Server:        http://{config.host}:{config.port}")
    print(f"Workers:       {config.workers}")
    print(f"Log Level:     {config.log_level}")
    print(f"Model Path:    {config.model_path}")
    print(f"Model Name:    {config.model_name}")
    print(f"Device:        {config.device}")
    print(f"Quantization:  {config.quantization}")
    print(f"CORS Origins:  {config.cors_origins}")
    print("=" * 60)

    return config
