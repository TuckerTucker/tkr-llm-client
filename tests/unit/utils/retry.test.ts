/**
 * Tests for retry utilities
 *
 * Tests exponential backoff and retry logic
 */

import { describe, it, expect, vi } from 'vitest';
import {
  withRetry,
  isNetworkError,
  isRateLimitError,
  isRetryableError,
  RetryOptions,
} from '../../../src/utils/retry';

describe('withRetry', () => {

  it('should return result on first attempt success', async () => {
    const fn = vi.fn().mockResolvedValue('success');

    const result = await withRetry(fn, { initialDelay: 10 });

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('Fail 1'))
      .mockRejectedValueOnce(new Error('Fail 2'))
      .mockResolvedValueOnce('success');

    const result = await withRetry(fn, { initialDelay: 10 });

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should respect maxAttempts', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('Always fails'));

    await expect(
      withRetry(fn, { maxAttempts: 3, initialDelay: 10 })
    ).rejects.toThrow('Always fails');

    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should call onRetry callback', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('Fail 1'))
      .mockResolvedValueOnce('success');

    const onRetry = vi.fn();

    await withRetry(fn, { onRetry, initialDelay: 10 });

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 1);
  });

  it('should not retry when isRetryable returns false', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('Non-retryable'));

    await expect(
      withRetry(fn, {
        isRetryable: () => false,
        initialDelay: 10,
      })
    ).rejects.toThrow('Non-retryable');

    expect(fn).toHaveBeenCalledTimes(1); // Only initial attempt
  });

  it('should use custom isRetryable predicate', async () => {
    const retryableError = new Error('RETRY_ME');
    const nonRetryableError = new Error('DO_NOT_RETRY');

    const fn = vi
      .fn()
      .mockRejectedValueOnce(retryableError)
      .mockRejectedValueOnce(nonRetryableError);

    const isRetryable = (error: Error) => error.message === 'RETRY_ME';

    await expect(
      withRetry(fn, { isRetryable, initialDelay: 10 })
    ).rejects.toThrow('DO_NOT_RETRY');

    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should preserve error stack trace', async () => {
    const originalError = new Error('Original error');
    const fn = vi.fn().mockRejectedValue(originalError);

    try {
      await withRetry(fn, { maxAttempts: 2, initialDelay: 10 });
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error).toBe(originalError);
      expect((error as Error).stack).toBeDefined();
    }
  });
});

describe('isNetworkError', () => {
  it('should detect network errors by message', () => {
    expect(isNetworkError(new Error('network error'))).toBe(true);
    expect(isNetworkError(new Error('Network timeout'))).toBe(true);
    expect(isNetworkError(new Error('NETWORK_FAILURE'))).toBe(true);
  });

  it('should detect timeout errors', () => {
    expect(isNetworkError(new Error('Request timeout'))).toBe(true);
    expect(isNetworkError(new Error('timeout exceeded'))).toBe(true);
    expect(isNetworkError(new Error('TIMEOUT'))).toBe(true);
  });

  it('should detect connection errors', () => {
    expect(isNetworkError(new Error('ECONNREFUSED'))).toBe(true);
    expect(isNetworkError(new Error('ENOTFOUND'))).toBe(true);
    expect(isNetworkError(new Error('fetch failed'))).toBe(true);
  });

  it('should return false for non-network errors', () => {
    expect(isNetworkError(new Error('Database error'))).toBe(false);
    expect(isNetworkError(new Error('Invalid input'))).toBe(false);
    expect(isNetworkError(new Error('Something else'))).toBe(false);
  });

  it('should be case insensitive', () => {
    expect(isNetworkError(new Error('NETWORK ERROR'))).toBe(true);
    expect(isNetworkError(new Error('Network Error'))).toBe(true);
    expect(isNetworkError(new Error('network error'))).toBe(true);
  });
});

describe('isRateLimitError', () => {
  it('should detect rate limit by message', () => {
    expect(isRateLimitError(new Error('rate limit exceeded'))).toBe(true);
    expect(isRateLimitError(new Error('Rate Limit Error'))).toBe(true);
    expect(isRateLimitError(new Error('RATE LIMIT'))).toBe(true);
  });

  it('should detect 429 status code', () => {
    expect(isRateLimitError(new Error('HTTP 429 error'))).toBe(true);
    expect(isRateLimitError(new Error('Status code: 429'))).toBe(true);
    expect(isRateLimitError(new Error('429'))).toBe(true);
  });

  it('should detect "too many requests" message', () => {
    expect(isRateLimitError(new Error('too many requests'))).toBe(true);
    expect(isRateLimitError(new Error('Too Many Requests'))).toBe(true);
    expect(isRateLimitError(new Error('TOO MANY REQUESTS'))).toBe(true);
  });

  it('should return false for non-rate-limit errors', () => {
    expect(isRateLimitError(new Error('Database error'))).toBe(false);
    expect(isRateLimitError(new Error('Invalid input'))).toBe(false);
    expect(isRateLimitError(new Error('Network timeout'))).toBe(false);
  });

  it('should be case insensitive', () => {
    expect(isRateLimitError(new Error('RATE LIMIT'))).toBe(true);
    expect(isRateLimitError(new Error('Rate Limit'))).toBe(true);
    expect(isRateLimitError(new Error('rate limit'))).toBe(true);
  });
});

describe('isRetryableError', () => {
  it('should return true for network errors', () => {
    expect(isRetryableError(new Error('network error'))).toBe(true);
    expect(isRetryableError(new Error('ECONNREFUSED'))).toBe(true);
  });

  it('should return true for rate limit errors', () => {
    expect(isRetryableError(new Error('rate limit exceeded'))).toBe(true);
    expect(isRetryableError(new Error('429 Too Many Requests'))).toBe(true);
  });

  it('should return false for other errors', () => {
    expect(isRetryableError(new Error('Validation failed'))).toBe(false);
    expect(isRetryableError(new Error('Database error'))).toBe(false);
  });

  it('should handle combined error types', () => {
    expect(isRetryableError(new Error('Network timeout'))).toBe(true);
    expect(isRetryableError(new Error('Rate limit network error'))).toBe(true);
  });
});
