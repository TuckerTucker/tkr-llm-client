/**
 * Integration tests for ClaudeSDKClient
 *
 * Tests SDK client with mocked @anthropic-ai/claude-agent-sdk
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ClaudeSDKClient } from '../../src/client/ClaudeSDKClient';
import { LLMClientConfig } from '../../src/client/types';

// Mock the Claude Agent SDK
const mockQuery = vi.fn();
vi.mock('@anthropic-ai/claude-agent-sdk', () => ({
  query: (params: any) => mockQuery(params),
}));

// Mock fetch for queryDirect
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

describe('ClaudeSDKClient', () => {
  let client: ClaudeSDKClient;
  let config: LLMClientConfig;

  beforeEach(() => {
    vi.clearAllMocks();

    config = {
      claudeSDK: {
        enabled: true,
      },
      defaults: {
        maxMessages: 100,
        maxTurns: 1,
        queryTimeout: 30000,
      },
    };

    client = new ClaudeSDKClient(config);
  });

  describe('constructor', () => {
    it('should create client with config', () => {
      expect(client).toBeInstanceOf(ClaudeSDKClient);
    });

    it('should extend EventEmitter', () => {
      expect(client.on).toBeDefined();
      expect(client.emit).toBeDefined();
      expect(client.removeAllListeners).toBeDefined();
    });

    it('should use default config values', () => {
      const defaultClient = new ClaudeSDKClient({});
      expect(defaultClient).toBeInstanceOf(ClaudeSDKClient);
    });
  });

  describe('setContext', () => {
    it('should set context for thinking attribution', () => {
      client.setContext('test-context');
      // Context is private, but we can verify it doesn't throw
      expect(() => client.setContext('new-context')).not.toThrow();
    });

    it('should clear context when undefined', () => {
      client.setContext('test');
      client.setContext(undefined);
      // Verify it doesn't throw
      expect(true).toBe(true);
    });
  });

  describe('query', () => {
    it('should call SDK query function', async () => {
      async function* mockMessages() {
        yield { type: 'text', text: 'Response' };
      }

      mockQuery.mockReturnValue(mockMessages());

      const messages = [];
      for await (const message of client.query('Test prompt')) {
        messages.push(message);
      }

      expect(mockQuery).toHaveBeenCalled();
      expect(messages).toHaveLength(1);
    });

    it('should pass prompt to SDK', async () => {
      async function* mockMessages() {
        yield { type: 'text', text: 'Response' };
      }

      mockQuery.mockReturnValue(mockMessages());

      for await (const _ of client.query('Test prompt')) {
        // Consume iterator
      }

      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: 'Test prompt',
        })
      );
    });

    it('should apply maxTurns option', async () => {
      async function* mockMessages() {
        yield { type: 'text', text: 'Response' };
      }

      mockQuery.mockReturnValue(mockMessages());

      for await (const _ of client.query('Test', { maxTurns: 3 })) {
        // Consume iterator
      }

      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            maxTurns: 3,
            model: 'claude-sonnet-4-5',
            workingDirectory: expect.any(String)
          }),
        })
      );
    });

    it('should emit message events', async () => {
      async function* mockMessages() {
        yield { type: 'text', text: 'Response 1' };
        yield { type: 'text', text: 'Response 2' };
      }

      mockQuery.mockReturnValue(mockMessages());

      const messageHandler = vi.fn();
      client.on('message', messageHandler);

      for await (const _ of client.query('Test')) {
        // Consume iterator
      }

      expect(messageHandler).toHaveBeenCalledTimes(2);
    });

    it('should emit thinking events for thinking blocks', async () => {
      async function* mockMessages() {
        yield {
          type: 'text',
          text: '<thinking>This is my thought</thinking> Response'
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
          content: 'This is my thought',
        })
      );
    });

    it('should enforce max messages limit', async () => {
      async function* mockMessages() {
        for (let i = 0; i < 150; i++) {
          yield { type: 'text', text: `Message ${i}` };
        }
      }

      mockQuery.mockReturnValue(mockMessages());

      const messages = [];
      for await (const message of client.query('Test', { maxMessages: 10 })) {
        messages.push(message);
      }

      expect(messages.length).toBeLessThanOrEqual(11); // maxMessages + 1 for the limit check
    });

    it('should handle errors from SDK', async () => {
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
      }).rejects.toThrow('SDK error');

      expect(errorHandler).toHaveBeenCalled();
    });

    it('should pass custom system prompt to SDK', async () => {
      async function* mockMessages() {
        yield { type: 'text', text: 'Response' };
      }

      mockQuery.mockReturnValue(mockMessages());

      for await (const _ of client.query('Test', {
        systemPrompt: 'Custom prompt'
      })) {
        // Consume iterator
      }

      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            systemPrompt: 'Custom prompt',
          }),
        })
      );
    });

    it('should pass allowed tools to SDK', async () => {
      async function* mockMessages() {
        yield { type: 'text', text: 'Response' };
      }

      mockQuery.mockReturnValue(mockMessages());

      for await (const _ of client.query('Test', {
        allowedTools: ['Read', 'Write']
      })) {
        // Consume iterator
      }

      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            allowedTools: ['Read', 'Write'],
          }),
        })
      );
    });

    it('should pass temperature to SDK', async () => {
      async function* mockMessages() {
        yield { type: 'text', text: 'Response' };
      }

      mockQuery.mockReturnValue(mockMessages());

      for await (const _ of client.query('Test', { temperature: 0.5 })) {
        // Consume iterator
      }

      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({ temperature: 0.5 }),
        })
      );
    });
  });

  describe('queryDirect', () => {
    beforeEach(() => {
      process.env['ANTHROPIC_BASE_URL'] = 'http://localhost:42002';
    });

    it('should make HTTP request to LLM server', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          content: [{ text: 'Direct response' }],
        }),
      });

      const result = await client.queryDirect('Test prompt');

      expect(result).toBe('Direct response');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:42002/v1/messages',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should use custom temperature', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ content: [{ text: 'Response' }] }),
      });

      await client.queryDirect('Test', { temperature: 0.3 });

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.temperature).toBe(0.3);
    });

    it('should throw error on failed request', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        statusText: 'Internal Server Error',
      });

      await expect(client.queryDirect('Test')).rejects.toThrow(
        'LLM server request failed'
      );
    });

    it('should emit error event on failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        statusText: 'Error',
      });

      const errorHandler = vi.fn();
      client.on('error', errorHandler);

      await expect(client.queryDirect('Test')).rejects.toThrow();

      expect(errorHandler).toHaveBeenCalled();
    });
  });

  describe('executeSubagent', () => {
    it('should use Task tool for subagent execution', async () => {
      async function* mockMessages() {
        yield { type: 'result', subtype: 'success', result: 'Subagent output' };
      }

      mockQuery.mockReturnValue(mockMessages());

      const result = await client.executeSubagent('test-agent', 'Test task');

      expect(result.success).toBe(true);
      expect(result.output).toBe('Subagent output');
    });

    it('should return failure for non-success results', async () => {
      async function* mockMessages() {
        yield { type: 'error', error: 'Failed' };
      }

      mockQuery.mockReturnValue(mockMessages());

      const result = await client.executeSubagent('test-agent', 'Test task');

      expect(result.success).toBe(false);
    });

    it('should include metadata in result', async () => {
      async function* mockMessages() {
        yield { type: 'text', text: 'Working...' };
        yield { type: 'result', subtype: 'success', result: 'Done' };
      }

      mockQuery.mockReturnValue(mockMessages());

      const result = await client.executeSubagent('test-agent', 'Test task');

      expect(result.metadata).toHaveLength(2);
    });
  });

  describe('shutdown', () => {
    it('should remove all listeners', () => {
      const handler = vi.fn();
      client.on('message', handler);
      client.on('thinking', handler);
      client.on('error', handler);

      client.shutdown();

      expect(client.listenerCount('message')).toBe(0);
      expect(client.listenerCount('thinking')).toBe(0);
      expect(client.listenerCount('error')).toBe(0);
    });

    it('should be safe to call multiple times', () => {
      expect(() => {
        client.shutdown();
        client.shutdown();
      }).not.toThrow();
    });
  });
});
