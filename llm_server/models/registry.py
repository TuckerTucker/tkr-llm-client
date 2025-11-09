"""
Model registry for MLX-supported models.

Catalog of pre-quantized models from mlx-community on HuggingFace,
optimized for Apple Silicon with Metal acceleration.
"""

import logging
from typing import TypedDict

logger = logging.getLogger(__name__)


class ModelSpec(TypedDict):
    """Model specification with metadata."""

    path: str  # HuggingFace repository path
    context_length: int  # Maximum context window in tokens
    quantization: str  # Quantization level (4bit, 8bit, fp16)
    memory_estimate_mb: int  # Estimated memory requirement
    description: str  # Human-readable description


# Registry of MLX-optimized models from mlx-community
#
# NOTE: For local model loading, set LLM_MODEL_PATH environment variable to override
# the HuggingFace path. This allows loading from local directories without re-downloading.
MLX_SUPPORTED_MODELS: dict[str, ModelSpec] = {
    # OpenAI GPT-OSS (only supported model for this project)
    # To use local path: set LLM_MODEL_PATH=./models/gpt-oss-20b
    "gpt-oss-20b": {
        "path": "mlx-community/gpt-oss-20b-MXFP4-Q8",  # MLX-optimized mixed precision quantization
        "context_length": 2048,
        "quantization": "MXFP4-Q8",  # MLX mixed precision 4-bit/8-bit quantization
        "memory_estimate_mb": 12000,  # ~12GB estimated requirement
        "description": "OpenAI GPT-OSS 20B - MLX quantized with Harmony format support (REQUIRES 16GB+ RAM)",
    },
}


def get_model_spec(model_name: str) -> ModelSpec | None:
    """
    Get model specification by name.

    Args:
        model_name: Model identifier (case-insensitive)

    Returns:
        ModelSpec if found, None otherwise
    """
    # Try exact match first (case-insensitive)
    model_lower = model_name.lower()
    if model_lower in MLX_SUPPORTED_MODELS:
        return MLX_SUPPORTED_MODELS[model_lower]

    # Try partial match
    for key, spec in MLX_SUPPORTED_MODELS.items():
        if model_lower in key or key in model_lower:
            logger.debug(f"Matched '{model_name}' to '{key}'")
            return spec

    return None


def list_available_models() -> list[str]:
    """
    List all available model identifiers.

    Returns:
        List of model names that can be loaded
    """
    return sorted(MLX_SUPPORTED_MODELS.keys())


def get_models_by_size() -> dict[str, list[str]]:
    """
    Group models by approximate size category.

    Returns:
        Dictionary with size categories and model lists
    """
    # Only gpt-oss-20b is supported (large model > 5GB)
    return {
        "small": [],
        "medium": [],
        "large": ["gpt-oss-20b"],
    }


def format_model_list() -> str:
    """
    Format model list for display.

    Returns:
        Formatted string listing all available models with descriptions
    """
    lines = ["Available MLX Models:", ""]

    by_size = get_models_by_size()

    for category, models in [
        ("Small Models (< 3GB)", by_size["small"]),
        ("Medium Models (3-5GB)", by_size["medium"]),
        ("Large Models (> 5GB)", by_size["large"]),
    ]:
        if not models:
            continue

        lines.append(f"{category}:")
        for model_name in models:
            spec = MLX_SUPPORTED_MODELS[model_name]
            mem_gb = spec["memory_estimate_mb"] / 1024
            ctx_k = spec["context_length"] // 1024
            lines.append(
                f"  • {model_name:20s} - {spec['description']} "
                f"(~{mem_gb:.1f}GB, {ctx_k}K context)"
            )
        lines.append("")

    return "\n".join(lines)


def validate_model_name(model_name: str) -> tuple[bool, str]:
    """
    Validate that a model name is supported.

    Args:
        model_name: Model identifier to validate

    Returns:
        Tuple of (is_valid, message)
        - is_valid: True if model is supported
        - message: Explanation or suggestion
    """
    spec = get_model_spec(model_name)

    if spec is not None:
        return (True, f"Model '{model_name}' is supported")

    # Provide helpful suggestions
    available = list_available_models()
    suggestion = ""

    # Try to find similar names
    model_lower = model_name.lower()
    similar = [m for m in available if model_lower in m or m in model_lower]

    if similar:
        suggestion = f" Did you mean: {', '.join(similar[:3])}?"

    return (
        False,
        f"Model '{model_name}' not found in registry.{suggestion} "
        f"Run 'list-models' to see all available models."
    )


# Default model for this project (alignment research)
DEFAULT_MODEL = "gpt-oss-20b"

# Only one model supported - gpt-oss-20b for all use cases
RECOMMENDED_MODELS = {
    "alignment_research": "gpt-oss-20b",
    "chat": "gpt-oss-20b",
    "long_context": "gpt-oss-20b",
    "general": "gpt-oss-20b",
    "lightweight": "gpt-oss-20b",
    "multilingual": "gpt-oss-20b",
    "quality": "gpt-oss-20b",
}


def get_recommended_model(use_case: str = "chat") -> str:
    """
    Get recommended model for a use case.

    Args:
        use_case: Use case identifier (ignored, always returns gpt-oss-20b)

    Returns:
        Model name (always "gpt-oss-20b")
    """
    return "gpt-oss-20b"
