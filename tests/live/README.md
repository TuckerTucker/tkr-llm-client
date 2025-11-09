# Live Server Tests

Tests that run against an actual LLM server instance. These are slower and require a running server, but validate real integration.

## When to Run Live Tests

**Run locally:**
- Before major releases
- When debugging server integration issues
- When validating new server features
- During development of new client features

**Don't run in:**
- CI/CD pipelines (too slow, unreliable)
- Pre-commit hooks
- Regular test runs
- PR validation

## Prerequisites

### For Local LLM Server

1. **Install Python dependencies:**
```bash
cd llm_server
pip install -r requirements.txt  # or poetry install
```

2. **Download a model (if needed):**
```bash
# MLX models for Apple Silicon
python -m mlx_lm.models.download --model mlx-community/gpt-oss-20b-int4
```

3. **Start the server:**
```bash
# From project root
python llm_server/server.py --port 42002
```

4. **Verify server is running:**
```bash
curl http://localhost:42002/health
# Should return: {"status":"ok","model_loaded":true,...}
```

### For Claude SDK (Cloud)

1. **Set API key:**
```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

2. **Configure base URL (optional):**
```bash
export ANTHROPIC_BASE_URL=https://api.anthropic.com
```

## Running Live Tests

```bash
# Run only live tests
npm run test:live

# Run with specific server
SERVER_URL=http://localhost:42002 npm run test:live

# Run with increased timeout (for slow models)
npm run test:live -- --testTimeout=60000

# Run specific live test file
npm run test:live tests/live/local-server.live.test.ts

# Watch mode for development
npm run test:live -- --watch
```

## Environment Variables

Live tests respect these environment variables:

```bash
# Server configuration
LLM_SERVER_URL=http://localhost:42002  # Local server URL
LLM_SERVER_TIMEOUT=30000               # Health check timeout (ms)

# Test configuration
SKIP_LIVE_TESTS=true                   # Skip all live tests
LIVE_TEST_MODEL=gpt-oss-20b           # Model name to test
LIVE_TEST_TIMEOUT=60000               # Test timeout (ms)

# Claude SDK
ANTHROPIC_API_KEY=sk-ant-...          # API key for cloud tests
ANTHROPIC_BASE_URL=...                # Override API endpoint
```

## Test Organization

```
tests/live/
├── README.md                    # This file
├── local-server.live.test.ts    # Local LLM server tests
├── claude-sdk.live.test.ts      # Claude SDK cloud tests
├── unified-client.live.test.ts  # Unified client with real server
└── helpers/
    ├── server-setup.ts          # Server startup/teardown
    └── assertions.ts            # Custom assertions for LLM responses
```

## Writing Live Tests

### Example: Local Server Test

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { LocalLLMClient } from '../../src/client/LocalLLMClient';
import { waitForServerHealthy } from './helpers/server-setup';

describe('Live: LocalLLMClient', () => {
  let client: LocalLLMClient;

  beforeAll(async () => {
    // Wait for server to be healthy
    await waitForServerHealthy('http://localhost:42002', 30000);
    client = new LocalLLMClient('http://localhost:42002');
  }, 60000); // 60s timeout for model loading

  it('should query real LLM server', async () => {
    const response = await client.query('What is 2+2?');

    // Assertions for real LLM responses
    expect(response).toBeTruthy();
    expect(response.length).toBeGreaterThan(0);
    // Don't assert exact content (non-deterministic)
    expect(response).toMatch(/4|four/i); // Fuzzy assertion
  }, 30000); // 30s timeout for inference
});
```

### Best Practices for Live Tests

1. **Use fuzzy assertions:**
   ```typescript
   // ❌ Bad: Exact match (will fail)
   expect(response).toBe('The answer is 4');

   // ✅ Good: Pattern match
   expect(response).toMatch(/4|four/i);
   expect(response.length).toBeGreaterThan(10);
   ```

2. **Set appropriate timeouts:**
   ```typescript
   // Model loading can take 30-60 seconds
   beforeAll(async () => {
     await setupServer();
   }, 60000);

   // Inference can take 5-30 seconds
   it('should respond', async () => {
     // test
   }, 30000);
   ```

3. **Clean up resources:**
   ```typescript
   afterAll(async () => {
     await client.shutdown();
     await stopServer();
   });
   ```

4. **Make tests idempotent:**
   ```typescript
   // ❌ Bad: Depends on previous state
   it('should continue conversation', async () => {
     const response = await client.query('Continue from before');
   });

   // ✅ Good: Self-contained
   it('should continue conversation', async () => {
     await client.query('What is 2+2?');
     const response = await client.query('What was the answer?');
     expect(response).toMatch(/4|four/i);
   });
   ```

5. **Skip when server unavailable:**
   ```typescript
   describe.skipIf(process.env.SKIP_LIVE_TESTS === 'true')(
     'Live: LocalLLMClient',
     () => {
       // tests
     }
   );
   ```

## Debugging Live Tests

### Check server health:
```bash
curl http://localhost:42002/health
```

### View server logs:
```bash
# Check terminal where server is running
# Or check log file if configured
tail -f llm_server/logs/server.log
```

### Run single test with verbose output:
```bash
npm run test:live -- tests/live/local-server.live.test.ts --reporter=verbose
```

### Increase timeout for debugging:
```bash
npm run test:live -- --testTimeout=300000  # 5 minutes
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Live Tests (Nightly)

on:
  schedule:
    - cron: '0 2 * * *'  # 2 AM daily
  workflow_dispatch:     # Manual trigger

jobs:
  live-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.10'

      - name: Install server dependencies
        run: |
          cd llm_server
          pip install -r requirements.txt

      - name: Start LLM server
        run: |
          python llm_server/server.py --port 42002 &
          sleep 30  # Wait for model loading

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run live tests
        run: npm run test:live
        env:
          LLM_SERVER_URL: http://localhost:42002
          LIVE_TEST_TIMEOUT: 60000

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: live-test-results
          path: test-results/
```

## Performance Expectations

### Local LLM Server (Apple Silicon M1/M2)
- **Server startup**: 5-30 seconds (model loading)
- **Health check**: <100ms
- **Simple query**: 2-10 seconds
- **Complex query**: 10-30 seconds

### Claude SDK (Cloud)
- **Health check**: N/A
- **Simple query**: 1-5 seconds
- **Complex query**: 5-15 seconds
- **Rate limits**: Apply

## Troubleshooting

### Server won't start
```bash
# Check port availability
lsof -i :42002

# Check Python environment
python --version
pip list | grep mlx

# Check model files
ls -la models/
```

### Tests timeout
```bash
# Increase timeout
npm run test:live -- --testTimeout=120000

# Check server health manually
curl http://localhost:42002/health
```

### Inconsistent results
- LLM responses are non-deterministic
- Use fuzzy assertions (regex, length checks)
- Set temperature=0 for more consistent results
- Consider using test fixtures for expected patterns

## Cost Considerations

### Local Server
- **GPU/CPU usage**: High during inference
- **Memory**: 8-16GB depending on model
- **Electricity**: Minimal
- **API calls**: Free

### Claude SDK (Cloud)
- **API costs**: $0.01-0.10 per test depending on tokens
- **Rate limits**: May need delays between tests
- **Recommendation**: Use sparingly, mock for regular testing

## When to Mock vs Live Test

| Scenario | Recommended Approach |
|----------|---------------------|
| Unit testing utilities | Mock |
| Testing error handling | Mock |
| CI/CD pipelines | Mock |
| Pre-commit hooks | Mock |
| Local development | Live (optional) |
| Integration verification | Live |
| Before releases | Live |
| Debugging server issues | Live |
| Performance testing | Live |
| Nightly builds | Live (optional) |
