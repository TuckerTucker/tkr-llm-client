"""
Test Harmony format prompt generation.

Quick validation that the new _build_prompt() generates proper Harmony format.
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from adapters.gpt_oss_adapter import GPTOSSAdapter, ModelConfig, DeviceType, GenerationParams


def test_harmony_prompt_format():
    """Test that Harmony format is generated correctly."""

    # Create minimal adapter (won't load model, just test prompt building)
    config = ModelConfig(
        model_path="/tmp",  # Dummy path
        model_name="test",
        device=DeviceType.CPU,
        quantization="none"
    )

    # Create adapter
    try:
        adapter = GPTOSSAdapter(config)
    except FileNotFoundError:
        # Expected - we're just testing prompt generation
        pass

    # Create test messages
    messages = [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "What is 2+2?"},
    ]

    params = GenerationParams(
        temperature=0.7,
        max_tokens=100
    )

    # Build prompt using private method (for testing)
    # In real code, this is called internally by generate()
    prompt = adapter._build_prompt(messages, params)

    print("=" * 80)
    print("HARMONY FORMAT PROMPT OUTPUT")
    print("=" * 80)
    print(prompt)
    print("=" * 80)

    # Validate structure
    assert "<|start|>system<|message|>" in prompt, "Missing system message start"
    assert "You are ChatGPT" in prompt, "Missing model identity"
    assert "Knowledge cutoff: 2024-06" in prompt, "Missing knowledge cutoff"
    assert "Reasoning: medium" in prompt, "Missing reasoning level (should be medium for temp=0.7)"
    assert "Valid channels: analysis, commentary, final" in prompt, "Missing channel definitions"

    assert "<|start|>developer<|message|>" in prompt, "Missing developer message start"
    assert "# Instructions" in prompt, "Missing instructions header"
    assert "You are a helpful assistant" in prompt, "Missing system content in developer message"

    assert "<|start|>user<|message|>What is 2+2?<|end|>" in prompt, "Missing user message"
    assert prompt.endswith("<|start|>assistant"), "Prompt should end with assistant trigger"

    print("\n✅ All Harmony format validations passed!")
    print("\nKey features:")
    print("  - System message with metadata and reasoning level")
    print("  - Developer message with instructions")
    print("  - Proper user message formatting")
    print("  - Completion trigger for assistant response")


def test_temperature_to_reasoning_mapping():
    """Test that temperature correctly maps to reasoning levels."""

    config = ModelConfig(
        model_path="/tmp",
        model_name="test",
        device=DeviceType.CPU,
        quantization="none"
    )

    try:
        adapter = GPTOSSAdapter(config)
    except FileNotFoundError:
        pass

    messages = [{"role": "user", "content": "Test"}]

    # Low temperature → low reasoning
    params_low = GenerationParams(temperature=0.2)
    prompt_low = adapter._build_prompt(messages, params_low)
    assert "Reasoning: low" in prompt_low

    # Medium temperature → medium reasoning
    params_med = GenerationParams(temperature=0.7)
    prompt_med = adapter._build_prompt(messages, params_med)
    assert "Reasoning: medium" in prompt_med

    # High temperature → high reasoning
    params_high = GenerationParams(temperature=1.0)
    prompt_high = adapter._build_prompt(messages, params_high)
    assert "Reasoning: high" in prompt_high

    print("\n✅ Temperature to reasoning level mapping working correctly!")
    print("  - temp ≤ 0.3 → low")
    print("  - temp 0.4-0.7 → medium")
    print("  - temp ≥ 0.8 → high")


if __name__ == "__main__":
    test_harmony_prompt_format()
    test_temperature_to_reasoning_mapping()
