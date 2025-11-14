# @tkr/llm-client

Lightweight LLM inference library with Claude Agent SDK and local LLM server support.

> **Note**: This is the core inference library. For advanced features like agent templates and ReactFlow UI visualization, see the [Branch Architecture](#branch-architecture) section below.

## Features

- **Claude Agent SDK Integration**: Full access to Claude's tool ecosystem with agent capabilities
- **Local LLM Server**: Run MLX models on Apple Silicon with automated startup scripts
- **Unified Interface**: Single API for both Claude Agent SDK and local LLM
- **Framework-Agnostic**: Use in any TypeScript/Node.js project
- **Event-Driven**: Subscribe to thinking blocks, messages, and errors
- **Retry Logic**: Built-in exponential backoff for resilience
- **TypeScript**: Full type safety with comprehensive TypeScript support

## Branch Architecture

This project uses a multi-branch architecture to keep the main library lightweight:

- **`main`** (this branch): Core inference library - lightweight, focused on LLM queries
- **`feature/agent-templates`**: Agent template system with YAML-based configuration, inheritance, and mixins
- **`feature/reactflow-ui`**: ReactFlow visualization UI for agent workflows and execution graphs

Each branch is independently maintained and can be merged as needed for specific use cases.

## Installation

```bash
npm install @tkr/llm-client
```

## Quick Start

### Starting the Local LLM Server

**Option 1: Using the startup script (recommended)**
```bash
# Automated startup with venv management and hot reload
npm run server

# Or directly:
./start-llm-server.sh
```

**Option 2: Programmatic management**
```typescript
import { LLMServerManager } from '@tkr/llm-client';

const serverManager = new LLMServerManager({
  port: 42002,
  pythonPath: './venv/bin/python',
  modelName: 'gpt-oss-20b'
});

await serverManager.start();
```

### Basic Usage

```typescript
import { LLMClient } from '@tkr/llm-client';

// Create client (server should be running on port 42002)
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

### Server Startup

```bash
# Automated startup with venv, dependencies, and hot reload
npm run server

# Or use the shell script directly:
./start-llm-server.sh
```

The startup script handles:
- Virtual environment creation and activation
- Dependency installation
- `.env` file loading with proper comment handling
- Health check URL display
- Uvicorn hot reload for development

See [INFERENCE.md](./INFERENCE.md) for detailed server usage and API examples.

## Advanced Features

This main branch focuses on core inference capabilities. For advanced features:

### Agent Template System
The agent template system (YAML-based configuration, inheritance, mixins) is available on the `feature/agent-templates` branch.

```bash
# Switch to agent templates branch
git checkout feature/agent-templates
```

Features include:
- YAML-based agent definitions
- Template inheritance and composition
- Variable interpolation
- Tool permission configuration
- Full TypeScript support

### ReactFlow UI
The ReactFlow visualization UI (agent workflow graphs, execution visualization) is available on the `feature/reactflow-ui` branch.

```bash
# Switch to UI branch
git checkout feature/reactflow-ui
```

Features include:
- Interactive workflow visualization
- Real-time execution tracking
- Zustand state management
- Automatic layout with dagre/elk

## License

Apache 2.0
