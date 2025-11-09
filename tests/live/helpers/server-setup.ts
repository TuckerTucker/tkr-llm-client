/**
 * Helper utilities for live server testing
 */

import { checkHealth } from '../../../src/server/LLMHealthCheck';

/**
 * Wait for server to become healthy
 */
export async function waitForServerHealthy(
  url: string,
  timeout: number = 30000
): Promise<void> {
  const startTime = Date.now();
  const interval = 1000;
  let attempts = 0;

  // Ensure URL has /health endpoint
  const healthUrl = url.endsWith('/health') ? url : `${url}/health`;

  while (Date.now() - startTime < timeout) {
    attempts++;
    try {
      console.log(`  Attempt ${attempts}: Checking ${healthUrl}...`);
      const result = await checkHealth(healthUrl, 5000);
      console.log(`  Result: healthy=${result.healthy}, error=${result.error?.message}`);
      if (result.healthy) {
        console.log(`✅ Server is healthy at ${url} after ${attempts} attempts`);
        return;
      }
    } catch (error) {
      // Server not ready yet
      console.log(`  Error during health check: ${error instanceof Error ? error.message : String(error)}`);
    }

    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error(`Server did not become healthy within ${timeout}ms after ${attempts} attempts`);
}

/**
 * Check if live tests should be skipped
 */
export function shouldSkipLiveTests(): boolean {
  return process.env['SKIP_LIVE_TESTS'] === 'true';
}

/**
 * Get server URL from environment or default
 */
export function getServerUrl(): string {
  return process.env['LLM_SERVER_URL'] || 'http://localhost:42002';
}

/**
 * Get test timeout from environment or default
 */
export function getTestTimeout(): number {
  const envTimeout = process.env['LIVE_TEST_TIMEOUT'];
  return envTimeout ? parseInt(envTimeout, 10) : 30000;
}
