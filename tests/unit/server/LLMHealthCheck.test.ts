/**
 * Tests for LLM server health check utilities
 *
 * Tests health checking, retry logic, and response validation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  HealthCheckResponse,
  HealthCheckResult,
  checkHealth,
  waitForHealthy,
  waitForHealthyWithProgress,
  isValidHealthCheckResponse,
} from '../../../src/server/LLMHealthCheck';
import { HealthCheckError } from '../../../src/server/LLMConfig';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

describe('checkHealth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return healthy when server responds ok with model loaded', async () => {
    const healthResponse: HealthCheckResponse = {
      status: 'ok',
      model_loaded: true,
      model_name: 'test-model',
      uptime_seconds: 120,
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => healthResponse,
    });

    const result = await checkHealth('http://localhost:42002/health');

    expect(result.healthy).toBe(true);
    expect(result.response).toEqual(healthResponse);
    expect(result.attemptsUsed).toBe(1);
    expect(result.error).toBeUndefined();
  });

  it('should return unhealthy when server status is error', async () => {
    const healthResponse: HealthCheckResponse = {
      status: 'error',
      model_loaded: false,
      model_name: null,
      uptime_seconds: 10,
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => healthResponse,
    });

    const result = await checkHealth('http://localhost:42002/health');

    expect(result.healthy).toBe(false);
    expect(result.response).toEqual(healthResponse);
    expect(result.error?.message).toContain('model not loaded');
  });

  it('should return unhealthy when model not loaded', async () => {
    const healthResponse: HealthCheckResponse = {
      status: 'ok',
      model_loaded: false,
      model_name: null,
      uptime_seconds: 5,
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => healthResponse,
    });

    const result = await checkHealth('http://localhost:42002/health');

    expect(result.healthy).toBe(false);
    expect(result.error?.message).toContain('model not loaded');
  });

  it('should return unhealthy when HTTP status is not ok', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
    });

    const result = await checkHealth('http://localhost:42002/health');

    expect(result.healthy).toBe(false);
    expect(result.error?.message).toContain('status 500');
  });

  it('should return unhealthy on network error', async () => {
    mockFetch.mockRejectedValue(new Error('ECONNREFUSED'));

    const result = await checkHealth('http://localhost:42002/health');

    expect(result.healthy).toBe(false);
    expect(result.error?.message).toBe('ECONNREFUSED');
  });

  it('should handle timeout with AbortController', async () => {
    mockFetch.mockImplementation((url: string, options: any) => {
      return new Promise((resolve, reject) => {
        if (options?.signal) {
          options.signal.addEventListener('abort', () => {
            reject(new Error('Request aborted'));
          });
        }
        // Never resolve to simulate hanging request
      });
    });

    const result = await checkHealth('http://localhost:42002/health', 100);

    expect(result.healthy).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should use custom timeout', async () => {
    const start = Date.now();

    mockFetch.mockImplementation((url: string, options: any) => {
      return new Promise((resolve, reject) => {
        if (options?.signal) {
          options.signal.addEventListener('abort', () => {
            reject(new Error('Timeout'));
          });
        }
      });
    });

    await checkHealth('http://localhost:42002/health', 200);
    const elapsed = Date.now() - start;

    // Should timeout around 200ms
    expect(elapsed).toBeGreaterThanOrEqual(180);
    expect(elapsed).toBeLessThan(350);
  });

  it('should call fetch with correct URL', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'ok',
        model_loaded: true,
        model_name: 'test',
        uptime_seconds: 10,
      }),
    });

    await checkHealth('http://custom:8080/health');

    expect(mockFetch).toHaveBeenCalledWith(
      'http://custom:8080/health',
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('should handle malformed JSON response', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => {
        throw new Error('Invalid JSON');
      },
    });

    const result = await checkHealth('http://localhost:42002/health');

    expect(result.healthy).toBe(false);
    expect(result.error?.message).toBe('Invalid JSON');
  });
});

describe('waitForHealthy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return immediately when healthy on first attempt', async () => {
    const healthResponse: HealthCheckResponse = {
      status: 'ok',
      model_loaded: true,
      model_name: 'test-model',
      uptime_seconds: 60,
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => healthResponse,
    });

    const result = await waitForHealthy('http://localhost:42002/health', 5, 100);

    expect(result.healthy).toBe(true);
    expect(result.attemptsUsed).toBe(1);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should retry until healthy', async () => {
    const healthResponse: HealthCheckResponse = {
      status: 'ok',
      model_loaded: true,
      model_name: 'test-model',
      uptime_seconds: 60,
    };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...healthResponse, model_loaded: false }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...healthResponse, model_loaded: false }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => healthResponse,
      });

    const result = await waitForHealthy('http://localhost:42002/health', 5, 10);

    expect(result.healthy).toBe(true);
    expect(result.attemptsUsed).toBe(3);
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('should throw HealthCheckError after max attempts', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 503,
    });

    await expect(
      waitForHealthy('http://localhost:42002/health', 3, 10)
    ).rejects.toThrow(HealthCheckError);

    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('should include attempts count in error', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 503,
    });

    try {
      await waitForHealthy('http://localhost:42002/health', 5, 10);
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(HealthCheckError);
      expect((error as HealthCheckError).attempts).toBe(5);
    }
  });

  it('should respect interval between attempts', async () => {
    const attemptTimes: number[] = [];

    mockFetch.mockImplementation(async () => {
      attemptTimes.push(Date.now());
      return {
        ok: false,
        status: 503,
      };
    });

    try {
      await waitForHealthy('http://localhost:42002/health', 3, 50);
    } catch (error) {
      // Expected to throw
    }

    // Calculate intervals between attempts
    expect(attemptTimes.length).toBe(3);
    const interval1 = attemptTimes[1] - attemptTimes[0];
    const interval2 = attemptTimes[2] - attemptTimes[1];

    // Each interval should be around 50ms (allow variance)
    expect(interval1).toBeGreaterThanOrEqual(40);
    expect(interval1).toBeLessThan(100);
    expect(interval2).toBeGreaterThanOrEqual(40);
    expect(interval2).toBeLessThan(100);
  });

  it('should not sleep after last attempt', async () => {
    const start = Date.now();

    mockFetch.mockResolvedValue({
      ok: false,
      status: 503,
    });

    try {
      await waitForHealthy('http://localhost:42002/health', 3, 100);
    } catch (error) {
      // Expected
    }

    const elapsed = Date.now() - start;

    // 3 attempts with 100ms interval = ~200ms total (not 300ms)
    expect(elapsed).toBeLessThan(300);
  });

  it('should use custom timeout per attempt', async () => {
    mockFetch.mockImplementation(({ signal }: any) => {
      return new Promise((resolve, reject) => {
        signal.addEventListener('abort', () => {
          reject(new Error('Timeout'));
        });
      });
    });

    try {
      await waitForHealthy('http://localhost:42002/health', 2, 10, 50);
    } catch (error) {
      // Expected
    }

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});

describe('waitForHealthyWithProgress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call progress callback on each attempt', async () => {
    const healthResponse: HealthCheckResponse = {
      status: 'ok',
      model_loaded: true,
      model_name: 'test',
      uptime_seconds: 10,
    };

    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...healthResponse, model_loaded: false }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => healthResponse,
      });

    const progressCalls: Array<{ attempt: number; maxAttempts: number; error?: Error }> = [];

    const onProgress = (attempt: number, maxAttempts: number, error?: Error) => {
      progressCalls.push({ attempt, maxAttempts, error });
    };

    const result = await waitForHealthyWithProgress(
      'http://localhost:42002/health',
      5,
      10,
      onProgress
    );

    expect(result.healthy).toBe(true);
    expect(result.attemptsUsed).toBe(3);
    expect(progressCalls).toHaveLength(3);

    expect(progressCalls[0].attempt).toBe(1);
    expect(progressCalls[0].maxAttempts).toBe(5);
    expect(progressCalls[0].error).toBeDefined();

    expect(progressCalls[1].attempt).toBe(2);
    expect(progressCalls[1].error).toBeDefined();

    expect(progressCalls[2].attempt).toBe(3);
    expect(progressCalls[2].error).toBeUndefined();
  });

  it('should work without progress callback', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'ok',
        model_loaded: true,
        model_name: 'test',
        uptime_seconds: 10,
      }),
    });

    const result = await waitForHealthyWithProgress(
      'http://localhost:42002/health',
      3,
      10
    );

    expect(result.healthy).toBe(true);
  });

  it('should throw HealthCheckError on max attempts with progress', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 503,
    });

    const progressCalls: number[] = [];
    const onProgress = (attempt: number) => progressCalls.push(attempt);

    await expect(
      waitForHealthyWithProgress(
        'http://localhost:42002/health',
        3,
        10,
        onProgress
      )
    ).rejects.toThrow(HealthCheckError);

    expect(progressCalls).toEqual([1, 2, 3]);
  });
});

describe('isValidHealthCheckResponse', () => {
  it('should validate correct response', () => {
    const response: HealthCheckResponse = {
      status: 'ok',
      model_loaded: true,
      model_name: 'test-model',
      uptime_seconds: 120,
    };

    expect(isValidHealthCheckResponse(response)).toBe(true);
  });

  it('should accept error status', () => {
    const response = {
      status: 'error',
      model_loaded: false,
      model_name: null,
      uptime_seconds: 10,
    };

    expect(isValidHealthCheckResponse(response)).toBe(true);
  });

  it('should accept null model_name', () => {
    const response = {
      status: 'ok',
      model_loaded: false,
      model_name: null,
      uptime_seconds: 5,
    };

    expect(isValidHealthCheckResponse(response)).toBe(true);
  });

  it('should reject invalid status', () => {
    const response = {
      status: 'invalid',
      model_loaded: true,
      model_name: 'test',
      uptime_seconds: 10,
    };

    expect(isValidHealthCheckResponse(response)).toBe(false);
  });

  it('should reject missing model_loaded', () => {
    const response = {
      status: 'ok',
      model_name: 'test',
      uptime_seconds: 10,
    };

    expect(isValidHealthCheckResponse(response)).toBe(false);
  });

  it('should reject non-boolean model_loaded', () => {
    const response = {
      status: 'ok',
      model_loaded: 'true',
      model_name: 'test',
      uptime_seconds: 10,
    };

    expect(isValidHealthCheckResponse(response)).toBe(false);
  });

  it('should reject missing uptime_seconds', () => {
    const response = {
      status: 'ok',
      model_loaded: true,
      model_name: 'test',
    };

    expect(isValidHealthCheckResponse(response)).toBe(false);
  });

  it('should reject non-number uptime_seconds', () => {
    const response = {
      status: 'ok',
      model_loaded: true,
      model_name: 'test',
      uptime_seconds: '120',
    };

    expect(isValidHealthCheckResponse(response)).toBe(false);
  });

  it('should reject null input', () => {
    expect(isValidHealthCheckResponse(null)).toBe(false);
  });

  it('should reject undefined input', () => {
    expect(isValidHealthCheckResponse(undefined)).toBe(false);
  });

  it('should reject non-object input', () => {
    expect(isValidHealthCheckResponse('string')).toBe(false);
    expect(isValidHealthCheckResponse(123)).toBe(false);
    expect(isValidHealthCheckResponse(true)).toBe(false);
  });

  it('should reject array input', () => {
    expect(isValidHealthCheckResponse([])).toBe(false);
  });

  it('should reject invalid model_name type', () => {
    const response = {
      status: 'ok',
      model_loaded: true,
      model_name: 123,
      uptime_seconds: 10,
    };

    expect(isValidHealthCheckResponse(response)).toBe(false);
  });
});
