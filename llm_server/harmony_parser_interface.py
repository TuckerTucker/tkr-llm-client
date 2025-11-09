"""
Harmony Response Parser Interface Contract

This contract defines the interface between HarmonyResponseParser and its consumers
(InferenceEngine, CLI display, conversation history).

SPECIFICATION VERSION: 1.0
FROZEN: Yes - Do not modify without coordination
"""

from dataclasses import dataclass
from typing import Optional, Dict, List


@dataclass
class ParsedHarmonyResponse:
    """
    Parsed multi-channel response from a Harmony model.

    INTERFACE STABILITY: This structure is frozen and must not change.
    All consumers depend on these exact fields.

    Attributes:
        final: User-facing response content (ALWAYS present, may be empty)
        analysis: Internal reasoning/chain-of-thought (OPTIONAL, not user-safe)
        commentary: Meta-commentary about actions taken (OPTIONAL)
        channels: Dict of all channels found (for advanced usage)
        metadata: Parser metadata (token count, parsing time, etc.)
    """
    final: str
    analysis: Optional[str] = None
    commentary: Optional[str] = None
    channels: Optional[Dict[str, str]] = None
    metadata: Optional[Dict[str, any]] = None


class HarmonyResponseParserInterface:
    """
    Interface contract for HarmonyResponseParser.

    All implementations MUST adhere to this interface.
    """

    def parse_response_tokens(
        self,
        token_ids: List[int],
        extract_final_only: bool = False
    ) -> ParsedHarmonyResponse:
        """
        Parse response token IDs into channels.

        MUST:
        - Use openai-harmony StreamableParser
        - Extract all channels (analysis, commentary, final)
        - Handle incomplete responses gracefully
        - Validate Harmony format structure
        - Return final="" if parsing fails (never None)

        If extract_final_only=True:
        - Only extract final channel (optimization)
        - analysis and commentary will be None

        Args:
            token_ids: Token IDs from model output
            extract_final_only: Skip analysis/commentary extraction

        Returns:
            ParsedHarmonyResponse with extracted channels

        Raises:
            ValueError: If tokens are malformed or empty
            HarmonyFormatError: If response doesn't follow Harmony format
        """
        raise NotImplementedError

    def parse_response_text(
        self,
        response_text: str,
        tokenizer: any,  # Tokenizer with encode() method
        extract_final_only: bool = False
    ) -> ParsedHarmonyResponse:
        """
        Parse response text into channels.

        MUST:
        - Encode text to tokens using provided tokenizer
        - Call parse_response_tokens()
        - Handle encoding errors gracefully

        This is a convenience method for when MLX returns strings.

        Args:
            response_text: Text response from model
            tokenizer: Tokenizer for encoding text to tokens
            extract_final_only: Skip analysis/commentary extraction

        Returns:
            ParsedHarmonyResponse with extracted channels

        Raises:
            ValueError: If text is empty or tokenizer fails
            HarmonyFormatError: If response doesn't follow Harmony format
        """
        raise NotImplementedError

    def validate_harmony_format(
        self,
        token_ids: List[int]
    ) -> bool:
        """
        Validate if tokens follow Harmony format.

        MUST check:
        - Contains <|start|> and <|end|> tokens
        - Has valid role after <|start|>
        - Has <|message|> token
        - Proper nesting structure

        Args:
            token_ids: Token IDs to validate

        Returns:
            True if valid Harmony format, False otherwise
        """
        raise NotImplementedError

    def extract_channel(
        self,
        parsed_response: ParsedHarmonyResponse,
        channel_name: str
    ) -> Optional[str]:
        """
        Extract specific channel from parsed response.

        Convenience method for accessing channels dict.

        Args:
            parsed_response: Previously parsed response
            channel_name: Channel to extract (e.g., "final", "analysis")

        Returns:
            Channel content or None if not found
        """
        raise NotImplementedError


# Quality Contract: Performance Requirements
PERFORMANCE_CONTRACT = {
    "parse_response_tokens": {
        "max_latency_ms": 5,  # per 1KB of response
        "description": "Token-based parsing is fast (StreamableParser optimized)"
    },
    "parse_response_text": {
        "max_latency_ms": 10,  # per 1KB of response (includes encoding)
        "description": "Text parsing includes encoding overhead"
    },
    "validate_harmony_format": {
        "max_latency_ms": 2,  # per 1KB of tokens
        "description": "Validation is lightweight"
    }
}

# Quality Contract: Reliability Requirements
RELIABILITY_CONTRACT = {
    "thread_safety": "All methods must be thread-safe (stateless)",
    "error_handling": "Must never crash on malformed input, return empty final instead",
    "channel_guarantee": "ParsedHarmonyResponse.final must NEVER be None (use empty string)",
    "graceful_degradation": "If parsing fails, return final=<cleaned_text> with best effort"
}

# Quality Contract: Safety Requirements
SAFETY_CONTRACT = {
    "analysis_warning": "NEVER display analysis channel to end users in production",
    "final_only_production": "Production systems should use extract_final_only=True",
    "sanitization": "No sanitization needed - channels are model output"
}

# Data Flow Specification
DATA_FLOW = """
MLX Model Output:
    ↓ (string or tokens)
    ↓
parse_response_text/tokens()
    ↓
StreamableParser (openai-harmony)
    ↓
Channel Extraction
    ↓
ParsedHarmonyResponse
    ↓
Consumer Usage:
    - CLI: Display parsed.final
    - Debug: Display parsed.analysis (dev only)
    - History: Store parsed.final
    - Metrics: Count tokens in parsed.metadata
"""
