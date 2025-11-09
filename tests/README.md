# Test Suite for @tkr/llm-client

Comprehensive test coverage for the LLM client library using Vitest.

## Test Structure

```
tests/
├── unit/              # Pure function unit tests (166 tests)
│   ├── utils/         # Utility function tests (69 tests)
│   │   ├── thinking.test.ts   # Thinking block extraction (25 tests)
│   │   ├── streaming.test.ts  # Stream utilities (23 tests)
│   │   └── retry.test.ts      # Retry logic (21 tests)
│   ├── errors/        # Custom error classes (28 tests)
│   │   └── errors.test.ts
│   └── server/        # Server configuration (69 tests)
│       ├── LLMConfig.test.ts       # Configuration (37 tests)
│       └── LLMHealthCheck.test.ts  # Health checks (32 tests)
├── integration/       # Integration tests (91 tests)
│   ├── LocalLLMClient.test.ts      # Local client (26 tests)
│   ├── LLMServerManager.test.ts    # Server manager (13 tests)
│   ├── ClaudeSDKClient.test.ts     # SDK client (26 tests)
│   └── LLMClient.test.ts           # Unified client (26 tests)
└── e2e/              # End-to-end scenarios (21 tests)
    └── full-workflow.test.ts       # Complete workflows
```

## Running Tests

```bash
# Run all tests once
npm test

# Watch mode (re-run on file changes)
npm run test:watch

# Interactive UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

## Current Coverage

### Phase 1: Complete ✅ (97 tests passing)
- **utils/thinking.test.ts** - 25 tests
  - Thinking block extraction (single, multiple, multiline)
  - Malformed tag handling
  - Context attribution
  - ID generation uniqueness
  - Block stripping and detection

- **utils/streaming.test.ts** - 23 tests
  - Message collection from async iterables
  - Text content extraction
  - Message filtering by type
  - Taking first N messages
  - Message transformation

- **utils/retry.test.ts** - 21 tests
  - Exponential backoff retry logic
  - Max attempts enforcement
  - Custom retry predicates
  - Network error detection
  - Rate limit error detection
  - Error preservation

- **errors/errors.test.ts** - 28 tests
  - Error class hierarchy
  - Prototype chain validation
  - Cause error chaining
  - Type discrimination with instanceof
  - Error properties access

### Phase 2: Complete ✅ (69 tests passing)
- **server/LLMConfig.test.ts** - 37 tests
  - Default configuration values
  - Environment variable loading (port, paths, timeouts, log level)
  - Configuration validation rules
  - Port range validation (1024-65535)
  - Health check timeout/interval validation
  - Python environment setup
  - Model configuration
  - Server error classes (LLMServerError, ServerStartupError, HealthCheckError, ProcessManagementError)

- **server/LLMHealthCheck.test.ts** - 32 tests
  - Single health check attempts
  - Retry logic with max attempts
  - Interval timing between retries
  - Timeout handling with AbortController
  - Progress callback invocation
  - HTTP status code handling
  - Model loaded detection
  - Response structure validation
  - Network error handling

### Phase 3: Complete ✅ (91 tests passing)
- **integration/LocalLLMClient.test.ts** - 26 tests
  - HTTP client integration with local LLM server
  - Query endpoint (/v1/messages) requests
  - Health check integration (/health endpoint)
  - Request body formatting (messages, temperature, system prompt)
  - Response text extraction
  - Error handling and event emission
  - Custom base URL support

- **integration/LLMServerManager.test.ts** - 13 tests
  - Process lifecycle management with mocked child_process
  - Server state transitions (STOPPED → STARTING → HEALTHY)
  - Configuration validation on construction
  - Event forwarding (stdout, stderr, state-change, started, stopped)
  - Process spawning with correct environment
  - Readonly configuration access

- **integration/ClaudeSDKClient.test.ts** - 26 tests
  - Claude Code SDK integration (mocked)
  - Streaming query interface
  - Thinking block extraction and events
  - Message event emission
  - Max messages enforcement
  - Query options (maxTurns, systemPrompt, allowedTools, temperature)
  - Direct query bypass mode
  - Subagent execution via Task tool
  - Shutdown and cleanup

- **integration/LLMClient.test.ts** - 26 tests
  - Unified client interface combining SDK and local clients
  - Event forwarding from both backends
  - Context management across clients
  - Local server health checking before direct queries
  - Automatic fallback to SDK when local server unhealthy
  - Fallback configuration control
  - Health status retrieval
  - Shutdown coordination

### Phase 4: Complete ✅ (21 tests passing)
- **e2e/full-workflow.test.ts** - 21 tests
  - Complete query workflow with thinking blocks and event handling
  - Multi-turn conversations with context management
  - Streaming utilities integration (collectMessages, extractTextContent)
  - Custom query options (systemPrompt, temperature, maxMessages, allowedTools)
  - Direct query workflow with local server
  - Automatic fallback to SDK on local server failure
  - Custom temperature in direct queries
  - Subagent execution workflows (success and failure cases)
  - Health monitoring throughout workflow lifecycle
  - Server health detection (healthy → unhealthy transitions)
  - Error recovery with transient errors
  - Error event emission for debugging
  - LocalLLMClient standalone workflow
  - ClaudeSDKClient standalone workflow with thinking extraction
  - Context management across multiple queries
  - Context override per query
  - Resource cleanup on shutdown
  - Safe multiple shutdown calls

## Test Philosophy

### Unit Tests
- **Pure functions**: No external dependencies
- **Fast execution**: All tests < 1ms typical
- **High coverage**: Test edge cases and error paths
- **Deterministic**: No flaky tests

### Integration Tests
- **Mocked dependencies**: Use `vi.mock()` for external services
- **Real interactions**: Test actual module integration
- **Error scenarios**: Network failures, timeouts, etc.

### E2E Tests
- **Full workflows**: Server startup → query → shutdown
- **Real scenarios**: Multi-turn conversations, retries
- **Performance**: Validate timeout and resource cleanup

## Writing New Tests

### Example Unit Test

```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from '../../../src/utils/myModule';

describe('myFunction', () => {
  it('should handle normal input', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });

  it('should handle edge cases', () => {
    expect(myFunction('')).toBe('');
    expect(myFunction(null as any)).toBeNull();
  });
});
```

### Example Integration Test

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MyClient } from '../../../src/client/MyClient';

describe('MyClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize correctly', () => {
    const client = new MyClient({ config });
    expect(client).toBeDefined();
  });
});
```

## CI/CD Integration

Tests run automatically on:
- Pre-commit (via hooks)
- Pull requests
- Before publishing to npm

## Debugging Tests

### Run specific test file
```bash
npm test -- tests/unit/utils/thinking.test.ts
```

### Run tests matching pattern
```bash
npm test -- -t "should extract"
```

### Debug in watch mode
```bash
npm run test:watch
```

### View coverage
```bash
npm run test:coverage
open coverage/index.html
```

## Test Utilities

### Async Iterable Helper
```typescript
async function* createAsyncIterable<T>(items: T[]): AsyncIterable<T> {
  for (const item of items) {
    yield item;
  }
}
```

### Mock Timer Usage
```typescript
import { vi } from 'vitest';

// Use real timers for most tests to avoid complexity
// Only use fake timers when testing actual timing logic
```

## Common Patterns

### Testing Error Handling
```typescript
it('should throw on invalid input', () => {
  expect(() => myFunction(invalid)).toThrow('Expected error');
});

it('should handle async errors', async () => {
  await expect(asyncFunction()).rejects.toThrow('Error');
});
```

### Testing Async Iterables
```typescript
it('should process stream', async () => {
  const iterable = createAsyncIterable([1, 2, 3]);
  const results = [];

  for await (const item of iterable) {
    results.push(item);
  }

  expect(results).toEqual([1, 2, 3]);
});
```

### Testing Event Emitters
```typescript
it('should emit events', async () => {
  const handler = vi.fn();
  emitter.on('event', handler);

  await emitter.doSomething();

  expect(handler).toHaveBeenCalledWith(expectedData);
});
```

## Dependencies

- **vitest**: Fast, TypeScript-native test framework
- **@vitest/ui**: Interactive test UI
- **vi**: Mocking and spy utilities

## Notes

- Tests use TypeScript strict mode
- All test files must end with `.test.ts`
- Test files mirror source structure
- Code coverage threshold: Target 80%+ for core utilities
