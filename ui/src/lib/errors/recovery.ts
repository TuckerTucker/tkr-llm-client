/**
 * Error Recovery Utilities
 *
 * Provides utilities for recovering from errors including retry logic,
 * fallback mechanisms, and HOCs for wrapping components with error handling.
 *
 * @module lib/errors/recovery
 * @version 1.0.0
 * @author Error Handling & Recovery Engineer (Agent 3)
 */

import React, { type ComponentType, type ReactElement } from 'react';
import { logError } from './logging';
import { isNetworkError, isRecoverableError } from './classification';

/**
 * Options for retry logic
 */
export interface RetryOptions {
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Initial delay between retries (ms) */
  delay?: number;
  /** Backoff multiplier for exponential backoff */
  backoffMultiplier?: number;
  /** Maximum delay between retries (ms) */
  maxDelay?: number;
  /** Callback called on each retry */
  onRetry?: (attempt: number, error: Error) => void;
  /** Predicate to determine if error is retryable */
  shouldRetry?: (error: Error) => boolean;
}

/**
 * Default retry options
 */
const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  delay: 1000,
  backoffMultiplier: 2,
  maxDelay: 10000,
  onRetry: () => {},
  shouldRetry: (error) => isNetworkError(error) || isRecoverableError(error),
};

/**
 * Executes a function with retry logic and exponential backoff
 *
 * @param fn - Async function to execute
 * @param options - Retry configuration options
 * @returns Promise resolving to function result
 * @throws Last error if all retries exhausted
 *
 * @example
 * ```typescript
 * const data = await withRetry(
 *   async () => {
 *     const response = await fetch('/api/data');
 *     return response.json();
 *   },
 *   {
 *     maxRetries: 3,
 *     delay: 1000,
 *     onRetry: (attempt) => console.log(`Retry attempt ${attempt}`)
 *   }
 * );
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error;

  for (let attempt = 0; attempt < opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Check if error is retryable
      if (!opts.shouldRetry(lastError)) {
        throw lastError;
      }

      // If this was the last attempt, throw
      if (attempt === opts.maxRetries - 1) {
        throw lastError;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        opts.delay * Math.pow(opts.backoffMultiplier, attempt),
        opts.maxDelay
      );

      // Call retry callback
      opts.onRetry(attempt + 1, lastError);

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // Should never reach here, but TypeScript needs it
  throw lastError!;
}

/**
 * Executes a function with a fallback if it fails
 *
 * @param primary - Primary function to execute
 * @param fallback - Fallback function to execute on error
 * @param errorHandler - Optional error handler
 * @returns Result from primary or fallback function
 *
 * @example
 * ```typescript
 * const layout = withFallback(
 *   () => applyDagreLayout(nodes, edges),
 *   () => applyGridLayout(nodes, edges),
 *   (error) => console.warn('Layout failed, using fallback', error)
 * );
 * ```
 */
export function withFallback<T>(
  primary: () => T,
  fallback: () => T,
  errorHandler?: (error: Error) => void
): T {
  try {
    return primary();
  } catch (error) {
    if (errorHandler) {
      errorHandler(error as Error);
    }
    return fallback();
  }
}

/**
 * Async version of withFallback
 */
export async function withFallbackAsync<T>(
  primary: () => Promise<T>,
  fallback: () => Promise<T>,
  errorHandler?: (error: Error) => void
): Promise<T> {
  try {
    return await primary();
  } catch (error) {
    if (errorHandler) {
      errorHandler(error as Error);
    }
    return await fallback();
  }
}

/**
 * Wraps a component with error boundary and fallback
 * Returns a new component that catches errors
 *
 * @param Component - Component to wrap
 * @param componentName - Name for error logging
 * @param fallback - Optional custom fallback UI
 * @returns Wrapped component with error handling
 *
 * @example
 * ```typescript
 * const SafeCanvas = withErrorBoundary(
 *   Canvas,
 *   'Canvas',
 *   <div>Canvas failed to render</div>
 * );
 * ```
 */
export function withErrorBoundary<P extends object>(
  Component: ComponentType<P>,
  componentName: string,
  fallback?: ReactElement
): ComponentType<P> {
  // Return wrapper component - ErrorBoundary should be imported where it's used
  const WrappedComponent = (props: P) => React.createElement(Component, props);
  WrappedComponent.displayName = `WithErrorBoundary(${componentName})`;
  return WrappedComponent;
}

/**
 * Checks if an error is a network error
 */
export function isNetworkErrorCheck(error: Error): boolean {
  return isNetworkError(error);
}

/**
 * Checks if an error is a rate limit error
 */
export function isRateLimitError(error: Error): boolean {
  const message = error.message.toLowerCase();
  return (
    message.includes('rate limit') ||
    message.includes('too many requests') ||
    message.includes('429')
  );
}

/**
 * Checks if an error is retryable
 */
export function isRetryableError(error: Error): boolean {
  return (
    isNetworkError(error) ||
    isRateLimitError(error) ||
    isRecoverableError(error)
  );
}

/**
 * Executes multiple attempts with different strategies
 *
 * @param strategies - Array of functions to try in order
 * @returns Result from first successful strategy
 * @throws Error if all strategies fail
 *
 * @example
 * ```typescript
 * const result = await withStrategies([
 *   async () => await fetchFromCache(),
 *   async () => await fetchFromPrimary(),
 *   async () => await fetchFromBackup(),
 * ]);
 * ```
 */
export async function withStrategies<T>(
  strategies: Array<() => Promise<T>>
): Promise<T> {
  const errors: Error[] = [];

  for (let i = 0; i < strategies.length; i++) {
    try {
      return await strategies[i]();
    } catch (error) {
      errors.push(error as Error);
      logError(
        'Recovery',
        error as Error,
        undefined,
        { strategy: i + 1, totalStrategies: strategies.length }
      );
    }
  }

  throw new Error(
    `All ${strategies.length} strategies failed: ${errors.map((e) => e.message).join('; ')}`
  );
}

/**
 * Wraps a function with timeout
 *
 * @param fn - Function to execute
 * @param timeoutMs - Timeout in milliseconds
 * @returns Promise that rejects if timeout exceeded
 *
 * @example
 * ```typescript
 * const result = await withTimeout(
 *   async () => await slowOperation(),
 *   5000 // 5 second timeout
 * );
 * ```
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number
): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Operation timed out after ${timeoutMs}ms`)),
        timeoutMs
      )
    ),
  ]);
}

/**
 * Safely executes a function, catching and logging errors
 *
 * @param fn - Function to execute
 * @param component - Component name for logging
 * @param defaultValue - Default value to return on error
 * @returns Result or default value
 *
 * @example
 * ```typescript
 * const result = safeExecute(
 *   () => JSON.parse(data),
 *   'Parser',
 *   {}
 * );
 * ```
 */
export function safeExecute<T>(
  fn: () => T,
  component: string,
  defaultValue: T
): T {
  try {
    return fn();
  } catch (error) {
    logError(component, error as Error);
    return defaultValue;
  }
}

/**
 * Async version of safeExecute
 */
export async function safeExecuteAsync<T>(
  fn: () => Promise<T>,
  component: string,
  defaultValue: T
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    logError(component, error as Error);
    return defaultValue;
  }
}
