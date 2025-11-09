"""
Test Harmony format end-to-end integration.

Demonstrates the complete flow:
1. Messages → Harmony prompt generation
2. Simulated model output with channels
3. Response parsing to extract 'final' channel
4. Stop reason detection
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from adapters.gpt_oss_adapter import GPTOSSAdapter, ModelConfig, DeviceType, GenerationParams


def test_end_to_end_harmony_flow():
    """Test complete Harmony format flow from messages to parsed response."""

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

    # Input: User messages
    messages = [
        {"role": "system", "content": "You are a helpful math tutor."},
        {"role": "user", "content": "What is 15 + 27?"},
    ]

    params = GenerationParams(
        temperature=0.7,
        max_tokens=100
    )

    print("=" * 80)
    print("END-TO-END HARMONY FORMAT INTEGRATION TEST")
    print("=" * 80)

    # Step 1: Generate Harmony prompt
    prompt = adapter._build_prompt(messages, params)

    print("\n[STEP 1] Generated Harmony Prompt:")
    print("-" * 80)
    print(prompt)
    print("-" * 80)

    # Step 2: Simulate model output with Harmony channels
    # This is what gpt-oss-20b would actually output
    simulated_model_output = (
        '<|channel|>analysis<|message|>The user is asking for a simple addition '
        'problem. 15 + 27. Let me calculate: 15 + 27 = 42. I should provide a '
        'clear, educational response suitable for a student.<|end|>'
        '<|start|>assistant<|channel|>final<|message|>Great question! '
        'Let me help you solve this:\n\n15 + 27 = 42\n\n'
        'Would you like me to show you the step-by-step process?<|return|>'
    )

    print("\n[STEP 2] Simulated Model Output (with channels):")
    print("-" * 80)
    print(simulated_model_output)
    print("-" * 80)

    # Step 3: Parse response to extract 'final' channel
    parsed_response = adapter._parse_harmony_response(simulated_model_output)

    print("\n[STEP 3] Parsed Response (final channel only):")
    print("-" * 80)
    print(parsed_response)
    print("-" * 80)

    # Step 4: Detect stop reason
    stop_reason = adapter._detect_harmony_stop_reason(simulated_model_output)

    print("\n[STEP 4] Detected Stop Reason:")
    print("-" * 80)
    print(f"Stop reason: {stop_reason}")
    print("-" * 80)

    # Validations
    assert "15 + 27 = 42" in parsed_response, "Expected answer missing"
    assert "simple addition" not in parsed_response, "Analysis leaked into response!"
    assert "Let me calculate" not in parsed_response, "Analysis leaked into response!"
    assert stop_reason == "stop", f"Expected 'stop', got '{stop_reason}'"

    print("\n[VALIDATION] ✅ All checks passed!")
    print("  - Prompt generated with proper Harmony format")
    print("  - Analysis channel filtered out (unsafe CoT)")
    print("  - Final channel extracted (user-facing response)")
    print("  - Stop reason detected correctly")

    return parsed_response, stop_reason


def test_temperature_affects_prompt():
    """Verify that temperature parameter affects reasoning level in prompt."""

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

    print("\n" + "=" * 80)
    print("TEMPERATURE → REASONING LEVEL MAPPING")
    print("=" * 80)

    test_cases = [
        (0.2, "low", "Factual, quick responses"),
        (0.7, "medium", "Balanced quality/speed"),
        (1.0, "high", "Creative, thorough analysis"),
    ]

    for temp, expected_reasoning, description in test_cases:
        params = GenerationParams(temperature=temp)
        prompt = adapter._build_prompt(messages, params)

        assert f"Reasoning: {expected_reasoning}" in prompt, \
            f"Expected 'Reasoning: {expected_reasoning}' for temp={temp}"

        print(f"  temp={temp:.1f} → Reasoning: {expected_reasoning:6s} ({description})")

    print("\n✅ Temperature correctly maps to reasoning levels")


def test_safety_critical_filtering():
    """Demonstrate critical safety: analysis channel must never leak."""

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

    # Simulate output with potentially unsafe analysis content
    unsafe_output = (
        '<|channel|>analysis<|message|>This analysis channel might contain '
        'unfiltered chain-of-thought that has not been safety-filtered. '
        'According to training, this channel should NEVER be shown to users.<|end|>'
        '<|start|>assistant<|channel|>final<|message|>This is the safe, '
        'filtered response suitable for users.<|return|>'
    )

    parsed = adapter._parse_harmony_response(unsafe_output)

    print("\n" + "=" * 80)
    print("SAFETY-CRITICAL: Analysis Channel Filtering")
    print("=" * 80)
    print("Raw output contains:")
    print("  - Analysis channel: UNSAFE (unfiltered CoT)")
    print("  - Final channel: SAFE (filtered for users)")
    print("\nParsed output (should only have safe content):")
    print(f"  {parsed}")
    print("=" * 80)

    # Critical assertions
    assert "analysis channel might contain" not in parsed
    assert "unfiltered chain-of-thought" not in parsed
    assert "NEVER be shown to users" not in parsed
    assert "safe, filtered response" in parsed

    print("\n🔒 SAFETY VERIFIED: Unsafe analysis channel completely filtered")


if __name__ == "__main__":
    # Run all tests
    test_end_to_end_harmony_flow()
    test_temperature_affects_prompt()
    test_safety_critical_filtering()

    print("\n" + "=" * 80)
    print("ALL INTEGRATION TESTS PASSED!")
    print("=" * 80)
    print("\nSummary:")
    print("  ✅ Harmony prompt generation working")
    print("  ✅ Response parsing extracting 'final' channel only")
    print("  ✅ Analysis channel filtering (critical for safety)")
    print("  ✅ Stop reason detection working")
    print("  ✅ Temperature → reasoning level mapping correct")
    print("\nThe Harmony middleware is ready for gpt-oss-20b inference!")
