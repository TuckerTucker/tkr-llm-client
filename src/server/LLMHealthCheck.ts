/**
 * Health check utilities for LLM server
 *
 * Provides retry logic and health monitoring for the FastAPI LLM server.
 */

import { HealthCheckError } from './LLMConfig';

/**
 * Response from /health endpoint
 */
export interface HealthCheckResponse {
  status: 'ok' | 'error';
  model_loaded: boolean;
  model_name: string | null;
  uptime_seconds: number;
}

/**
 * Health check result
 */
export interface HealthCheckResult {
  healthy: boolean;
  response?: HealthCheckResponse;
  error?: Error;
  attemptsUsed: number;
}

/**
 * Check if server is healthy (single attempt)
 *
 * @param url Health check endpoint URL
 * @param timeoutMs Request timeout in milliseconds
 * @returns Health check result
 */
export async function checkHealth(
  url: string,
  timeoutMs: number = 5000
): Promise<HealthCheckResult> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        return {
          healthy: false,
          error: new Error(`Health check returned status ${response.status}`),
          attemptsUsed: 1,
        };
      }

      const health = await response.json() as HealthCheckResponse;

      // Server must report 'ok' status AND have model loaded
      const isHealthy = health.status === 'ok' && health.model_loaded;

      if (isHealthy) {
        return {
          healthy: true,
          response: health,
          attemptsUsed: 1,
        };
      } else {
        return {
          healthy: false,
          response: health,
          error: new Error('Server not ready: model not loaded'),
          attemptsUsed: 1,
        };
      }
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error : new Error(String(error)),
      attemptsUsed: 1,
    };
  }
}

/**
 * Wait for server to become healthy with retry logic
 *
 * @param url Health check endpoint URL
 * @param maxAttempts Maximum number of health check attempts
 * @param intervalMs Milliseconds to wait between attempts
 * @param timeoutMs Request timeout for each attempt
 * @returns Health check result when healthy
 * @throws HealthCheckError if server doesn't become healthy within max attempts
 */
export async function waitForHealthy(
  url: string,
  maxAttempts: number = 30,
  intervalMs: number = 1000,
  timeoutMs: number = 5000
): Promise<HealthCheckResult> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const result = await checkHealth(url, timeoutMs);

    if (result.healthy) {
      return {
        ...result,
        attemptsUsed: attempt,
      };
    }

    lastError = result.error;

    // Don't sleep after the last attempt
    if (attempt < maxAttempts) {
      await sleep(intervalMs);
    }
  }

  // Server failed to become healthy
  throw new HealthCheckError(
    `LLM server failed to become healthy after ${maxAttempts} attempts (${(maxAttempts * intervalMs) / 1000}s)`,
    maxAttempts,
    lastError
  );
}

/**
 * Sleep for specified milliseconds
 *
 * @param ms Milliseconds to sleep
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Poll health check endpoint with progress logging
 *
 * @param url Health check endpoint URL
 * @param maxAttempts Maximum number of attempts
 * @param intervalMs Interval between attempts
 * @param onProgress Optional progress callback
 * @returns Health check result when healthy
 */
export async function waitForHealthyWithProgress(
  url: string,
  maxAttempts: number = 30,
  intervalMs: number = 1000,
  onProgress?: (attempt: number, maxAttempts: number, error?: Error) => void
): Promise<HealthCheckResult> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const result = await checkHealth(url, 5000);

    if (onProgress) {
      onProgress(attempt, maxAttempts, result.error);
    }

    if (result.healthy) {
      return {
        ...result,
        attemptsUsed: attempt,
      };
    }

    lastError = result.error;

    if (attempt < maxAttempts) {
      await sleep(intervalMs);
    }
  }

  throw new HealthCheckError(
    `LLM server failed to become healthy after ${maxAttempts} attempts`,
    maxAttempts,
    lastError
  );
}

/**
 * Validate health check response structure
 *
 * @param data Response data to validate
 * @returns True if valid health check response
 */
export function isValidHealthCheckResponse(data: unknown): data is HealthCheckResponse {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const obj = data as Record<string, unknown>;

  return (
    (obj['status'] === 'ok' || obj['status'] === 'error') &&
    typeof obj['model_loaded'] === 'boolean' &&
    (obj['model_name'] === null || typeof obj['model_name'] === 'string') &&
    typeof obj['uptime_seconds'] === 'number'
  );
}
