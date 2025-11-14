# Examples

This directory contains usage examples for the tkr-llm-client library, demonstrating core inference capabilities.

> **Note**: For agent template system examples, see the `feature/agent-templates` branch.

## Available Examples

### 1. Quick Test (`quick-test.ts`)

Minimal one-liner test for the local LLM server.

**Features:**
- Simple direct query
- Minimal setup
- Quick sanity check

**Run:**
```bash
npm run example:quick
# or
npx tsx examples/quick-test.ts
```

**Code:**
```typescript
import { LocalLLMClient } from '../src/client/LocalLLMClient';

async function main() {
  const client = new LocalLLMClient('http://localhost:42002');
  console.log('Testing local LLM server...\n');
  const response = await client.query('Say hello in 5 words');
  console.log(response);
  console.log('\n✅ Success!');
}

main().catch(console.error);
```

---

### 2. Local Inference (`local-inference.ts`)

Comprehensive examples using the local LLM server.

**Features:**
- Health checks
- System prompts
- Temperature variations
- Multiple query examples

**Run:**
```bash
npm run example:local
# or
npx tsx examples/local-inference.ts
```

**Examples Included:**
1. Basic query with default settings
2. Query with custom system prompt
3. Query with creative temperature
4. Multiple queries demonstrating consistency

---

### 3. Managed Server (`managed-server.ts`)

Demonstrates programmatic server lifecycle management.

**Features:**
- Starting server with LLMServerManager
- Monitoring server output
- Health checks with progress tracking
- Graceful shutdown

**Run:**
```bash
npm run example:managed
# or
npx tsx examples/managed-server.ts
```

**Use Cases:**
- Applications that need to control the server programmatically
- Automated testing environments
- Embedded LLM server scenarios

---

### 4. Simple Query (`simple-query.ts`)

Basic usage pattern with streaming and thinking blocks.

**Features:**
- Starting the local LLM server
- Direct queries with `queryDirect()`
- Listening for thinking blocks
- Server lifecycle management

**Run:**
```bash
npx tsx examples/simple-query.ts
```

---

## Prerequisites

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Local LLM Server

**Option A: Using the startup script (recommended)**
```bash
npm run server
```

**Option B: Manual start**
```bash
./start-llm-server.sh
```

The server should be running on `http://localhost:42002`.

### 3. Verify Server Health
```bash
curl http://localhost:42002/health
```

Expected response:
```json
{
  "status": "healthy",
  "model": "gpt-oss-20b",
  "device": "Metal"
}
```

---

## Running Examples

### With npm Scripts
```bash
npm run example:quick      # Quick test
npm run example:local      # Local inference examples
npm run example:managed    # Managed server example
```

### With tsx Directly
```bash
npx tsx examples/quick-test.ts
npx tsx examples/local-inference.ts
npx tsx examples/managed-server.ts
npx tsx examples/simple-query.ts
```

### With Compiled JavaScript
```bash
npm run build
node dist/examples/quick-test.js
```

---

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```bash
# LLM Server Configuration
LLM_PORT=42002
LLM_HOST=0.0.0.0
LLM_LOG_LEVEL=info

# Python Environment
LLM_PYTHON_PATH=./venv/bin/python

# Model Configuration
LLM_MODEL_NAME=gpt-oss-20b
LLM_MODEL_PATH=./models

# Inference Settings
LLM_MAX_TOKENS=2048
LLM_TEMPERATURE=0.7
```

### Server Manager Configuration

```typescript
const serverManager = new LLMServerManager({
  port: 42002,
  pythonPath: './venv/bin/python',
  serverScript: './llm_server/server.py',
  modelName: 'gpt-oss-20b',
  modelPath: './models'
});
```

---

## API Patterns

### Pattern 1: Direct Query (Fastest)

For simple text generation without tool access:

```typescript
import { LocalLLMClient } from '@tkr/llm-client';

const client = new LocalLLMClient('http://localhost:42002');
const response = await client.query('What is 2+2?');
console.log(response);
```

### Pattern 2: Streaming with LLMClient

For more complex queries with potential tool access:

```typescript
import { LLMClient } from '@tkr/llm-client';

const client = new LLMClient({
  localServer: {
    enabled: true,
    port: 42002
  }
});

for await (const message of client.query('Analyze this code', {
  temperature: 0.7,
  maxTokens: 1000
})) {
  console.log(message.content);
}
```

### Pattern 3: Managed Server Lifecycle

For applications that need full control:

```typescript
import { LLMServerManager } from '@tkr/llm-client';

const manager = new LLMServerManager({ port: 42002 });

// Start server
await manager.start();

// Use server
// ...

// Stop server
await manager.stop();
```

---

## Expected Output

### Quick Test
```
Testing local LLM server...

Hello! How are you?

✅ Success!
```

### Local Inference
```
=== Local LLM Inference Examples ===

1. Basic Query
Response: [AI response here]

2. With System Prompt
Response: [AI response here]

3. Creative Temperature (1.0)
Response: [AI response here]

4. Multiple Queries
Query 1: [AI response here]
Query 2: [AI response here]

✅ All examples completed successfully!
```

### Managed Server
```
Starting LLM server...
Server output: [uvicorn startup messages]
Waiting for server to become healthy...
✓ Server is healthy!

Running query...
Response: [AI response here]

Stopping server...
Server stopped successfully.
```

---

## Troubleshooting

### Server Not Starting

**Check Python environment:**
```bash
./venv/bin/python --version
./venv/bin/python -c "import mlx; print(mlx.__version__)"
```

**Check port availability:**
```bash
lsof -i :42002
```

**View server logs:**
```bash
npm run server
# Watch for errors in output
```

### Connection Errors

**Verify server is running:**
```bash
curl http://localhost:42002/health
```

**Check firewall settings:**
```bash
# Ensure port 42002 is not blocked
```

### Model Loading Issues

**Verify model exists:**
```bash
ls -la models/gpt-oss-20b/
```

**Check model configuration in `.env`:**
```bash
cat .env | grep LLM_MODEL
```

---

## Additional Resources

- [INFERENCE.md](../INFERENCE.md) - Detailed API documentation
- [README.md](../README.md) - Library overview
- [Python Server](../llm_server/README.md) - Server internals

---

## Advanced Examples

For advanced usage patterns including:
- Agent templates with YAML configuration
- Template inheritance and composition
- Variable interpolation and validation
- ReactFlow UI visualization

See the feature branches:
- `feature/agent-templates` - Agent template system
- `feature/reactflow-ui` - UI visualization

```bash
git checkout feature/agent-templates
# or
git checkout feature/reactflow-ui
```
