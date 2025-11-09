/**
 * Tests for custom error classes
 *
 * Tests error hierarchy, prototype chain, and error serialization
 */

import { describe, it, expect } from 'vitest';
import {
  LLMClientError,
  QueryError,
  QueryTimeoutError,
  ServerUnavailableError,
  ConfigurationError,
} from '../../../src/errors';

describe('LLMClientError', () => {
  it('should create error with message', () => {
    const error = new LLMClientError('Test error');

    expect(error.message).toBe('Test error');
    expect(error.name).toBe('LLMClientError');
  });

  it('should have correct prototype chain', () => {
    const error = new LLMClientError('Test');

    expect(error).toBeInstanceOf(LLMClientError);
    expect(error).toBeInstanceOf(Error);
  });

  it('should support cause chaining', () => {
    const cause = new Error('Root cause');
    const error = new LLMClientError('Wrapper error', cause);

    expect(error.cause).toBe(cause);
    expect(error.cause?.message).toBe('Root cause');
  });

  it('should work with instanceof checks', () => {
    const error = new LLMClientError('Test');

    expect(error instanceof LLMClientError).toBe(true);
    expect(error instanceof Error).toBe(true);
  });

  it('should have stack trace', () => {
    const error = new LLMClientError('Test');

    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('LLMClientError');
  });
});

describe('QueryError', () => {
  it('should create error with message', () => {
    const error = new QueryError('Query failed');

    expect(error.message).toBe('Query failed');
    expect(error.name).toBe('QueryError');
  });

  it('should extend LLMClientError', () => {
    const error = new QueryError('Test');

    expect(error).toBeInstanceOf(QueryError);
    expect(error).toBeInstanceOf(LLMClientError);
    expect(error).toBeInstanceOf(Error);
  });

  it('should support cause chaining', () => {
    const cause = new Error('Network error');
    const error = new QueryError('Query failed', cause);

    expect(error.cause).toBe(cause);
  });

  it('should preserve error name in stack', () => {
    const error = new QueryError('Test');

    expect(error.stack).toContain('QueryError');
  });
});

describe('QueryTimeoutError', () => {
  it('should create error with timeout value', () => {
    const error = new QueryTimeoutError('Timeout', 5000);

    expect(error.message).toBe('Timeout');
    expect(error.name).toBe('QueryTimeoutError');
    expect(error.timeoutMs).toBe(5000);
  });

  it('should extend LLMClientError', () => {
    const error = new QueryTimeoutError('Test', 1000);

    expect(error).toBeInstanceOf(QueryTimeoutError);
    expect(error).toBeInstanceOf(LLMClientError);
    expect(error).toBeInstanceOf(Error);
  });

  it('should support cause chaining', () => {
    const cause = new Error('Underlying timeout');
    const error = new QueryTimeoutError('Query timeout', 3000, cause);

    expect(error.cause).toBe(cause);
    expect(error.timeoutMs).toBe(3000);
  });

  it('should store timeout value correctly', () => {
    const error = new QueryTimeoutError('Timeout after 10s', 10000);

    expect(error.timeoutMs).toBe(10000);
  });
});

describe('ServerUnavailableError', () => {
  it('should create error with message', () => {
    const error = new ServerUnavailableError('Server down');

    expect(error.message).toBe('Server down');
    expect(error.name).toBe('ServerUnavailableError');
  });

  it('should extend LLMClientError', () => {
    const error = new ServerUnavailableError('Test');

    expect(error).toBeInstanceOf(ServerUnavailableError);
    expect(error).toBeInstanceOf(LLMClientError);
    expect(error).toBeInstanceOf(Error);
  });

  it('should support cause chaining', () => {
    const cause = new Error('ECONNREFUSED');
    const error = new ServerUnavailableError('Cannot connect', cause);

    expect(error.cause).toBe(cause);
  });
});

describe('ConfigurationError', () => {
  it('should create error with message', () => {
    const error = new ConfigurationError('Invalid config');

    expect(error.message).toBe('Invalid config');
    expect(error.name).toBe('ConfigurationError');
  });

  it('should extend LLMClientError', () => {
    const error = new ConfigurationError('Test');

    expect(error).toBeInstanceOf(ConfigurationError);
    expect(error).toBeInstanceOf(LLMClientError);
    expect(error).toBeInstanceOf(Error);
  });

  it('should support cause chaining', () => {
    const cause = new Error('Invalid port');
    const error = new ConfigurationError('Config validation failed', cause);

    expect(error.cause).toBe(cause);
  });
});

describe('Error hierarchy', () => {
  it('should maintain correct inheritance chain', () => {
    const errors = [
      new QueryError('query'),
      new QueryTimeoutError('timeout', 1000),
      new ServerUnavailableError('unavailable'),
      new ConfigurationError('config'),
    ];

    errors.forEach(error => {
      expect(error).toBeInstanceOf(LLMClientError);
      expect(error).toBeInstanceOf(Error);
    });
  });

  it('should allow type discrimination with instanceof', () => {
    const error: LLMClientError = new QueryTimeoutError('Test', 5000);

    if (error instanceof QueryTimeoutError) {
      expect(error.timeoutMs).toBe(5000);
    } else {
      throw new Error('Type discrimination failed');
    }
  });

  it('should preserve names for debugging', () => {
    const errors = [
      new LLMClientError('base'),
      new QueryError('query'),
      new QueryTimeoutError('timeout', 1000),
      new ServerUnavailableError('unavailable'),
      new ConfigurationError('config'),
    ];

    const expectedNames = [
      'LLMClientError',
      'QueryError',
      'QueryTimeoutError',
      'ServerUnavailableError',
      'ConfigurationError',
    ];

    errors.forEach((error, index) => {
      expect(error.name).toBe(expectedNames[index]);
    });
  });
});

describe('Error properties', () => {
  it('should have accessible message property', () => {
    const error = new QueryError('Test error');

    expect(error.message).toBe('Test error');
    expect(error.name).toBe('QueryError');
  });

  it('should have accessible cause property', () => {
    const cause = new Error('Root cause');
    const error = new QueryError('Wrapper', cause);

    expect(error.cause).toBe(cause);
    expect(error.cause?.message).toBe('Root cause');
  });

  it('should have accessible timeout property', () => {
    const error = new QueryTimeoutError('Timeout', 5000);

    expect(error.timeoutMs).toBe(5000);
    expect(error.message).toBe('Timeout');
    expect(error.name).toBe('QueryTimeoutError');
  });
});

describe('Error throwing and catching', () => {
  it('should be catchable as LLMClientError', () => {
    try {
      throw new QueryError('Test');
    } catch (error) {
      expect(error).toBeInstanceOf(LLMClientError);
      expect((error as LLMClientError).message).toBe('Test');
    }
  });

  it('should be catchable as Error', () => {
    try {
      throw new ServerUnavailableError('Test');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('Test');
    }
  });

  it('should support error re-throwing', () => {
    const rethrow = () => {
      try {
        throw new ConfigurationError('Invalid');
      } catch (error) {
        if (error instanceof ConfigurationError) {
          throw error;
        }
      }
    };

    expect(rethrow).toThrow(ConfigurationError);
  });
});
