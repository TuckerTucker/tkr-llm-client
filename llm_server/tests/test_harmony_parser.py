"""
Test Harmony response parser.

Validates that the parser correctly extracts 'final' channel content
and discards 'analysis' channel (unsafe chain-of-thought).
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from adapters.gpt_oss_adapter import GPTOSSAdapter, ModelConfig, DeviceType


def test_parse_complete_harmony_response():
    """Test parsing complete Harmony response with analysis and final channels."""

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

    # Simulate complete Harmony output with both analysis and final channels
    raw_output = (
        '<|channel|>analysis<|message|>User asks: "What is 2 + 2?" '
        'This is simple arithmetic. I should provide the answer directly.<|end|>'
        '<|start|>assistant<|channel|>final<|message|>2 + 2 equals 4.<|return|>'
    )

    parsed = adapter._parse_harmony_response(raw_output)

    print("=" * 80)
    print("TEST: Complete Harmony Response")
    print("=" * 80)
    print("Raw output:")
    print(raw_output)
    print("\nParsed (final channel only):")
    print(parsed)
    print("=" * 80)

    assert parsed == "2 + 2 equals 4.", f"Expected '2 + 2 equals 4.', got '{parsed}'"
    assert "User asks" not in parsed, "Analysis channel content leaked into output!"
    assert "simple arithmetic" not in parsed, "Analysis channel content leaked!"

    print("✅ Analysis channel correctly filtered out")
    print("✅ Final channel extracted successfully")


def test_parse_multiple_final_messages():
    """Test parsing response with multiple final channel messages."""

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

    # Multiple final channel messages (might happen in multi-turn reasoning)
    raw_output = (
        '<|channel|>analysis<|message|>Breaking down the problem...<|end|>'
        '<|start|>assistant<|channel|>final<|message|>First, let me clarify: <|end|>'
        '<|channel|>analysis<|message|>User seems confused...<|end|>'
        '<|start|>assistant<|channel|>final<|message|>The answer is 4.<|return|>'
    )

    parsed = adapter._parse_harmony_response(raw_output)

    print("\n" + "=" * 80)
    print("TEST: Multiple Final Channel Messages")
    print("=" * 80)
    print("Parsed output:")
    print(parsed)
    print("=" * 80)

    # Should combine all final channel content
    assert "First, let me clarify:" in parsed
    assert "The answer is 4." in parsed
    assert "Breaking down" not in parsed
    assert "User seems confused" not in parsed

    print("✅ Multiple final channel messages combined")
    print("✅ All analysis channel content filtered")


def test_detect_stop_reasons():
    """Test detection of Harmony stop tokens."""

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

    # Test <|return|> stop token
    output_return = '<|channel|>final<|message|>Done!<|return|>'
    reason_return = adapter._detect_harmony_stop_reason(output_return)
    assert reason_return == "stop", f"Expected 'stop', got '{reason_return}'"

    # Test <|call|> stop token (tool calling)
    output_call = '<|channel|>commentary to=functions.get_weather<|message|>{"location":"SF"}<|call|>'
    reason_call = adapter._detect_harmony_stop_reason(output_call)
    assert reason_call == "tool_use", f"Expected 'tool_use', got '{reason_call}'"

    # Test no stop token (max length)
    output_length = '<|channel|>final<|message|>Incomplete response...'
    reason_length = adapter._detect_harmony_stop_reason(output_length)
    assert reason_length == "length", f"Expected 'length', got '{reason_length}'"

    print("\n" + "=" * 80)
    print("TEST: Stop Reason Detection")
    print("=" * 80)
    print("✅ <|return|> detected as 'stop'")
    print("✅ <|call|> detected as 'tool_use'")
    print("✅ No stop token detected as 'length'")


def test_fallback_no_channels():
    """Test fallback behavior when model doesn't use channels."""

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

    # Model output without proper channel formatting
    raw_output = "Just plain text response without channels"
    parsed = adapter._parse_harmony_response(raw_output)

    print("\n" + "=" * 80)
    print("TEST: Fallback (No Channels)")
    print("=" * 80)
    print("Raw output:", raw_output)
    print("Parsed output:", parsed)
    print("=" * 80)

    assert parsed == "Just plain text response without channels"
    print("✅ Fallback to plain text works")


def test_empty_response():
    """Test handling of empty or malformed responses."""

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

    # Empty output
    parsed_empty = adapter._parse_harmony_response("")
    assert parsed_empty == "", "Empty input should return empty string"

    # Only special tokens, no content
    parsed_tokens = adapter._parse_harmony_response("<|start|><|end|><|return|>")
    assert parsed_tokens == "", "Only tokens should return empty string"

    print("\n" + "=" * 80)
    print("TEST: Empty/Malformed Responses")
    print("=" * 80)
    print("✅ Empty input handled correctly")
    print("✅ Token-only input handled correctly")


if __name__ == "__main__":
    test_parse_complete_harmony_response()
    test_parse_multiple_final_messages()
    test_detect_stop_reasons()
    test_fallback_no_channels()
    test_empty_response()

    print("\n" + "=" * 80)
    print("ALL HARMONY PARSER TESTS PASSED!")
    print("=" * 80)
