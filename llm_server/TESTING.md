# Testing Harmony Format with gpt-oss-20b

This guide explains how to test the Harmony format middleware with the actual local gpt-oss-20b model.

## Prerequisites

1. **Model Available:**
   ```bash
   ls ./models
   ```

2. **Python Environment:**
   ```bash
   source llm_server/venv/bin/activate  # If using venv
   ```

3. **Dependencies Installed:**
   ```bash
   pip install -r llm_server/requirements.txt
   ```

## Testing Approaches

### Option 1: Direct Python Test (Recommended for Development)

Test the adapter directly without the HTTP server.

**Quick Sanity Test (30 seconds):**
```bash
export LLM_MODEL_PATH=./models
export LLM_MODEL_NAME=mlx-community/gpt-oss-20b-MXFP4-Q8

python3 llm_server/tests/test_live_model.py --quick
```

**Full Test Suite (5-10 minutes):**
```bash
python3 llm_server/tests/test_live_model.py
```

This will test:
- ✅ Model loading
- ✅ Harmony prompt generation with different reasoning levels
- ✅ Response parsing and channel filtering
- ✅ Safety validation (analysis channel filtered)

**Expected Output:**
```
================================================================================
LIVE MODEL TEST: Harmony Format with gpt-oss-20b
================================================================================

Configuration:
  Model path: ./models
  Model name: mlx-community/gpt-oss-20b-MXFP4-Q8
  Device: auto
  Quantization: int4

🔄 Creating adapter...
🔄 Loading model (this may take a few minutes)...
✅ Model loaded successfully!

================================================================================
TEST 1: Simple Arithmetic (Low Reasoning)
================================================================================
Expected reasoning level: low
Temperature: 0.2

🔄 Generating response...

✅ Generation complete!
   Tokens generated: 15
   Latency: 2340ms
   Finish reason: stop

📝 Response (final channel only):
--------------------------------------------------------------------------------
15 + 27 = 42
--------------------------------------------------------------------------------

Validations:
  ✅ Response generated
  ✅ No Harmony tokens in output (properly filtered)
  ✅ Generated 15 tokens

[...continues with more tests...]
```

### Option 2: Full Server Test (Recommended for Integration)

Test the complete HTTP server with curl.

**Start Server Manually:**
```bash
export LLM_MODEL_PATH=./models
export LLM_MODEL_PATH=./models
export LLM_MODEL_NAME=mlx-community/gpt-oss-20b-MXFP4-Q8
export LLM_DEVICE=auto
export LLM_QUANTIZATION=int4
export LLM_PORT=42002
export LLM_LOG_LEVEL=DEBUG  # See Harmony format details

python3 -m llm_server.server
```

**In Another Terminal - Test with Curl:**
```bash
# Test 1: Simple request
curl http://localhost:42002/v1/messages \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-sonnet-3-5",
    "messages": [
      {"role": "user", "content": "What is 15 + 27?"}
    ],
    "max_tokens": 100,
    "temperature": 0.7
  }' | python3 -m json.tool

# Test 2: With system message
curl http://localhost:42002/v1/messages \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-sonnet-3-5",
    "system": "You are a helpful math tutor.",
    "messages": [
      {"role": "user", "content": "Explain how to multiply fractions."}
    ],
    "max_tokens": 200,
    "temperature": 0.8
  }' | python3 -m json.tool
```

**Automated Server Test:**
```bash
./llm_server/tests/test_server_live.sh
```

This will:
1. Start the server
2. Wait for model to load
3. Run multiple test cases
4. Validate responses
5. Clean up

### Option 3: Unit Tests (Fast, No Model Required)

Run the unit tests that use mocked responses:

```bash
# Test Harmony prompt generation
python3 llm_server/tests/test_harmony_format.py

# Test response parsing
python3 llm_server/tests/test_harmony_parser.py

# Test end-to-end integration (mocked)
python3 llm_server/tests/test_harmony_integration.py

# Or run all at once
python3 llm_server/tests/test_harmony_format.py && \
python3 llm_server/tests/test_harmony_parser.py && \
python3 llm_server/tests/test_harmony_integration.py
```

## What to Look For

### ✅ Success Indicators

1. **Harmony Prompts Generated:**
   ```
   🎵 [Harmony] Generated prompt
      Reasoning level: medium (temp=0.7)
      Prompt length: 450 chars
   ```

2. **Model Inference:**
   ```
   🔄 [Harmony] Starting inference...
   ✅ [Harmony] Inference complete (2340ms)
   ```

3. **Channel Filtering:**
   ```
   📝 [Harmony] Raw output length: 850 chars
   ✂️  [Harmony] Parsed output length: 320 chars
   🔒 [Harmony] Filtered 530 chars (analysis channel removed)
   ```

4. **Clean Response (No Tokens):**
   - Response should NOT contain: `<|channel|>`, `<|message|>`, `<|return|>`, etc.
   - Response SHOULD contain: Clean, natural text

### ❌ Failure Indicators

1. **Harmony Tokens in Response:**
   ```json
   {
     "content": [{
       "text": "<|channel|>final<|message|>Hello world<|return|>"
     }]
   }
   ```
   **Problem:** Parser failed to filter tokens
   **Fix:** Check `_parse_harmony_response()` implementation

2. **Empty Responses:**
   ```json
   {
     "content": [{"text": ""}]
   }
   ```
   **Problem:** Parser might be too aggressive or model not using Harmony format
   **Fix:** Check logs for raw output, verify model supports Harmony

3. **Analysis Channel Leaking:**
   **Problem:** CRITICAL SAFETY ISSUE
   **Fix:** Immediately check filtering logic

## Debugging Tips

### Enable Debug Logging

```bash
export LLM_LOG_LEVEL=DEBUG
export LOG_LEVEL=DEBUG
```

Look for these log messages:
```
🎵 [Harmony] Generated prompt
   Reasoning level: medium (temp=0.7)
📝 [Harmony] Raw output length: 850 chars
✂️  [Harmony] Parsed output length: 320 chars
🔒 [Harmony] Filtered 530 chars (analysis channel removed)
🛑 [Harmony] Stop reason: stop
```

### Inspect Raw Model Output

Temporarily add logging to see raw output:

```python
# In gpt_oss_adapter.py, generate() method
raw_text = result.text
logger.info(f"RAW OUTPUT:\n{raw_text}")  # Add this line
parsed_text = self._parse_harmony_response(raw_text)
```

### Check Prompt Format

Log the generated prompt to verify structure:

```python
# In gpt_oss_adapter.py
prompt = self._build_prompt(messages, params)
logger.debug(f"FULL PROMPT:\n{prompt}")
```

Should contain:
- `<|start|>system<|message|>...`
- `<|start|>developer<|message|>...`
- `<|start|>user<|message|>...`
- `<|start|>assistant` (trigger)

## Common Issues

### Issue 1: Model Not Found

```
❌ Model path not found: /path/to/model
```

**Solution:**
```bash
export LLM_MODEL_PATH=./models
```

### Issue 2: Import Errors

```
ModuleNotFoundError: No module named 'src.sampling'
```

**Solution:** Model path needs to be in sys.path (adapter handles this automatically)

### Issue 3: Model Loading Timeout

**Solution:** Increase patience - model loading can take 2-5 minutes on first load

### Issue 4: Empty Responses

**Possible Causes:**
1. Model not using Harmony format correctly
2. Parser filtering too aggressively
3. Model configuration issue

**Debug:**
```python
# Check raw output
logger.info(f"Raw output: {result.text}")
logger.info(f"Parsed output: {parsed_text}")
```

## Performance Expectations

**Model Loading:**
- First load: 2-5 minutes (depending on hardware)
- Subsequent loads: 1-2 minutes

**Inference:**
- Simple queries (< 50 tokens): 1-3 seconds
- Medium responses (100-200 tokens): 3-8 seconds
- Long responses (> 200 tokens): 10-30 seconds

**Varies by:**
- Device (MPS faster than CPU)
- Quantization (int4 faster than fp16)
- Available memory

## Next Steps After Testing

Once tests pass with the live model:

1. **Configure Claude Code SDK** to use your local endpoint:
   ```json
   {
     "anthropic_api_base_url": "http://localhost:42002"
   }
   ```

2. **Monitor Production Usage:**
   - Watch logs for channel filtering
   - Validate responses don't contain Harmony tokens
   - Monitor performance metrics

3. **Optional Enhancements:**
   - Implement proper `o200k_harmony` tokenization
   - Add metrics/monitoring
   - Implement tool calling support

## Validation Checklist

Before considering testing complete:

- [ ] Unit tests pass (mocked)
- [ ] Quick sanity test passes (live model)
- [ ] Full live model test suite passes
- [ ] Server integration test passes
- [ ] Manual curl tests validate expected behavior
- [ ] Debug logging shows proper channel filtering
- [ ] No Harmony tokens in any responses
- [ ] Temperature → reasoning mapping works
- [ ] Multi-turn conversations work
- [ ] Performance is acceptable

Once all checked, the Harmony middleware is ready for production use! 🎉
