# @tkr/llm-client

Generic LLM client library with Claude SDK and local LLM server support.

## Features

- **Claude Code SDK Integration**: Full access to Claude's tool ecosystem
- **Local LLM Server**: Run MLX models on Apple Silicon
- **Unified Interface**: Single API for both Claude SDK and local LLM
- **Framework-Agnostic**: Use in any TypeScript/Node.js project
- **Event-Driven**: Subscribe to thinking blocks, messages, and errors
- **Retry Logic**: Built-in exponential backoff for resilience
- **TypeScript**: Full type safety with comprehensive TypeScript support

## Installation

```bash
npm install @tkr/llm-client
```

## Quick Start

### Basic Usage

```typescript
import { LLMClient, LLMServerManager } from '@tkr/llm-client';

// Start local LLM server
const serverManager = new LLMServerManager({
  port: 42002,
  pythonPath: './venv/bin/python',
  modelName: 'gpt-oss-20b'
});

await serverManager.start();

// Create client
const client = new LLMClient({
  localServer: {
    enabled: true,
    port: 42002
  }
});

// Query with streaming
for await (const message of client.query('Hello, world!', {
  temperature: 0.7
})) {
  console.log(message.content);
}
```

### With Tool Access

```typescript
// Query with specific tools
for await (const message of client.query('Analyze this codebase', {
  allowedTools: ['Read', 'Grep', 'Glob'],
  systemPrompt: 'You are a code analysis expert.',
  temperature: 0.5
})) {
  if (message.type === 'tool_use') {
    console.log(`Using tool: ${message.name}`);
  }
  if (message.type === 'result') {
    console.log(`Result: ${message.result}`);
  }
}
```

### Direct Query (No Tools)

```typescript
// Faster for simple text generation
const response = await client.queryDirect('What is 2+2?', {
  temperature: 0.3
});
console.log(response);
```

### Listen for Thinking Blocks

```typescript
client.on('thinking', (block) => {
  console.log(`[${block.context}] ${block.content}`);
});

client.on('error', (error) => {
  console.error('Query error:', error);
});
```

## Configuration

```typescript
const client = new LLMClient({
  // Claude SDK settings
  claudeSDK: {
    baseUrl: 'http://localhost:42002',
    apiKey: 'sk-ant-...',  // Optional cloud fallback
    enableFallback: false
  },

  // Local server settings
  localServer: {
    enabled: true,
    port: 42002,
    pythonPath: './venv/bin/python',
    serverScript: './llm_server/server.py',
    modelName: 'gpt-oss-20b',
    modelPath: './models'
  },

  // Query defaults
  defaults: {
    maxMessages: 100,
    maxTurns: 1,
    queryTimeout: 30000
  }
});
```

## Server Management

```typescript
import { LLMServerManager, waitForHealthyWithProgress } from '@tkr/llm-client';

const manager = new LLMServerManager({
  port: 42002,
  pythonPath: './venv/bin/python',
  serverScript: './llm_server/server.py'
});

// Start with progress tracking
manager.on('stdout', (data) => console.log(data));
manager.on('stderr', (data) => console.error(data));

await manager.start();

// Check health
const isHealthy = await manager.isHealthy();
console.log('Server healthy:', isHealthy);

// Stop gracefully
await manager.stop();
```

## API Reference

### LLMClient

Main client interface combining Claude SDK and local LLM.

#### Methods

- `query(prompt, options)`: Stream messages from LLM with tool access
- `queryDirect(prompt, options)`: Direct HTTP query, no tools (faster)
- `executeSubagent(name, task)`: Execute task using subagent
- `setContext(context)`: Set context for thinking attribution
- `isLocalServerHealthy()`: Check local server health
- `shutdown()`: Clean up resources

#### Events

- `'thinking'`: Emitted when thinking block extracted
- `'message'`: Emitted for each message from LLM
- `'error'`: Emitted on query errors

### LLMServerManager

Manages local LLM server process lifecycle.

#### Methods

- `start()`: Start the server
- `stop(timeout)`: Stop gracefully
- `restart()`: Restart server
- `isHealthy()`: Check health status
- `getHealth()`: Get detailed health info

#### Events

- `'started'`: Server ready
- `'stopped'`: Server stopped
- `'error'`: Server error
- `'stdout'`: Server output
- `'stderr'`: Server errors

## TypeScript Support

Full TypeScript support with comprehensive type definitions:

```typescript
import type {
  LLMMessage,
  LLMQueryOptions,
  ThinkingBlock,
  LLMClientConfig
} from '@tkr/llm-client';
```

## Python Server

The package includes a FastAPI server for local LLM inference using MLX (Apple Silicon):

- OpenAI-compatible API (`/v1/chat/completions`)
- Anthropic-compatible API (`/v1/messages`)
- Harmony format support for chain-of-thought reasoning
- Health checks (`/health`)
- Model management

## License

MIT
