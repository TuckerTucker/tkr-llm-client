/**
 * Error Types for LLM Client
 *
 * Custom error classes for different failure modes
 */

/**
 * Base error for LLM client issues
 */
export class LLMClientError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'LLMClientError';
    Object.setPrototypeOf(this, LLMClientError.prototype);
  }
}

/**
 * Query execution failed
 */
export class QueryError extends LLMClientError {
  constructor(message: string, cause?: Error) {
    super(message, cause);
    this.name = 'QueryError';
    Object.setPrototypeOf(this, QueryError.prototype);
  }
}

/**
 * Query timeout
 */
export class QueryTimeoutError extends LLMClientError {
  constructor(
    message: string,
    public readonly timeoutMs: number,
    cause?: Error
  ) {
    super(message, cause);
    this.name = 'QueryTimeoutError';
    Object.setPrototypeOf(this, QueryTimeoutError.prototype);
  }
}

/**
 * Server not available
 */
export class ServerUnavailableError extends LLMClientError {
  constructor(message: string, cause?: Error) {
    super(message, cause);
    this.name = 'ServerUnavailableError';
    Object.setPrototypeOf(this, ServerUnavailableError.prototype);
  }
}

/**
 * Configuration error
 */
export class ConfigurationError extends LLMClientError {
  constructor(message: string, cause?: Error) {
    super(message, cause);
    this.name = 'ConfigurationError';
    Object.setPrototypeOf(this, ConfigurationError.prototype);
  }
}
