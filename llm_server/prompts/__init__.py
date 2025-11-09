"""
Prompt templates and presets module.

This module provides tools for formatting prompts and managing system prompts:
- Pre-configured system prompt presets
- Custom preset creation
- Fluent builders for complex prompts
- Harmony format support (native implementation)

Main exports:
- Preset functions: get_preset, list_presets
- Builder classes: SystemPromptBuilder
- Harmony classes: HarmonyPromptBuilder, HarmonyResponseParser

Note: Only gpt-oss-20b with Harmony format is supported.
"""

from .presets import (
    PRESETS,
    get_preset,
    get_preset_info,
    get_available_presets,
    list_presets,
    create_custom_preset,
    combine_presets,
    create_custom_prompt,
    SystemPromptBuilder,
)

from .harmony_native import (
    HarmonyPromptBuilder,
    HarmonyResponseParser,
    HarmonyPrompt,
    ParsedHarmonyResponse,
    ReasoningLevel,
)

__all__ = [
    # Preset constants
    "PRESETS",
    # Preset functions
    "get_preset",
    "get_preset_info",
    "get_available_presets",
    "list_presets",
    "create_custom_preset",
    "combine_presets",
    "create_custom_prompt",
    # Preset classes
    "SystemPromptBuilder",
    # Harmony (native implementation for gpt-oss-20b)
    "HarmonyPromptBuilder",
    "HarmonyResponseParser",
    "HarmonyPrompt",
    "ParsedHarmonyResponse",
    "ReasoningLevel",
]

__version__ = "1.0.0"
