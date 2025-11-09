"""
Inference module for text generation.

This module provides the core inference engine and utilities for text generation
using mlx-lm on Apple Silicon, including advanced streaming control, error recovery,
and performance optimization.
"""

from llm_server.inference.engine import InferenceEngine, GenerationResult
from llm_server.inference.exceptions import (
    InferenceError,
    GenerationError,
    ModelNotLoadedError,
    InvalidSamplingParamsError,
    GenerationCancelledError,
    ContextLengthExceededError,
)
from llm_server.inference.metrics import GenerationMetrics, MetricsTracker
from llm_server.inference.streaming import (
    TokenBuffer,
    StreamingFormatter,
    stream_with_buffer,
    stream_with_formatter,
    StreamingCollector,
    StreamController,
    StreamState,
)
from llm_server.inference.batch import (
    BatchInferenceEngine,
    BatchGenerationRequest,
    BatchGenerationResult,
    create_batch_request,
)
from llm_server.inference.recovery import (
    ErrorType,
    ErrorClassification,
    ErrorClassifier,
    RetryConfig,
    RetryStrategy,
    GracefulDegradation,
    ResilientInference,
)
from llm_server.inference.optimization import (
    MemoryStats,
    MemoryMonitor,
    MetalCacheManager,
    MemoryAwareGenerator,
    BatchOptimizer,
    InferenceOptimizer,
)

__all__ = [
    # Core engine
    "InferenceEngine",
    "GenerationResult",
    # Exceptions
    "InferenceError",
    "GenerationError",
    "ModelNotLoadedError",
    "InvalidSamplingParamsError",
    "GenerationCancelledError",
    "ContextLengthExceededError",
    # Metrics
    "GenerationMetrics",
    "MetricsTracker",
    # Streaming (enhanced)
    "TokenBuffer",
    "StreamingFormatter",
    "stream_with_buffer",
    "stream_with_formatter",
    "StreamingCollector",
    "StreamController",
    "StreamState",
    # Batch processing
    "BatchInferenceEngine",
    "BatchGenerationRequest",
    "BatchGenerationResult",
    "create_batch_request",
    # Error recovery
    "ErrorType",
    "ErrorClassification",
    "ErrorClassifier",
    "RetryConfig",
    "RetryStrategy",
    "GracefulDegradation",
    "ResilientInference",
    # Optimization
    "MemoryStats",
    "MemoryMonitor",
    "MetalCacheManager",
    "MemoryAwareGenerator",
    "BatchOptimizer",
    "InferenceOptimizer",
]
