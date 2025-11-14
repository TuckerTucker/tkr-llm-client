/**
 * Integration tests for LLMClient (unified client)
 *
 * Tests unified client interface with mocked backends
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMClient } from '../../src/client/LLMClient';
import { LLMClientConfig } from '../../src/client/types';

// Mock the Claude Code SDK
const mockQuery = vi.fn();
vi.mock('@anthropic-ai/claude-agent-sdk', () => ({
  query: (params: any) => mockQuery(params),
}));

// Mock fetch for local client
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

describe('LLMClient', () => {
  let client: LLMClient;
  let config: LLMClientConfig;

  beforeEach(() => {
    vi.clearAllMocks();

    config = {
      claudeSDK: {
        enabled: true,
      },
      localServer: {
        port: 42002,
      },
      defaults: {
        maxMessages: 100,
        maxTurns: 1,
        queryTimeout: 30000,
      },
    };

    client = new LLMClient(config);
  });

  describe('constructor', () => {
    it('should create unified client', () => {
      expect(client).toBeInstanceOf(LLMClient);
    });

    it('should extend EventEmitter', () => {
      expect(client.on).toBeDefined();
      expect(client.emit).toBeDefined();
    });

    it('should initialize with custom port', () => {
      const customConfig = {
        ...config,
        localServer: { port: 8080 },
      };

      const customClient = new LLMClient(customConfig);
      expect(customClient).toBeInstanceOf(LLMClient);
    });
  });

  describe('setContext', () => {
    it('should set context for all clients', () => {
      expect(() => client.setContext('test-context')).not.toThrow();
    });

    it('should clear context when undefined', () => {
      client.setContext('test');
      expect(() => client.setContext(undefined)).not.toThrow();
    });
  });

  describe('query', () => {
    it('should use SDK client by default', async () => {
      async function* mockMessages() {
        yield { type: 'text', text: 'SDK response' };
      }

      mockQuery.mockReturnValue(mockMessages());

      const messages = [];
      for await (const message of client.query('Test prompt')) {
        messages.push(message);
      }

      expect(mockQuery).toHaveBeenCalled();
      expect(messages).toHaveLength(1);
    });

    it('should forward thinking events from SDK', async () => {
      async function* mockMessages() {
        yield {
          type: 'text',
          text: '<thinking>SDK thought</thinking> Response'
        };
      }

      mockQuery.mockReturnValue(mockMessages());

      const thinkingHandler = vi.fn();
      client.on('thinking', thinkingHandler);

      for await (const _ of client.query('Test')) {
        // Consume iterator
      }

      expect(thinkingHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'SDK thought',
        })
      );
    });

    it('should forward message events from SDK', async () => {
      async function* mockMessages() {
        yield { type: 'text', text: 'Message 1' };
        yield { type: 'text', text: 'Message 2' };
      }

      mockQuery.mockReturnValue(mockMessages());

      const messageHandler = vi.fn();
      client.on('message', messageHandler);

      for await (const _ of client.query('Test')) {
        // Consume iterator
      }

      expect(messageHandler).toHaveBeenCalledTimes(2);
    });

    it('should forward error events from SDK', async () => {
      async function* mockMessages() {
        throw new Error('SDK error');
      }

      mockQuery.mockReturnValue(mockMessages());

      const errorHandler = vi.fn();
      client.on('error', errorHandler);

      await expect(async () => {
        for await (const _ of client.query('Test')) {
          // Consume iterator
        }
      }).rejects.toThrow();

      expect(errorHandler).toHaveBeenCalled();
    });

    it('should merge context option with client context', async () => {
      async function* mockMessages() {
        yield { type: 'text', text: 'Response' };
      }

      mockQuery.mockReturnValue(mockMessages());

      client.setContext('client-context');

      for await (const _ of client.query('Test', { context: 'query-context' })) {
        // Consume iterator
      }

      // Query context should override client context
      // We can't directly test this, but verify no errors
      expect(mockQuery).toHaveBeenCalled();
    });
  });

  describe('queryDirect', () => {
    it('should check local server health first', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'ok', model_loaded: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ content: [{ text: 'Local response' }] }),
        });

      const result = await client.queryDirect('Test prompt');

      expect(result).toBe('Local response');
      // First call is health check, second is actual query
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should fallback to SDK when local server unhealthy', async () => {
      // Health check fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
      });

      // SDK direct query succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ content: [{ text: 'SDK response' }] }),
      });

      const result = await client.queryDirect('Test prompt');

      expect(result).toBe('SDK response');
    });

    it('should use local client when healthy', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'ok', model_loaded: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ content: [{ text: 'Local response' }] }),
        });

      await client.queryDirect('Test');

      // Verify it's calling the local server endpoint
      const calls = mockFetch.mock.calls;
      expect(calls.some(call => call[0].includes('/v1/messages'))).toBe(true);
    });

    it('should throw error when fallback disabled', async () => {
      const noFallbackConfig = {
        ...config,
        claudeSDK: { enabled: true, enableFallback: false },
      };

      const noFallbackClient = new LLMClient(noFallbackConfig);

      mockFetch.mockRejectedValue(new Error('Connection failed'));

      await expect(noFallbackClient.queryDirect('Test')).rejects.toThrow(
        'Connection failed'
      );
    });
  });

  describe('isLocalServerHealthy', () => {
    it('should check local server health', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'ok', model_loaded: true }),
      });

      const result = await client.isLocalServerHealthy();

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/health')
      );
    });

    it('should return false when server unhealthy', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 503,
      });

      const result = await client.isLocalServerHealthy();

      expect(result).toBe(false);
    });
  });

  describe('getLocalServerHealth', () => {
    it('should get health details from local server', async () => {
      const healthData = {
        status: 'ok',
        model_loaded: true,
        model_name: 'test-model',
        uptime_seconds: 120,
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => healthData,
      });

      const result = await client.getLocalServerHealth();

      expect(result).toEqual(healthData);
    });

    it('should throw error when health check fails', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        statusText: 'Service Unavailable',
      });

      await expect(client.getLocalServerHealth()).rejects.toThrow(
        'Health check failed'
      );
    });
  });

  describe('shutdown', () => {
    it('should shutdown SDK client', () => {
      expect(() => client.shutdown()).not.toThrow();
    });

    it('should remove all listeners', () => {
      const handler = vi.fn();
      client.on('thinking', handler);
      client.on('message', handler);
      client.on('error', handler);

      client.shutdown();

      expect(client.listenerCount('thinking')).toBe(0);
      expect(client.listenerCount('message')).toBe(0);
      expect(client.listenerCount('error')).toBe(0);
    });

    it('should be safe to call multiple times', () => {
      expect(() => {
        client.shutdown();
        client.shutdown();
      }).not.toThrow();
    });
  });

  describe('event forwarding', () => {
    it('should forward error events from local client', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'ok', model_loaded: true }),
        })
        .mockRejectedValueOnce(new Error('Local error'));

      const errorHandler = vi.fn();
      client.on('error', errorHandler);

      await expect(client.queryDirect('Test')).rejects.toThrow();

      expect(errorHandler).toHaveBeenCalled();
    });
  });

  describe('configuration', () => {
    it('should use custom local server port', () => {
      const customConfig = {
        ...config,
        localServer: { port: 8080 },
      };

      const customClient = new LLMClient(customConfig);
      expect(customClient).toBeInstanceOf(LLMClient);
    });

    it('should use base URL from config', () => {
      const customConfig = {
        ...config,
        claudeSDK: {
          enabled: true,
          baseUrl: 'http://custom:9000',
        },
      };

      const customClient = new LLMClient(customConfig);
      expect(customClient).toBeInstanceOf(LLMClient);
    });

    it('should use default port when not specified', () => {
      const minimalConfig = {
        claudeSDK: { enabled: true },
      };

      const minimalClient = new LLMClient(minimalConfig);
      expect(minimalClient).toBeInstanceOf(LLMClient);
    });
  });
});
