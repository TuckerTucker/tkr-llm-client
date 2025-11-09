"""
Test Harmony format with actual gpt-oss-20b model.

This script tests the complete Harmony middleware with the real local model.
It requires the model to be loaded and available.

Usage:
    # Set environment variables first
    export LLM_MODEL_PATH=./models
    export LLM_MODEL_PATH=./models
    export LLM_MODEL_NAME=mlx-community/gpt-oss-20b-MXFP4-Q8
    export LLM_DEVICE=auto
    export LLM_QUANTIZATION=int4

    # Run test
    python3 llm_server/tests/test_live_model.py
"""

import asyncio
import os
import sys

# Add parent directories to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, './models')

from adapters.gpt_oss_adapter import (
    GPTOSSAdapter,
    ModelConfig,
    DeviceType,
    GenerationParams
)


async def test_with_live_model():
    """Test Harmony format with actual gpt-oss-20b model."""

    print("=" * 80)
    print("LIVE MODEL TEST: Harmony Format with gpt-oss-20b")
    print("=" * 80)

    # Configuration
    model_path = os.environ.get(
        'LLM_MODEL_PATH',
        './models'
    )
    model_name = os.environ.get('LLM_MODEL_NAME', 'mlx-community/gpt-oss-20b-MXFP4-Q8')
    device = os.environ.get('LLM_DEVICE', 'auto')
    quantization = os.environ.get('LLM_QUANTIZATION', 'int4')

    print(f"\nConfiguration:")
    print(f"  Model path: {model_path}")
    print(f"  Model name: {model_name}")
    print(f"  Device: {device}")
    print(f"  Quantization: {quantization}")

    # Check if model path exists
    if not os.path.exists(model_path):
        print(f"\n❌ ERROR: Model path not found: {model_path}")
        print("Please set LLM_MODEL_PATH environment variable")
        return False

    # Create adapter configuration
    config = ModelConfig(
        model_path=model_path,
        model_name=model_name,
        device=DeviceType(device.lower()),
        quantization=quantization,
    )

    # Create adapter
    try:
        print("\n🔄 Creating adapter...")
        adapter = GPTOSSAdapter(config)
    except Exception as e:
        print(f"\n❌ Failed to create adapter: {e}")
        return False

    # Load model
    try:
        print("🔄 Loading model (this may take a few minutes)...")
        await adapter.load_model()
        print("✅ Model loaded successfully!")
    except Exception as e:
        print(f"\n❌ Failed to load model: {e}")
        print("\nTroubleshooting:")
        print("  1. Verify model path is correct")
        print("  2. Check that all dependencies are installed")
        print("  3. Ensure sufficient memory is available")
        return False

    # Test cases
    test_cases = [
        {
            "name": "Simple Arithmetic (Low Reasoning)",
            "messages": [
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "What is 15 + 27?"}
            ],
            "params": GenerationParams(temperature=0.2, max_tokens=100),
            "expected_reasoning": "low"
        },
        {
            "name": "Explanation Task (Medium Reasoning)",
            "messages": [
                {"role": "system", "content": "You are a helpful teacher."},
                {"role": "user", "content": "Explain photosynthesis in simple terms."}
            ],
            "params": GenerationParams(temperature=0.7, max_tokens=200),
            "expected_reasoning": "medium"
        },
        {
            "name": "Creative Task (High Reasoning)",
            "messages": [
                {"role": "user", "content": "Write a creative haiku about AI."}
            ],
            "params": GenerationParams(temperature=1.0, max_tokens=150),
            "expected_reasoning": "high"
        }
    ]

    results = []

    for i, test_case in enumerate(test_cases, 1):
        print(f"\n{'=' * 80}")
        print(f"TEST {i}: {test_case['name']}")
        print(f"{'=' * 80}")
        print(f"Expected reasoning level: {test_case['expected_reasoning']}")
        print(f"Temperature: {test_case['params'].temperature}")

        try:
            # Generate response
            print("\n🔄 Generating response...")
            result = await adapter.generate(
                test_case['messages'],
                test_case['params']
            )

            print(f"\n✅ Generation complete!")
            print(f"   Tokens generated: {result.tokens_generated}")
            print(f"   Latency: {result.latency_ms:.0f}ms")
            print(f"   Finish reason: {result.finish_reason}")

            print(f"\n📝 Response (final channel only):")
            print("-" * 80)
            print(result.text)
            print("-" * 80)

            # Validation checks
            validations = []

            # Check that we got a response
            if result.text and len(result.text) > 0:
                validations.append("✅ Response generated")
            else:
                validations.append("❌ Empty response")

            # Check that analysis channel was filtered
            # (we can't directly verify, but response should be clean text)
            if "<|channel|>" not in result.text and "<|message|>" not in result.text:
                validations.append("✅ No Harmony tokens in output (properly filtered)")
            else:
                validations.append("❌ Harmony tokens found in output (filtering failed)")

            # Check token count is reasonable
            if result.tokens_generated > 0:
                validations.append(f"✅ Generated {result.tokens_generated} tokens")
            else:
                validations.append("❌ No tokens generated")

            print(f"\nValidations:")
            for validation in validations:
                print(f"  {validation}")

            results.append({
                "test": test_case['name'],
                "success": all("✅" in v for v in validations),
                "tokens": result.tokens_generated,
                "latency_ms": result.latency_ms
            })

        except Exception as e:
            print(f"\n❌ Test failed with error: {e}")
            import traceback
            traceback.print_exc()
            results.append({
                "test": test_case['name'],
                "success": False,
                "error": str(e)
            })

    # Unload model
    print(f"\n{'=' * 80}")
    print("Cleaning up...")
    print(f"{'=' * 80}")
    await adapter.unload_model()
    print("✅ Model unloaded")

    # Summary
    print(f"\n{'=' * 80}")
    print("TEST SUMMARY")
    print(f"{'=' * 80}")

    successful = sum(1 for r in results if r.get('success', False))
    total = len(results)

    for result in results:
        status = "✅ PASS" if result.get('success', False) else "❌ FAIL"
        print(f"{status} - {result['test']}")
        if 'tokens' in result:
            print(f"         {result['tokens']} tokens, {result['latency_ms']:.0f}ms")
        if 'error' in result:
            print(f"         Error: {result['error']}")

    print(f"\nResults: {successful}/{total} tests passed")

    if successful == total:
        print("\n🎉 All tests passed! Harmony format working correctly with live model.")
        return True
    else:
        print(f"\n⚠️  {total - successful} test(s) failed. Please review errors above.")
        return False


async def quick_test():
    """Quick sanity test - just verify model loads and generates something."""

    print("=" * 80)
    print("QUICK SANITY TEST")
    print("=" * 80)

    model_path = os.environ.get(
        'LLM_MODEL_PATH',
        './models'
    )

    if not os.path.exists(model_path):
        print(f"❌ Model path not found: {model_path}")
        return False

    config = ModelConfig(
        model_path=model_path,
        model_name=os.environ.get('LLM_MODEL_NAME', 'mlx-community/gpt-oss-20b-MXFP4-Q8'),
        device=DeviceType.AUTO,
        quantization='int4',
    )

    adapter = GPTOSSAdapter(config)

    print("Loading model...")
    await adapter.load_model()

    print("Generating test response...")
    result = await adapter.generate(
        [{"role": "user", "content": "Say 'Hello, World!' and nothing else."}],
        GenerationParams(temperature=0.1, max_tokens=20)
    )

    print(f"\nResponse: {result.text}")
    print(f"Tokens: {result.tokens_generated}")

    await adapter.unload_model()

    if result.text and len(result.text) > 0:
        print("\n✅ Quick test passed!")
        return True
    else:
        print("\n❌ Quick test failed - no response generated")
        return False


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Test Harmony format with live gpt-oss-20b model")
    parser.add_argument('--quick', action='store_true', help='Run quick sanity test only')
    args = parser.parse_args()

    if args.quick:
        success = asyncio.run(quick_test())
    else:
        success = asyncio.run(test_with_live_model())

    sys.exit(0 if success else 1)
