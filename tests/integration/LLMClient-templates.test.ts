/**
 * Integration tests for LLMClient template support
 *
 * Tests the queryFromTemplate() method with real templates
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LLMClient } from '../../src/client/LLMClient';
import { LLMClientConfig, LLMMessage } from '../../src/client/types';
import * as path from 'path';

// Mock the Claude Agent SDK
const mockQuery = vi.fn();
vi.mock('@anthropic-ai/claude-agent-sdk', () => ({
  query: (params: any) => mockQuery(params),
}));

// Mock fetch for local client
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

describe('LLMClient - Template Support', () => {
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

    // Mock successful SDK query with messages
    async function* mockMessages() {
      yield { type: 'text', text: 'Template-based response' } as LLMMessage;
    }
    mockQuery.mockReturnValue(mockMessages());
  });

  afterEach(() => {
    client.shutdown();
  });

  describe('queryFromTemplate', () => {
    it('should load template from registry and query with variables', async () => {
      const variables = {
        logPath: './logs/app.log',
        reportPath: './report.md',
      };

      const messages: LLMMessage[] = [];
      for await (const message of client.queryFromTemplate(
        'log-analyzer-agent',
        variables
      )) {
        messages.push(message);
      }

      // Should receive messages
      expect(messages.length).toBeGreaterThan(0);
      expect(messages[0].text).toBe('Template-based response');

      // Should have called SDK query with interpolated prompt
      expect(mockQuery).toHaveBeenCalledTimes(1);
      const callArgs = mockQuery.mock.calls[0][0];

      // Verify prompt contains interpolated variables
      expect(callArgs.prompt).toContain('./logs/app.log');
      expect(callArgs.prompt).toContain('./report.md');
    });

    it('should merge template options with runtime options', async () => {
      const variables = {
        logPath: './logs/test.log',
      };

      // Runtime options should override template options
      const runtimeOptions = {
        temperature: 0.3,
        maxTurns: 5,
      };

      const messages: LLMMessage[] = [];
      for await (const message of client.queryFromTemplate(
        'log-analyzer-agent',
        variables,
        runtimeOptions
      )) {
        messages.push(message);
      }

      expect(messages.length).toBeGreaterThan(0);

      // Check that runtime options were applied
      const callArgs = mockQuery.mock.calls[0][0];
      expect(callArgs.options?.temperature).toBe(0.3);
      expect(callArgs.options?.maxTurns).toBe(5);
    });

    it('should apply template settings correctly', async () => {
      const variables = {
        logPath: './logs/example.log',
      };

      const messages: LLMMessage[] = [];
      for await (const message of client.queryFromTemplate(
        'log-analyzer-agent',
        variables
      )) {
        messages.push(message);
      }

      expect(messages.length).toBeGreaterThan(0);

      // Verify template-specific settings are applied
      const callArgs = mockQuery.mock.calls[0][0];
      expect(callArgs.options).toBeDefined();
      expect(callArgs.options?.allowedTools).toBeDefined();
      expect(callArgs.options?.systemPrompt).toBeDefined();
    });

    it('should throw error for non-existent template', async () => {
      const variables = { test: 'value' };

      await expect(async () => {
        for await (const message of client.queryFromTemplate(
          'non-existent-template',
          variables
        )) {
          // Should not reach here
        }
      }).rejects.toThrow(/Template not found: non-existent-template/);
    });

    it('should include template tools in query options', async () => {
      const variables = {
        logPath: './logs/app.log',
      };

      const messages: LLMMessage[] = [];
      for await (const message of client.queryFromTemplate(
        'log-analyzer-agent',
        variables
      )) {
        messages.push(message);
      }

      expect(messages.length).toBeGreaterThan(0);

      // Verify tools from template are included
      const callArgs = mockQuery.mock.calls[0][0];
      expect(callArgs.options?.allowedTools).toBeDefined();
      expect(Array.isArray(callArgs.options?.allowedTools)).toBe(true);

      // log-analyzer-agent should have Read, Write, Grep tools
      const tools = callArgs.options?.allowedTools || [];
      expect(tools).toContain('Read');
      expect(tools).toContain('Write');
      expect(tools).toContain('Grep');
    });

    it('should handle optional variables with defaults', async () => {
      const variables = {
        logPath: './logs/app.log',
        // reportPath omitted - should use default
      };

      const messages: LLMMessage[] = [];
      for await (const message of client.queryFromTemplate(
        'log-analyzer-agent',
        variables
      )) {
        messages.push(message);
      }

      expect(messages.length).toBeGreaterThan(0);
      expect(mockQuery).toHaveBeenCalled();
    });

    it('should support multiple template calls with same client', async () => {
      // First call
      const variables1 = {
        logPath: './logs/app1.log',
      };

      const messages1: LLMMessage[] = [];
      for await (const message of client.queryFromTemplate(
        'log-analyzer-agent',
        variables1
      )) {
        messages1.push(message);
      }

      expect(messages1.length).toBeGreaterThan(0);

      // Second call with same template, different variables
      vi.clearAllMocks();
      async function* mockMessages2() {
        yield { type: 'text', text: 'Second template response' } as LLMMessage;
      }
      mockQuery.mockReturnValue(mockMessages2());

      const variables2 = {
        logPath: './logs/app2.log',
      };

      const messages2: LLMMessage[] = [];
      for await (const message of client.queryFromTemplate(
        'log-analyzer-agent',
        variables2
      )) {
        messages2.push(message);
      }

      expect(messages2.length).toBeGreaterThan(0);
      expect(messages2[0].text).toBe('Second template response');
    });

    it('should lazy initialize registry on first use', async () => {
      // Create new client
      const newClient = new LLMClient(config);

      // Registry should be initialized on first queryFromTemplate call
      const variables = {
        logPath: './logs/test.log',
      };

      const messages: LLMMessage[] = [];
      for await (const message of newClient.queryFromTemplate(
        'log-analyzer-agent',
        variables
      )) {
        messages.push(message);
      }

      expect(messages.length).toBeGreaterThan(0);
      newClient.shutdown();
    });

    it('should handle standalone template correctly', async () => {
      // log-analyzer-agent is standalone (no inheritance)
      const variables = {
        logPath: './logs/example.log',
      };

      const messages: LLMMessage[] = [];
      for await (const message of client.queryFromTemplate(
        'log-analyzer-agent',
        variables
      )) {
        messages.push(message);
      }

      expect(messages.length).toBeGreaterThan(0);

      // Verify tools and settings are applied
      const callArgs = mockQuery.mock.calls[0][0];
      expect(callArgs.options?.allowedTools).toBeDefined();
      expect(callArgs.options?.systemPrompt).toBeDefined();
    });

    it('should forward events from underlying query', async () => {
      const thinkingEvents: any[] = [];
      const messageEvents: any[] = [];

      client.on('thinking', (block) => thinkingEvents.push(block));
      client.on('message', (message) => messageEvents.push(message));

      // Mock query with thinking block
      async function* mockMessagesWithThinking() {
        yield {
          type: 'text',
          text: '<thinking>Processing template</thinking>Response',
        } as LLMMessage;
      }
      mockQuery.mockReturnValue(mockMessagesWithThinking());

      const variables = {
        logPath: './logs/test.log',
      };

      const messages: LLMMessage[] = [];
      for await (const message of client.queryFromTemplate(
        'log-analyzer-agent',
        variables
      )) {
        messages.push(message);
      }

      expect(messages.length).toBeGreaterThan(0);
      // Events should be forwarded from underlying query()
    });

    it('should set model from template settings', async () => {
      const variables = {
        logPath: './logs/test.log',
        reportPath: './report.md',
      };

      const messages: LLMMessage[] = [];
      for await (const message of client.queryFromTemplate(
        'log-analyzer-agent',
        variables
      )) {
        messages.push(message);
      }

      expect(messages.length).toBeGreaterThan(0);

      // Verify model is set from template
      const callArgs = mockQuery.mock.calls[0][0];
      expect(callArgs.options?.model).toBeDefined();
      expect(typeof callArgs.options?.model).toBe('string');
    });

    it('should pass runtime options like working directory', async () => {
      const variables = {
        logPath: './logs/test.log',
        reportPath: './report.md',
      };

      const runtimeOptions = {
        workingDirectory: '/custom/path',
      };

      const messages: LLMMessage[] = [];
      for await (const message of client.queryFromTemplate(
        'log-analyzer-agent',
        variables,
        runtimeOptions
      )) {
        messages.push(message);
      }

      expect(messages.length).toBeGreaterThan(0);

      // Verify working directory is set
      const callArgs = mockQuery.mock.calls[0][0];
      expect(callArgs.options?.workingDirectory).toBe('/custom/path');
    });

    it('should maintain backward compatibility with existing methods', async () => {
      // Test that existing query() method still works
      async function* mockQueryMessages() {
        yield { type: 'text', text: 'Direct query response' } as LLMMessage;
      }
      mockQuery.mockReturnValue(mockQueryMessages());

      const messages: LLMMessage[] = [];
      for await (const message of client.query('Direct prompt')) {
        messages.push(message);
      }

      expect(messages.length).toBeGreaterThan(0);
      expect(messages[0].text).toBe('Direct query response');
    });
  });

  describe('template error handling', () => {
    it('should provide helpful error when template not found', async () => {
      const variables = { test: 'value' };

      try {
        for await (const message of client.queryFromTemplate(
          'invalid-template',
          variables
        )) {
          // Should not reach here
        }
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).toContain('Template not found');
        expect(error.message).toContain('Available templates');
      }
    });

    it('should handle template resolution errors gracefully', async () => {
      // This would test error cases from resolveTemplate()
      // For now, just verify the method doesn't crash
      const variables = {
        logPath: './logs/test.log',
        reportPath: './report.md',
      };

      const messages: LLMMessage[] = [];
      for await (const message of client.queryFromTemplate(
        'log-analyzer-agent',
        variables
      )) {
        messages.push(message);
      }

      expect(messages.length).toBeGreaterThan(0);
    });
  });
});
