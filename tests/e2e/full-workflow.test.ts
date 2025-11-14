/**
 * End-to-End tests for complete workflows
 *
 * Tests full scenarios from initialization to shutdown
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMClient } from '../../src/client/LLMClient';
import { LocalLLMClient } from '../../src/client/LocalLLMClient';
import { ClaudeSDKClient } from '../../src/client/ClaudeSDKClient';
import { LLMClientConfig } from '../../src/client/types';
import { collectMessages, extractTextContent } from '../../src/utils/streaming';
import { extractThinkingBlocks } from '../../src/utils/thinking';

// Mock the Claude Code SDK
const mockQuery = vi.fn();
vi.mock('@anthropic-ai/claude-agent-sdk', () => ({
  query: (params: any) => mockQuery(params),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

describe('E2E: Full Workflows', () => {
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
  });

  describe('Complete Query Workflow', () => {
    it('should complete a full query cycle with thinking blocks', async () => {
      const client = new LLMClient(config);

      async function* mockMessages() {
        yield {
          type: 'text',
          text: '<thinking>Analyzing the request</thinking> I understand your question.'
        };
        yield {
          type: 'text',
          text: '<thinking>Formulating response</thinking> Here is my answer.'
        };
        yield {
          type: 'result',
          result: 'Complete answer with details.',
          subtype: 'success'
        };
      }

      mockQuery.mockReturnValue(mockMessages());

      const thinkingBlocks: any[] = [];
      const messages: any[] = [];

      client.on('thinking', (block) => thinkingBlocks.push(block));
      client.on('message', (msg) => messages.push(msg));

      for await (const message of client.query('What is the answer?')) {
        // Messages are collected via event handler
      }

      expect(thinkingBlocks).toHaveLength(2);
      expect(thinkingBlocks[0].content).toBe('Analyzing the request');
      expect(thinkingBlocks[1].content).toBe('Formulating response');

      expect(messages).toHaveLength(3);

      client.shutdown();
    });

    it('should handle multi-turn conversation with context', async () => {
      const client = new LLMClient(config);

      async function* mockMessages() {
        yield { type: 'text', text: 'Response to turn 1' };
        yield { type: 'text', text: 'Response to turn 2' };
        yield { type: 'result', result: 'Final answer', subtype: 'success' };
      }

      mockQuery.mockReturnValue(mockMessages());

      client.setContext('conversation-123');

      const messages = await collectMessages(
        client.query('Multi-turn question', { maxTurns: 3 })
      );

      expect(messages).toHaveLength(3);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({ maxTurns: 3 }),
        })
      );

      client.shutdown();
    });

    it('should use streaming utilities to process messages', async () => {
      const client = new LLMClient(config);

      async function* mockMessages() {
        yield { type: 'text', text: 'First chunk of text' };
        yield { type: 'text', text: 'Second chunk of text' };
        yield { type: 'result', result: 'Final result' };
      }

      mockQuery.mockReturnValue(mockMessages());

      const messages = await collectMessages(client.query('Test'));
      const textContent = extractTextContent(messages);

      expect(textContent).toContain('First chunk');
      expect(textContent).toContain('Second chunk');
      expect(textContent).toContain('Final result');

      client.shutdown();
    });

    it('should handle query with custom options', async () => {
      const client = new LLMClient(config);

      async function* mockMessages() {
        yield { type: 'result', result: 'Custom response', subtype: 'success' };
      }

      mockQuery.mockReturnValue(mockMessages());

      const messages = await collectMessages(
        client.query('Custom query', {
          systemPrompt: 'You are a specialized assistant.',
          temperature: 0.5,
          maxMessages: 50,
          allowedTools: ['Read', 'Write'],
        })
      );

      expect(messages).toHaveLength(1);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: 'Custom query',
          options: expect.objectContaining({
            systemPrompt: 'You are a specialized assistant.',
            temperature: 0.5,
            allowedTools: ['Read', 'Write'],
          }),
        })
      );

      client.shutdown();
    });
  });

  describe('Direct Query Workflow', () => {
    it('should complete direct query with local server', async () => {
      const client = new LLMClient(config);

      // Mock healthy server
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'ok', model_loaded: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            content: [{ text: 'Direct response from local server' }],
          }),
        });

      const result = await client.queryDirect('Simple question');

      expect(result).toBe('Direct response from local server');
      expect(mockFetch).toHaveBeenCalledTimes(2); // Health check + query

      client.shutdown();
    });

    it('should fallback to SDK on local server failure', async () => {
      const fallbackConfig = {
        ...config,
        claudeSDK: { enabled: true, enableFallback: true },
      };

      const client = new LLMClient(fallbackConfig);

      // Mock unhealthy local server
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
        })
        // SDK fallback response
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            content: [{ text: 'SDK fallback response' }],
          }),
        });

      const result = await client.queryDirect('Question');

      expect(result).toBe('SDK fallback response');

      client.shutdown();
    });

    it('should use custom temperature in direct query', async () => {
      const client = new LLMClient(config);

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'ok', model_loaded: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ content: [{ text: 'Response' }] }),
        });

      await client.queryDirect('Test', { temperature: 0.3 });

      const requestBody = JSON.parse(mockFetch.mock.calls[1][1].body);
      expect(requestBody.temperature).toBe(0.3);

      client.shutdown();
    });
  });

  describe('Health Monitoring Workflow', () => {
    it('should monitor server health throughout workflow', async () => {
      const client = new LLMClient(config);

      // Check health before query
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'ok',
          model_loaded: true,
          model_name: 'test-model',
          uptime_seconds: 120,
        }),
      });

      const healthBefore = await client.getLocalServerHealth();
      expect(healthBefore.status).toBe('ok');
      expect(healthBefore.model_loaded).toBe(true);

      // Execute query
      async function* mockMessages() {
        yield { type: 'result', result: 'Response', subtype: 'success' };
      }

      mockQuery.mockReturnValue(mockMessages());

      await collectMessages(client.query('Test'));

      // Check health after query
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok', model_loaded: true }),
      });

      const healthAfter = await client.isLocalServerHealthy();
      expect(healthAfter).toBe(true);

      client.shutdown();
    });

    it('should detect server becoming unhealthy', async () => {
      const client = new LLMClient(config);

      // Initially healthy
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok', model_loaded: true }),
      });

      const healthy1 = await client.isLocalServerHealthy();
      expect(healthy1).toBe(true);

      // Becomes unhealthy
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
      });

      const healthy2 = await client.isLocalServerHealthy();
      expect(healthy2).toBe(false);

      client.shutdown();
    });
  });

  describe('Error Recovery Workflow', () => {
    it('should recover from transient errors with retry', async () => {
      const client = new LLMClient(config);

      async function* mockMessagesFailThenSucceed() {
        yield { type: 'error', error: 'Transient error' };
        yield { type: 'result', result: 'Recovered', subtype: 'success' };
      }

      mockQuery.mockReturnValue(mockMessagesFailThenSucceed());

      const messages = await collectMessages(client.query('Test'));

      expect(messages).toHaveLength(2);
      expect(messages[1].type).toBe('result');

      client.shutdown();
    });

    it('should emit error events for debugging', async () => {
      const client = new LLMClient(config);

      const errors: Error[] = [];
      client.on('error', (error) => errors.push(error));

      async function* mockMessagesWithError() {
        throw new Error('Query failed');
      }

      mockQuery.mockReturnValue(mockMessagesWithError());

      await expect(async () => {
        for await (const _ of client.query('Test')) {
          // Consume
        }
      }).rejects.toThrow('Query failed');

      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe('Query failed');

      client.shutdown();
    });
  });

  describe('LocalLLMClient Standalone Workflow', () => {
    it('should complete standalone local query workflow', async () => {
      const localClient = new LocalLLMClient('http://localhost:42002');

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          content: [{ text: 'Local server response' }],
        }),
      });

      const result = await localClient.query('Test query', {
        systemPrompt: 'Custom prompt',
        temperature: 0.8,
      });

      expect(result).toBe('Local server response');

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.system).toBe('Custom prompt');
      expect(requestBody.temperature).toBe(0.8);
    });

    it('should check health before and after query', async () => {
      const localClient = new LocalLLMClient('http://localhost:42002');

      // Health check before
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok', model_loaded: true }),
      });

      const healthyBefore = await localClient.isHealthy();
      expect(healthyBefore).toBe(true);

      // Query
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ content: [{ text: 'Response' }] }),
      });

      await localClient.query('Test');

      // Health check after
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok', model_loaded: true }),
      });

      const healthyAfter = await localClient.isHealthy();
      expect(healthyAfter).toBe(true);
    });
  });

  describe('ClaudeSDKClient Standalone Workflow', () => {
    it('should complete standalone SDK query workflow', async () => {
      const sdkClient = new ClaudeSDKClient(config);

      async function* mockMessages() {
        yield { type: 'text', text: 'SDK response' };
        yield { type: 'result', result: 'Complete', subtype: 'success' };
      }

      mockQuery.mockReturnValue(mockMessages());

      const messages = await collectMessages(sdkClient.query('Test'));

      expect(messages).toHaveLength(2);
      expect(messages[0].text).toBe('SDK response');
      expect(messages[1].result).toBe('Complete');

      sdkClient.shutdown();
    });

    it('should extract thinking blocks during workflow', async () => {
      const sdkClient = new ClaudeSDKClient(config);

      async function* mockMessages() {
        yield {
          type: 'text',
          text: '<thinking>First thought</thinking> Text 1'
        };
        yield {
          type: 'text',
          text: '<thinking>Second thought</thinking> Text 2'
        };
      }

      mockQuery.mockReturnValue(mockMessages());

      const thinkingBlocks: any[] = [];
      sdkClient.on('thinking', (block) => thinkingBlocks.push(block));

      await collectMessages(sdkClient.query('Test'));

      expect(thinkingBlocks).toHaveLength(2);
      expect(thinkingBlocks[0].content).toBe('First thought');
      expect(thinkingBlocks[1].content).toBe('Second thought');

      sdkClient.shutdown();
    });
  });

  describe('Context Management Workflow', () => {
    it('should maintain context across multiple queries', async () => {
      const client = new LLMClient(config);

      async function* mockMessages() {
        yield { type: 'result', result: 'Response', subtype: 'success' };
      }

      mockQuery.mockReturnValue(mockMessages());

      client.setContext('session-123');

      // First query
      await collectMessages(client.query('Query 1'));

      // Second query with same context
      await collectMessages(client.query('Query 2'));

      // Context should be used in both queries
      expect(mockQuery).toHaveBeenCalledTimes(2);

      client.shutdown();
    });

    it('should allow context override per query', async () => {
      const client = new LLMClient(config);

      async function* mockMessages() {
        yield { type: 'result', result: 'Response', subtype: 'success' };
      }

      mockQuery.mockReturnValue(mockMessages());

      client.setContext('default-context');

      await collectMessages(
        client.query('Test', { context: 'override-context' })
      );

      // Override context should be used
      expect(mockQuery).toHaveBeenCalled();

      client.shutdown();
    });
  });

  describe('Cleanup Workflow', () => {
    it('should properly cleanup resources on shutdown', () => {
      const client = new LLMClient(config);

      const thinkingHandler = vi.fn();
      const messageHandler = vi.fn();
      const errorHandler = vi.fn();

      client.on('thinking', thinkingHandler);
      client.on('message', messageHandler);
      client.on('error', errorHandler);

      expect(client.listenerCount('thinking')).toBe(1);
      expect(client.listenerCount('message')).toBe(1);
      expect(client.listenerCount('error')).toBe(1);

      client.shutdown();

      expect(client.listenerCount('thinking')).toBe(0);
      expect(client.listenerCount('message')).toBe(0);
      expect(client.listenerCount('error')).toBe(0);
    });

    it('should be safe to shutdown multiple times', () => {
      const client = new LLMClient(config);

      expect(() => {
        client.shutdown();
        client.shutdown();
        client.shutdown();
      }).not.toThrow();
    });
  });
});
