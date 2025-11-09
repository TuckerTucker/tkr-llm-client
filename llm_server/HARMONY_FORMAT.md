# Harmony Format Integration

This document describes the Harmony format middleware implementation for gpt-oss-20b inference.

## Overview

The llm_server now implements the **OpenAI Harmony format** for gpt-oss-20b, providing:
- Proper prompt formatting with system/developer/conversation structure
- Multi-channel response handling (analysis, commentary, final)
- Safety-critical filtering of unsafe chain-of-thought
- Temperature-based reasoning level mapping

## Architecture

```
Claude Code SDK (Anthropic API)
    ↓
routes/anthropic.py (API translation)
    ↓
adapters/gpt_oss_adapter.py (Harmony middleware)
    ↓ [Harmony prompt]
gpt-oss-20b Inference Engine
    ↓ [Multi-channel output]
Harmony Parser (channel filtering)
    ↓ [Safe, filtered response]
Anthropic API Response
```

## Harm ony Format Structure

### System Message
Contains metadata and reasoning configuration:
```
<|start|>system<|message|>You are ChatGPT, a large language model trained by OpenAI.
Knowledge cutoff: 2024-06
Current date: 2025-11-08

Reasoning: medium

# Valid channels: analysis, commentary, final. Channel must be included for every message.<|end|>
```

### Developer Message
Contains instructions (the "system prompt"):
```
<|start|>developer<|message|># Instructions

You are a helpful assistant.<|end|>
```

### Conversation
User and assistant messages with proper tokens:
```
<|start|>user<|message|>What is 2+2?<|end|>
<|start|>assistant<|channel|>final<|message|>2 + 2 = 4<|end|>
```

### Completion Trigger
Starts new assistant response:
```
<|start|>assistant
```

## Response Channels

The model outputs three types of channels:

### Analysis Channel (🔒 UNSAFE - FILTERED)
Internal chain-of-thought reasoning. **Never shown to users** due to safety concerns.
```
<|channel|>analysis<|message|>User asks "What is 2+2?" Simple arithmetic...<|end|>
```

### Commentary Channel
Tool call preambles and explanations:
```
<|channel|>commentary<|message|>I'll use the calculator tool...<|end|>
```

### Final Channel (✅ SAFE - RETURNED)
User-facing response, filtered for safety:
```
<|start|>assistant<|channel|>final<|message|>2 + 2 = 4<|return|>
```

## Temperature → Reasoning Level Mapping

The middleware maps Anthropic's temperature parameter to Harmony reasoning levels:

| Temperature | Reasoning Level | Use Case |
|-------------|----------------|----------|
| ≤ 0.3 | `low` | Fast, factual responses |
| 0.4 - 0.7 | `medium` | Balanced quality/speed (default) |
| ≥ 0.8 | `high` | Creative, thorough analysis |

## Implementation Details

### Prompt Generation
**File:** `llm_server/adapters/gpt_oss_adapter.py`

**Methods:**
- `_build_harmony_system_message(params)` - Generates system message with reasoning level
- `_build_harmony_developer_message(messages)` - Extracts instructions from system role
- `_build_harmony_conversation(messages)` - Formats user/assistant history
- `_build_prompt(messages, params)` - Combines all sections

### Response Parsing
**File:** `llm_server/adapters/gpt_oss_adapter.py`

**Methods:**
- `_parse_harmony_response(raw_output)` - Extracts 'final' channel only
- `_detect_harmony_stop_reason(raw_output)` - Detects stop tokens

**Safety:** The parser ensures analysis channel content is **never** returned to users.

### Streaming Support
**File:** `llm_server/adapters/gpt_oss_adapter.py:generate_stream()`

Streaming implementation includes:
- Token-by-token channel detection
- Buffering for channel transitions
- Filtering to only yield 'final' channel tokens
- Stop token detection

## Logging

Set `LOG_LEVEL=DEBUG` to see detailed Harmony format logging:

```
🎵 [Harmony] Generated prompt
   Reasoning level: medium (temp=0.7)
   Prompt length: 450 chars
🔄 [Harmony] Starting inference...
✅ [Harmony] Inference complete (1234ms)
📝 [Harmony] Raw output length: 850 chars
✂️  [Harmony] Parsed output length: 320 chars
🔒 [Harmony] Filtered 530 chars (analysis channel removed)
🛑 [Harmony] Stop reason: stop
```

## Testing

### Unit Tests
```bash
python3 llm_server/tests/test_harmony_format.py
python3 llm_server/tests/test_harmony_parser.py
```

### Integration Tests
```bash
python3 llm_server/tests/test_harmony_integration.py
```

Tests validate:
- Prompt generation with correct structure
- Temperature → reasoning level mapping
- Channel filtering (analysis removed, final extracted)
- Stop reason detection
- Safety-critical filtering

## Configuration

### Environment Variables
```bash
# Harmony format is enabled by default
USE_HARMONY_FORMAT=true

# Reasoning level (low/medium/high)
# Note: Usually set dynamically from temperature
REASONING_LEVEL=medium

# Knowledge cutoff date
KNOWLEDGE_CUTOFF=2024-06

# Enable debug logging to see Harmony details
LOG_LEVEL=DEBUG
```

### Model Configuration
**File:** `llm_server/config/inference_config.py`

```python
from llm_server.config.inference_config import InferenceConfig, ReasoningLevel

config = InferenceConfig(
    use_harmony_format=True,
    reasoning_level=ReasoningLevel.MEDIUM,
    capture_reasoning=False,  # Don't capture analysis channel
    knowledge_cutoff="2024-06",
)
```

## API Usage

### Anthropic Messages API
```bash
curl http://localhost:42002/v1/messages \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-sonnet-3-5",
    "messages": [
      {"role": "user", "content": "What is 15 + 27?"}
    ],
    "max_tokens": 100,
    "temperature": 0.7
  }'
```

Response will contain only the 'final' channel content, with analysis filtered out.

## Safety Considerations

### Critical: Analysis Channel Filtering

The analysis channel contains **unfiltered chain-of-thought** that has not been safety-filtered. According to OpenAI's model card:

> "The model has not been trained to the same safety standards in the chain-of-thought as it has for final output. You should not show the chain-of-thought to your users, as they might contain harmful content."

**Our implementation:**
- ✅ Analysis channel is **always** filtered in `_parse_harmony_response()`
- ✅ Only 'final' channel (safety-filtered) is returned to users
- ✅ Comprehensive tests ensure filtering works correctly
- ✅ Logging tracks filtered content length for debugging

### Validation
Run safety tests to verify filtering:
```bash
python3 llm_server/tests/test_harmony_integration.py
```

Look for:
```
🔒 SAFETY VERIFIED: Unsafe analysis channel completely filtered
```

## Troubleshooting

### Issue: No output from model
**Cause:** Model might not be using Harmony format
**Solution:** Check logs for channel detection, verify model is gpt-oss-20b

### Issue: Analysis content appearing in responses
**Cause:** Critical safety violation
**Solution:** Immediately check `_parse_harmony_response()` implementation

### Issue: Incorrect reasoning level
**Cause:** Temperature mapping issue
**Solution:** Verify temperature parameter is being passed correctly

### Debug Logging
Enable detailed logging:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

Check for:
- `🎵 [Harmony] Generated prompt` - Verify reasoning level
- `📝 [Harmony] Raw output length` - Check model output
- `✂️  [Harmony] Parsed output length` - Verify filtering occurred

## References

- [OpenAI Harmony Format Specification](https://openai.com/index/gpt-oss-model-card/)
- [gpt-oss-20b Model Card](https://openai.com/index/gpt-oss-model-card/)
- [Anthropic Messages API](https://docs.anthropic.com/en/api/messages)

## Version History

### v1.0.0 (2025-11-08)
- Initial Harmony format implementation
- System/developer/conversation prompt structure
- Multi-channel response parsing with safety filtering
- Temperature → reasoning level mapping
- Streaming support with channel detection
- Comprehensive test coverage
