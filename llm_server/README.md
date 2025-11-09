# Local LLM Server

FastAPI-based server providing OpenAI-compatible and Anthropic-compatible APIs for local LLM inference using gpt-oss-20b (MLX) with **OpenAI Harmony format** support.

## Features

- ✅ OpenAI-compatible API endpoints (`/v1/chat/completions`)
- ✅ **Anthropic-compatible API endpoints (`/v1/messages`)**
- ✅ **Harmony format middleware for gpt-oss-20b**
- ✅ **Multi-channel response filtering (analysis/commentary/final)**
- ✅ **Safety-critical filtering of unsafe chain-of-thought**
- ✅ Streaming and non-streaming chat completions
- ✅ Temperature → reasoning level mapping
- ✅ Health check endpoint
- ✅ Model listing endpoint
- ✅ Configurable via environment variables
- ✅ CORS support for development
- ✅ Comprehensive error handling
- ✅ Type-safe with Pydantic schemas

## Installation

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

## Configuration

Configure the server using environment variables:

```bash
# Server settings
export LLM_HOST=127.0.0.1
export LLM_PORT=42002
export LLM_WORKERS=1
export LLM_LOG_LEVEL=info

# Model settings
export LLM_MODEL_PATH=~/gpt-oss-20b (MLX)
export LLM_MODEL_NAME=gpt-oss-20b
export LLM_DEVICE=auto  # auto, mps, cpu
export LLM_QUANTIZATION=int4  # int4, int8, fp16, none

# Server timeouts
export LLM_REQUEST_TIMEOUT=300
export LLM_KEEPALIVE_TIMEOUT=65
```

Or create a `.env` file in the `llm-server/` directory.

## Usage

### Start Server

```bash
# From llm-server directory
python -m llm_server.server

# Or using the main function
python server.py
```

### Check Health

```bash
curl http://localhost:42002/health
```

Expected response:
```json
{
  "status": "ok",
  "model_loaded": true,
  "model_name": "gpt-oss-20b",
  "uptime_seconds": 123.45
}
```

### List Models

```bash
curl http://localhost:42002/v1/models
```

### Chat Completion (Non-Streaming)

```bash
curl http://localhost:42002/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-oss-20b",
    "messages": [
      {"role": "user", "content": "Hello, how are you?"}
    ],
    "max_tokens": 100,
    "temperature": 0.7
  }'
```

### Chat Completion (Streaming)

```bash
curl http://localhost:42002/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-oss-20b",
    "messages": [
      {"role": "user", "content": "Count to 5"}
    ],
    "stream": true
  }'
```

## API Endpoints

### `GET /health`

Health check endpoint.

**Response**:
```json
{
  "status": "ok" | "error",
  "model_loaded": bool,
  "model_name": string | null,
  "uptime_seconds": float
}
```

### `GET /v1/models`

List available models.

**Response**:
```json
{
  "object": "list",
  "data": [
    {
      "id": "gpt-oss-20b",
      "object": "model",
      "created": 1234567890,
      "owned_by": "local"
    }
  ]
}
```

### `POST /v1/chat/completions`

Create chat completion.

**Request**:
```json
{
  "model": "gpt-oss-20b",
  "messages": [
    {"role": "system", "content": "You are a helpful assistant"},
    {"role": "user", "content": "Hello"}
  ],
  "temperature": 0.7,
  "max_tokens": 512,
  "top_p": 0.9,
  "stream": false,
  "stop": ["</s>"],
  "presence_penalty": 0.0,
  "frequency_penalty": 0.0
}
```

**Response** (non-streaming):
```json
{
  "id": "chatcmpl-1234567890-abc123",
  "object": "chat.completion",
  "created": 1234567890,
  "model": "gpt-oss-20b",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! I'm doing well, thank you."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 20,
    "completion_tokens": 10,
    "total_tokens": 30
  }
}
```

**Response** (streaming):

Server-Sent Events format:
```
data: {"id":"chatcmpl-...","object":"chat.completion.chunk","created":...,"model":"gpt-oss-20b","choices":[{"index":0,"delta":{"role":"assistant"},"finish_reason":null}]}

data: {"id":"chatcmpl-...","object":"chat.completion.chunk","created":...,"model":"gpt-oss-20b","choices":[{"index":0,"delta":{"content":"Hello"},"finish_reason":null}]}

data: [DONE]
```

## Architecture

```
llm-server/
├── __init__.py               # Package initialization
├── server.py                 # Main FastAPI application
├── config.py                 # Configuration management
├── routes/                   # API route handlers
│   ├── __init__.py
│   ├── chat.py              # Chat completions endpoint
│   ├── models.py            # Models listing endpoint
│   └── health.py            # Health check endpoint
├── adapters/                 # Inference engine adapters
│   ├── __init__.py
│   └── gpt_oss_adapter.py   # gpt-oss-20b (MLX) adapter
└── schemas/                  # Pydantic schemas
    ├── __init__.py
    └── openai_schema.py     # OpenAI-compatible schemas
```

## Integration with gpt-oss-20b (MLX)

The server uses the `GPTOSSAdapter` to interface with gpt-oss-20b (MLX):

1. Model path is added to PYTHONPATH
2. Model is loaded during server startup
3. Requests are converted to gpt-oss-20b (MLX) format
4. Responses are converted to OpenAI format
5. Model is unloaded during server shutdown

## Error Handling

All errors follow OpenAI error format:

```json
{
  "error": {
    "message": "Error description",
    "type": "invalid_request_error" | "server_error",
    "code": "error_code"
  }
}
```

## Development

### Run in Development Mode

```bash
uvicorn llm_server.server:app --reload --host 127.0.0.1 --port 42002
```

### Run Tests

```bash
# Unit tests
pytest tests/

# Integration tests
pytest tests/test_integration.py
```

## Troubleshooting

### Model Not Loading

1. Verify `LLM_MODEL_PATH` points to gpt-oss-20b (MLX) directory
2. Check that gpt-oss-20b (MLX) is properly installed
3. Review server logs for import errors

### Slow Inference

1. Try different quantization levels (int4 is fastest)
2. Use appropriate device (mps for Apple Silicon)
3. Reduce max_tokens if not needed

### Connection Errors

1. Check that port 42002 is not in use
2. Verify firewall settings
3. Check CORS configuration for browser requests

## Harmony Format Support

This server implements the **OpenAI Harmony format** for gpt-oss-20b inference. See [HARMONY_FORMAT.md](HARMONY_FORMAT.md) for complete documentation.

### Key Features

**Multi-Channel Response Handling:**
- `analysis` channel: Internal reasoning (filtered for safety)
- `commentary` channel: Tool call explanations
- `final` channel: User-facing responses (returned to clients)

**Temperature → Reasoning Level:**
- temp ≤ 0.3 → `low` (fast, factual)
- temp 0.4-0.7 → `medium` (balanced)
- temp ≥ 0.8 → `high` (creative, thorough)

**Safety:**
The analysis channel contains unfiltered chain-of-thought and is **never** shown to users. Only the safety-filtered `final` channel is returned.

### Quick Start

```bash
# Use Anthropic API format (Harmony enabled by default)
curl http://localhost:42002/v1/messages \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-sonnet-3-5",
    "messages": [{"role": "user", "content": "Explain quantum computing"}],
    "max_tokens": 500,
    "temperature": 0.7
  }'
```

### Testing

```bash
# Run Harmony format tests
python3 llm_server/tests/test_harmony_format.py
python3 llm_server/tests/test_harmony_parser.py
python3 llm_server/tests/test_harmony_integration.py
```

## License

Part of tkr-ace project.
