# Running Inference with Local LLM Server

This guide shows you how to run inference against the local gpt-oss-20b server.

## Prerequisites

1. **Start the server first:**
   ```bash
   ./start-llm-server.sh
   # or
   npm run server
   ```

2. **Wait for the model to load** (you'll see ✅ in the logs)

3. **Verify it's healthy:**
   ```bash
   curl http://localhost:42002/health
   ```

## Quick Start

### 1. Fastest Test (curl)

```bash
curl http://localhost:42002/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-oss-20b",
    "messages": [{"role": "user", "content": "Say hello!"}],
    "max_tokens": 50
  }'
```

### 2. Quick TypeScript Test

```bash
npm run example:quick
```

This runs a simple one-liner test to verify everything works.

## TypeScript Examples

### Example 1: Basic Inference

```typescript
import { LocalLLMClient } from '@tkr/llm-client';

const client = new LocalLLMClient({
  baseURL: 'http://localhost:42002'
});

// Streaming (recommended)
for await (const msg of client.query('What is TypeScript?', {
  maxTokens: 200,
  temperature: 0.7
})) {
  if (msg.type === 'text') {
    process.stdout.write(msg.text);
  }
}

await client.shutdown();
```

**Run it:**
```bash
npm run example:local
```

### Example 2: Non-Streaming (Faster Response)

```typescript
const response = await client.queryDirect('What is 2+2?');
console.log(response);
```

### Example 3: With System Prompt

```typescript
for await (const msg of client.query('Tell me about pirates', {
  systemPrompt: 'You are a helpful assistant who speaks like a pirate.',
  maxTokens: 150
})) {
  if (msg.type === 'text') {
    process.stdout.write(msg.text);
  }
}
```

### Example 4: Automatic Server Management

```typescript
import { LLMClient } from '@tkr/llm-client';
import { LLMServerManager } from '@tkr/llm-client';

// Server manager starts/stops the Python server automatically
const manager = new LLMServerManager({
  port: 42002,
  pythonPath: 'python3',
  serverScript: 'llm_server/server.py'
});

await manager.start();  // Starts server in background

const client = new LLMClient({
  localServer: { enabled: true, baseURL: 'http://localhost:42002' }
});

// Use client...
for await (const msg of client.query('Hello!')) {
  // ...
}

await client.shutdown();
await manager.stop();  // Stops server
```

**Run it:**
```bash
npm run example:managed
```

### Example 5: Listen to Thinking Events

The gpt-oss-20b model supports Harmony format with thinking blocks:

```typescript
client.on('thinking', (thinking) => {
  console.log(`🧠 Thinking: ${thinking}`);
});

for await (const msg of client.query('Solve this problem: ...')) {
  if (msg.type === 'text') {
    console.log(msg.text);
  }
}
```

## API Endpoints

### OpenAI-Compatible: `/v1/chat/completions`

```bash
curl http://localhost:42002/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-oss-20b",
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Explain machine learning"}
    ],
    "max_tokens": 200,
    "temperature": 0.7,
    "stream": false
  }'
```

**Streaming:**
```bash
curl http://localhost:42002/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-oss-20b",
    "messages": [{"role": "user", "content": "Count to 10"}],
    "max_tokens": 100,
    "stream": true
  }'
```

### Anthropic-Compatible: `/v1/messages`

```bash
curl http://localhost:42002/v1/messages \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-oss-20b",
    "messages": [
      {"role": "user", "content": "What is quantum computing?"}
    ],
    "max_tokens": 150
  }'
```

## Configuration Options

### Query Options

```typescript
interface LLMQueryOptions {
  systemPrompt?: string;      // System message
  temperature?: number;        // 0.0-1.0 (controls randomness)
  maxTokens?: number;          // Maximum tokens to generate
  timeout?: number;            // Request timeout (ms)
}
```

### Temperature Guide

- **0.0-0.3**: Focused, deterministic (factual answers)
- **0.4-0.7**: Balanced (default, good for most tasks)
- **0.8-1.0**: Creative, diverse (brainstorming, stories)

## Troubleshooting

### Server Not Responding

```bash
# Check if server is running
curl http://localhost:42002/health

# Check server logs
# Look at terminal where ./start-llm-server.sh is running
```

### Slow Responses

- **First query is slow**: Model needs to warm up (normal)
- **All queries slow**: Check if using CPU instead of MPS
  - Verify in server logs: `Device: mps`
- **Out of memory**: Model too large for your system
  - Try different quantization in `llm_server/.env`

### Connection Errors

```bash
# Verify server is listening on correct port
lsof -i :42002

# Check firewall settings
# Server binds to 127.0.0.1 (localhost only)
```

## Next Steps

- See `examples/` directory for more examples
- Read `llm_server/README.md` for server configuration
- Check API documentation in `llm_server/routes/`

## Available npm Scripts

```bash
npm run server          # Start server with script
npm run server:dev      # Start with debug logging
npm run example:quick   # Quick test
npm run example:local   # Full local inference demo
npm run example:managed # Auto-managed server demo
```
