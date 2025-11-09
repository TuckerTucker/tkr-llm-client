"""
Harmony Prompt Builder Interface Contract

This contract defines the interface between HarmonyPromptBuilder and its consumers
(InferenceEngine, CLI, conversation management).

SPECIFICATION VERSION: 1.0
FROZEN: Yes - Do not modify without coordination
"""

from dataclasses import dataclass
from typing import List, Optional, Dict, Any
from enum import Enum


class ReasoningLevel(Enum):
    """Reasoning effort level for GPT-OSS models."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


@dataclass
class HarmonyPrompt:
    """
    A rendered Harmony prompt ready for model input.

    Attributes:
        token_ids: List of token IDs for model input (MLX-compatible)
        text: Human-readable text representation (for debugging)
        metadata: Additional prompt metadata
    """
    token_ids: List[int]
    text: str
    metadata: Dict[str, Any]


class HarmonyPromptBuilderInterface:
    """
    Interface contract for HarmonyPromptBuilder.

    All implementations MUST adhere to this interface.
    """

    def build_system_prompt(
        self,
        reasoning_level: ReasoningLevel,
        knowledge_cutoff: str,
        current_date: str,
        include_function_tools: bool = False
    ) -> HarmonyPrompt:
        """
        Build Harmony system message.

        MUST include:
        - Identity: "You are ChatGPT, a large language model trained by OpenAI."
        - Knowledge cutoff date
        - Current date
        - Reasoning level: high/medium/low
        - Valid channels declaration
        - Function tool channel routing (if include_function_tools=True)

        Args:
            reasoning_level: LOW/MEDIUM/HIGH
            knowledge_cutoff: e.g., "2024-06"
            current_date: e.g., "2025-10-27"
            include_function_tools: Whether to include function tool routing

        Returns:
            HarmonyPrompt with system message tokens

        Raises:
            ValueError: If parameters are invalid
        """
        raise NotImplementedError

    def build_developer_prompt(
        self,
        instructions: str,
        function_tools: Optional[List[Dict]] = None
    ) -> HarmonyPrompt:
        """
        Build Harmony developer message.

        MUST include:
        - "# Instructions" header
        - User-provided instructions
        - "# Tools" section (if function_tools provided)
        - Proper TypeScript-like function schema formatting

        Args:
            instructions: Developer instructions (system prompt content)
            function_tools: Optional list of function tool definitions

        Returns:
            HarmonyPrompt with developer message tokens

        Raises:
            ValueError: If instructions empty or tools malformed
        """
        raise NotImplementedError

    def build_conversation(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[HarmonyPrompt] = None,
        developer_prompt: Optional[HarmonyPrompt] = None,
        include_generation_prompt: bool = True
    ) -> HarmonyPrompt:
        """
        Build complete Harmony conversation.

        MUST:
        - Include system_prompt first (if provided)
        - Include developer_prompt second (if provided)
        - Convert messages to Harmony format
        - Add generation prompt if requested
        - Validate message structure

        Message format:
        [
            {"role": "user", "content": "..."},
            {"role": "assistant", "content": "...", "channel": "final"},
            ...
        ]

        Args:
            messages: List of conversation messages
            system_prompt: Optional pre-built system prompt
            developer_prompt: Optional pre-built developer prompt
            include_generation_prompt: Add <|start|>assistant at end

        Returns:
            HarmonyPrompt with complete conversation tokens

        Raises:
            ValueError: If message structure invalid
        """
        raise NotImplementedError


# Quality Contract: Performance Requirements
PERFORMANCE_CONTRACT = {
    "build_system_prompt": {
        "max_latency_ms": 50,
        "description": "System prompt building must be fast (one-time cost)"
    },
    "build_developer_prompt": {
        "max_latency_ms": 100,
        "description": "Developer prompt may include tool schemas"
    },
    "build_conversation": {
        "max_latency_ms": 10,  # per message
        "description": "Conversation building scales linearly with messages"
    }
}

# Quality Contract: Reliability Requirements
RELIABILITY_CONTRACT = {
    "thread_safety": "All methods must be thread-safe (stateless)",
    "error_handling": "Must validate all inputs and raise ValueError with clear messages",
    "idempotency": "Same inputs must produce same outputs (deterministic)"
}

# Quality Contract: Compatibility Requirements
COMPATIBILITY_CONTRACT = {
    "openai_harmony_version": ">=0.0.4",
    "python_version": ">=3.10",
    "mlx_token_format": "List[int] compatible with mlx_lm.generate()"
}
