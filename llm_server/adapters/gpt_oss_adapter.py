"""
Adapter for gpt-oss-20b (MLX) inference engine.

Provides clean interface between FastAPI server and local LLM inference,
following Python adapter contract specifications.
"""

import asyncio
import gc
import logging
import os
import sys
import time
from dataclasses import dataclass
from enum import Enum
from typing import AsyncIterator, Optional

# Configure logger for this module
logger = logging.getLogger(__name__)


class DeviceType(Enum):
    """Supported compute devices."""

    AUTO = "auto"
    MPS = "mps"
    CPU = "cpu"


@dataclass
class ModelConfig:
    """Configuration for model loading."""

    model_path: str
    model_name: str
    device: DeviceType
    quantization: str  # "int4" | "int8" | "fp16" | "none"


@dataclass
class GenerationParams:
    """Parameters for text generation."""

    temperature: float = 0.7
    max_tokens: int = 512
    top_p: float = 0.9
    stop_sequences: Optional[list[str]] = None
    presence_penalty: float = 0.0
    frequency_penalty: float = 0.0


@dataclass
class GenerationResult:
    """Result from text generation."""

    text: str
    tokens_generated: int
    finish_reason: str  # "stop" | "length" | "error"
    prompt_tokens: int
    latency_ms: float
    analysis_channel: str = ""  # Chain-of-thought from Harmony 'analysis' channel


@dataclass
class GenerationChunk:
    """Streaming generation chunk."""

    token: str
    is_final: bool
    finish_reason: Optional[str] = None


class AdapterError(Exception):
    """Base adapter error."""

    pass


class ModelNotLoadedError(AdapterError):
    """Model not loaded when generation attempted."""

    pass


class GenerationError(AdapterError):
    """Error during generation."""

    pass


class InvalidMessagesError(AdapterError):
    """Invalid message format."""

    pass


class GPTOSSAdapter:
    """
    Adapter for gpt-oss-20b (MLX) inference engine.

    Responsibilities:
    - Load and manage model lifecycle
    - Convert OpenAI-style requests to internal format
    - Handle streaming and non-streaming generation
    - Manage conversation history and context
    """

    def __init__(self, config: ModelConfig):
        """
        Initialize adapter with model configuration.

        Args:
            config: Model configuration

        Raises:
            ValueError: If configuration invalid
            FileNotFoundError: If model path doesn't exist
        """
        self.config = config
        self._model = None
        self._engine = None
        self._loaded = False

        # For MLX: model_path can be a Hugging Face model ID or local cache path
        # No need to validate or add to sys.path - MLX handles this
        logger.debug(f"Adapter initialized for model: {config.model_name}")
        logger.debug(f"Model path: {config.model_path}")

    async def load_model(self) -> None:
        """
        Load model into memory.

        This is called once during server startup.
        Should be idempotent (safe to call multiple times).

        Raises:
            RuntimeError: If model fails to load
        """
        if self._loaded:
            return  # Already loaded

        try:
            print(f"🔄 Loading model: {self.config.model_name}")
            print(f"   Path: {self.config.model_path}")
            print(f"   Device: {self.config.device.value}")
            print(f"   Quantization: {self.config.quantization}")

            # Import from local modules (lazy import to avoid startup issues)
            try:
                from llm_server.inference.engine import InferenceEngine
                from llm_server.models.loader import ModelLoader
                from llm_server.config.model_config import ModelConfig as GPTModelConfig
            except ImportError as e:
                raise RuntimeError(
                    f"Failed to import inference modules: {e}. "
                    f"Ensure all dependencies are installed"
                )

            # Configure model
            gpt_config = GPTModelConfig(
                model_name=self.config.model_name,
                device=self.config.device.value,
                quantization=self.config.quantization,
            )

            # Load model via gpt-oss-20b (MLX) (blocking call)
            loader = ModelLoader(gpt_config)
            await asyncio.to_thread(loader.load)

            # Create inference engine
            self._engine = InferenceEngine(loader, gpt_config)
            self._loaded = True

            print(f"✅ Model loaded successfully: {self.config.model_name}")

        except Exception as e:
            print(f"❌ Model loading failed: {e}")
            self._loaded = False
            raise RuntimeError(f"Failed to load model: {e}")

    async def unload_model(self) -> None:
        """
        Unload model and free memory.

        Called during server shutdown.
        """
        if not self._loaded:
            return

        try:
            print("🔄 Unloading model...")

            # Release model
            if self._engine:
                del self._engine
                self._engine = None

            # Force garbage collection
            gc.collect()

            # MPS memory cleanup (if using Metal)
            if self.config.device == DeviceType.MPS:
                try:
                    import mlx.core as mx

                    mx.metal.clear_cache()
                except ImportError:
                    pass  # MLX not available, skip cache clear

            self._loaded = False
            print("✅ Model unloaded successfully")

        except Exception as e:
            print(f"⚠️  Error during unload: {e}")

    def is_loaded(self) -> bool:
        """Check if model is loaded and ready."""
        return self._loaded

    async def generate(
        self, messages: list[dict[str, str]], params: GenerationParams
    ) -> GenerationResult:
        """
        Generate text response (non-streaming).

        Args:
            messages: List of {role, content} dicts
            params: Generation parameters

        Returns:
            GenerationResult with complete response

        Raises:
            ValueError: If messages invalid
            RuntimeError: If generation fails
        """
        if not self._loaded:
            raise ModelNotLoadedError("Model not loaded")

        try:
            # Validate messages
            self._validate_messages(messages)

            # Convert messages to Harmony format prompt
            prompt = self._build_prompt(messages, params)

            # Log Harmony prompt details
            reasoning_level = 'low' if params.temperature <= 0.3 else 'high' if params.temperature >= 0.8 else 'medium'
            logger.debug("🎵 [Harmony] Generated prompt")
            logger.debug(f"   Reasoning level: {reasoning_level} (temp={params.temperature})")
            logger.debug(f"   Prompt length: {len(prompt)} chars")
            logger.debug(f"   Prompt preview (first 500 chars):\n{prompt[:500]}...")

            # Import sampling params (lazy import)
            from llm_server.sampling.params import SamplingParams

            # Convert params to SamplingParams (with defaults for None values)
            stop_sequences = params.stop_sequences or []
            sampling_params = SamplingParams(
                max_tokens=params.max_tokens,
                temperature=params.temperature if params.temperature is not None else 0.7,
                top_p=params.top_p if params.top_p is not None else 0.9,
                stop_sequences=stop_sequences,
            )

            # Generate (blocking call, run in thread)
            logger.debug("🔄 [Harmony] Starting inference...")
            start_time = time.time()
            result = await asyncio.to_thread(
                self._engine.generate, prompt, sampling_params
            )
            latency = (time.time() - start_time) * 1000
            logger.debug(f"✅ [Harmony] Inference complete ({latency:.0f}ms)")

            # Parse Harmony response to extract both 'final' and 'analysis' channels
            raw_text = result.text
            logger.debug(f"📝 [Harmony] Raw output length: {len(raw_text)} chars")
            logger.debug(f"🔍 [Harmony] Raw output (first 1000 chars):\n{raw_text[:1000]}")

            parsed_text, analysis_text = self._parse_harmony_response(raw_text)
            logger.debug(f"✂️  [Harmony] Final channel length: {len(parsed_text)} chars")
            logger.debug(f"🧠 [Harmony] Analysis channel length: {len(analysis_text)} chars")

            # Log if significant content was in analysis channel
            if analysis_text:
                logger.debug(f"🔍 [Harmony] Extracted {len(analysis_text)} chars from analysis channel")
                logger.debug(f"🧠 [Harmony] Analysis content (first 500 chars):\n{analysis_text[:500]}")
            else:
                logger.warning(f"⚠️  [Harmony] No analysis channel found despite temperature={params.temperature}")

            # Detect stop reason from Harmony tokens
            harmony_stop_reason = self._detect_harmony_stop_reason(raw_text)
            logger.debug(f"🛑 [Harmony] Stop reason: {harmony_stop_reason}")

            # Fallback to engine's finish reason if Harmony detection fails
            if harmony_stop_reason == "length" and result.finish_reason == "eos":
                finish_reason = "stop"
            else:
                finish_reason = harmony_stop_reason

            logger.info(f"✅ [Generation] Complete: {result.tokens_generated} tokens, {latency:.0f}ms")

            return GenerationResult(
                text=parsed_text,
                tokens_generated=result.tokens_generated,
                finish_reason=finish_reason,
                prompt_tokens=self._count_tokens(prompt),
                latency_ms=latency,
                analysis_channel=analysis_text,
            )

        except ModelNotLoadedError:
            raise
        except ValueError as e:
            raise InvalidMessagesError(f"Invalid messages: {e}")
        except Exception as e:
            raise GenerationError(f"Generation failed: {e}")

    async def generate_stream(
        self, messages: list[dict[str, str]], params: GenerationParams
    ) -> AsyncIterator[GenerationChunk]:
        """
        Generate text response (streaming).

        Args:
            messages: List of {role, content} dicts
            params: Generation parameters

        Yields:
            GenerationChunk for each token

        Raises:
            ValueError: If messages invalid
            RuntimeError: If generation fails
        """
        if not self._loaded:
            raise ModelNotLoadedError("Model not loaded")

        try:
            # Validate messages
            self._validate_messages(messages)

            # Convert messages to Harmony format prompt
            prompt = self._build_prompt(messages, params)

            # Import sampling params (lazy import)
            from llm_server.sampling.params import SamplingParams

            # Convert params
            stop_sequences = params.stop_sequences or []
            sampling_params = SamplingParams(
                max_tokens=params.max_tokens,
                temperature=params.temperature,
                top_p=params.top_p,
                stop_sequences=stop_sequences,
            )

            # Stream tokens (blocking iterator, wrap in async)
            def generate_sync():
                """Sync generator wrapper."""
                return self._engine.generate_stream(prompt, sampling_params)

            # Convert sync generator to async
            loop = asyncio.get_event_loop()
            stream_gen = await loop.run_in_executor(None, generate_sync)

            # Track channel state for Harmony filtering
            current_channel = None
            buffer = ""
            in_final_channel = False

            # Yield chunks with channel filtering
            for chunk in stream_gen:
                token = chunk.get("token", "")
                buffer += token

                # Detect channel transitions
                if "<|channel|>" in buffer:
                    # Extract channel name after <|channel|>
                    if "<|message|>" in buffer:
                        channel_match = buffer.split("<|channel|>")[1].split("<|message|>")[0]
                        current_channel = channel_match.strip()
                        in_final_channel = (current_channel == "final")
                        logger.debug(f"📺 [Harmony Stream] Channel: {current_channel}")
                        # Clear buffer after detection
                        buffer = buffer.split("<|message|>", 1)[1] if "<|message|>" in buffer else ""
                        continue

                # Only yield tokens if we're in the 'final' channel
                if in_final_channel and token and not token.startswith("<|"):
                    yield GenerationChunk(
                        token=token,
                        is_final=chunk.get("is_final", False),
                        finish_reason=chunk.get("finish_reason"),
                    )

        except ModelNotLoadedError:
            raise
        except ValueError as e:
            raise InvalidMessagesError(f"Invalid messages: {e}")
        except Exception as e:
            raise GenerationError(f"Streaming generation failed: {e}")

    def _validate_messages(self, messages: list[dict[str, str]]) -> None:
        """
        Validate message format.

        Args:
            messages: List of message dicts

        Raises:
            ValueError: If messages invalid
        """
        if not messages:
            raise ValueError("Messages list cannot be empty")

        for msg in messages:
            if "role" not in msg or "content" not in msg:
                raise ValueError("Each message must have 'role' and 'content'")

            if msg["role"] not in ["system", "user", "assistant"]:
                raise ValueError(f"Invalid role: {msg['role']}")

            if not msg["content"].strip():
                raise ValueError("Message content cannot be empty")

    def _build_prompt(
        self, messages: list[dict[str, str]], params: GenerationParams
    ) -> str:
        """
        Convert OpenAI messages to Harmony format prompt string.

        Builds complete Harmony format prompt with:
        1. System message (metadata, reasoning level, channels)
        2. Developer message (instructions from system role)
        3. Conversation history (user/assistant with proper tokens)
        4. Completion trigger (starts new assistant response)

        Args:
            messages: List of {role, content} dicts
            params: Generation parameters (temperature maps to reasoning)

        Returns:
            Formatted Harmony prompt string with special tokens
        """
        # Build Harmony format sections
        system_msg = self._build_harmony_system_message(params)
        developer_msg = self._build_harmony_developer_message(messages)
        conversation = self._build_harmony_conversation(messages)

        # Combine all sections with completion trigger
        # The trigger starts a new assistant response
        prompt = f"{system_msg}{developer_msg}{conversation}<|start|>assistant"

        return prompt

    def _count_tokens(self, text: str) -> int:
        """
        Estimate token count for text.

        Uses simple heuristic: ~4 characters per token.

        Args:
            text: Text to count tokens for

        Returns:
            Estimated token count
        """
        # Simple heuristic: ~4 characters per token
        # This is a rough approximation for English text
        return max(1, len(text) // 4)

    # ========================================================================
    # Harmony Format Utilities
    # ========================================================================

    def _build_harmony_system_message(self, params: GenerationParams) -> str:
        """
        Build Harmony format system message with metadata and reasoning level.

        System message contains:
        - Model identity
        - Knowledge cutoff date
        - Current date
        - Reasoning effort level (mapped from temperature)
        - Channel definitions

        Args:
            params: Generation parameters (temperature maps to reasoning level)

        Returns:
            Formatted system message with Harmony special tokens
        """
        from datetime import datetime

        # Map temperature to reasoning level
        # Low temp (≤0.3) → low reasoning (fast, factual)
        # Med temp (0.4-0.7) → medium reasoning (balanced)
        # High temp (≥0.8) → high reasoning (creative, thorough)
        if params.temperature <= 0.3:
            reasoning = "low"
        elif params.temperature >= 0.8:
            reasoning = "high"
        else:
            reasoning = "medium"

        # Get current date
        current_date = datetime.now().strftime('%Y-%m-%d')

        # Build system message following Harmony spec
        return (
            "<|start|>system<|message|>"
            "You are ChatGPT, a large language model trained by OpenAI.\n"
            "Knowledge cutoff: 2024-06\n"
            f"Current date: {current_date}\n\n"
            f"Reasoning: {reasoning}\n\n"
            "# Valid channels: analysis, commentary, final. "
            "Channel must be included for every message.<|end|>"
        )

    def _build_harmony_developer_message(
        self, messages: list[dict[str, str]]
    ) -> str:
        """
        Build Harmony format developer message with instructions.

        Developer message contains the "system prompt" - the instructions
        that define model behavior. Extracts this from any system role
        messages in the input.

        Args:
            messages: List of message dicts (may contain system role)

        Returns:
            Formatted developer message with instructions
        """
        # Extract system message content as instructions
        system_content = None
        for msg in messages:
            if msg["role"] == "system":
                system_content = msg["content"]
                break

        # Default instructions if no system message provided
        if not system_content:
            system_content = "You are a helpful AI assistant."

        return (
            "<|start|>developer<|message|>"
            "# Instructions\n\n"
            f"{system_content}<|end|>"
        )

    def _build_harmony_conversation(self, messages: list[dict[str, str]]) -> str:
        """
        Build Harmony format conversation history from messages.

        Converts user/assistant messages to Harmony format with proper
        special tokens and channel specifications. System messages are
        handled separately in developer message.

        Args:
            messages: List of message dicts with role and content

        Returns:
            Formatted conversation string with Harmony tokens
        """
        parts = []

        for msg in messages:
            role = msg["role"]
            content = msg["content"]

            if role == "system":
                # System messages go in developer section, skip here
                continue

            elif role == "user":
                # User messages: simple format
                parts.append(f"<|start|>user<|message|>{content}<|end|>")

            elif role == "assistant":
                # Previous assistant turns go to 'final' channel
                # This represents completed responses from prior turns
                parts.append(
                    f"<|start|>assistant<|channel|>final"
                    f"<|message|>{content}<|end|>"
                )

        return "".join(parts)

    def _parse_harmony_response(self, raw_output: str) -> tuple[str, str]:
        """
        Parse Harmony format response and extract both 'final' and 'analysis' channels.

        The gpt-oss-20b model outputs multiple channels:
        - 'analysis': Internal chain-of-thought (UNSAFE for direct user display)
        - 'commentary': Tool call preambles and explanations
        - 'final': User-facing response (SAFE - filtered for safety)

        This method extracts BOTH the 'final' and 'analysis' channel content.
        The analysis channel is used for thinking blocks in the dashboard.

        Example input:
            <|channel|>analysis<|message|>User asks "2+2". Simple math.<|end|>
            <|start|>assistant<|channel|>final<|message|>2 + 2 = 4<|return|>

        Example output:
            ("2 + 2 = 4", "User asks \"2+2\". Simple math.")

        Args:
            raw_output: Raw model output with Harmony special tokens

        Returns:
            Tuple of (final_channel_text, analysis_channel_text)
        """
        import re

        # Pattern to match Harmony message structure
        # We need to handle both formats:
        # 1. <|start|>assistant<|channel|>final<|message|>content<|end|>
        # 2. <|channel|>final<|message|>content<|end|>

        # Use a single comprehensive pattern that captures channel and content
        # This pattern matches channel specifications followed by message content
        # The (?:...) groups are non-capturing to avoid duplication

        # Match: optional <|start|>assistant, then <|channel|>NAME<|message|>CONTENT<stop>
        pattern = r'(?:<\|start\|>assistant)?<\|channel\|>(.*?)<\|message\|>(.*?)(?:<\|end\|>|<\|return\|>)'

        matches = re.findall(pattern, raw_output, re.DOTALL)

        # Extract both 'final' and 'analysis' channel content
        final_content = []
        analysis_content = []

        for channel, content in matches:
            channel_name = channel.strip()
            if channel_name == "final":
                final_content.append(content)
            elif channel_name == "analysis":
                analysis_content.append(content)

        # Build final text
        final_text = ""
        if final_content:
            final_text = "".join(final_content).strip()
        else:
            # Fallback: If no channels found, check if there's plain text
            # This handles cases where model doesn't use channels properly
            # Remove all special tokens and return remaining text
            fallback_text = re.sub(r'<\|[^|]+\|>', '', raw_output).strip()
            if fallback_text:
                final_text = fallback_text

        # Build analysis text
        analysis_text = "".join(analysis_content).strip() if analysis_content else ""

        return (final_text, analysis_text)

    def _detect_harmony_stop_reason(self, raw_output: str) -> str:
        """
        Detect stop reason from Harmony format output.

        Harmony uses special stop tokens:
        - <|return|>: Model completed response normally
        - <|call|>: Model wants to call a tool
        - <|end|>: Message boundary (not a true stop)

        Args:
            raw_output: Raw model output with Harmony tokens

        Returns:
            Stop reason: "stop", "tool_use", or "length"
        """
        if "<|return|>" in raw_output:
            return "stop"
        elif "<|call|>" in raw_output:
            return "tool_use"
        else:
            # If neither stop token found, assume max length reached
            return "length"
