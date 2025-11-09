/**
 * Integration tests for LocalLLMClient
 *
 * Tests HTTP client integration with local LLM server
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LocalLLMClient } from '../../src/client/LocalLLMClient';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

describe('LocalLLMClient', () => {
  let client: LocalLLMClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new LocalLLMClient('http://localhost:42002');
  });

  describe('constructor', () => {
    it('should create client with default base URL', () => {
      const defaultClient = new LocalLLMClient();
      expect(defaultClient).toBeInstanceOf(LocalLLMClient);
    });

    it('should create client with custom base URL', () => {
      const customClient = new LocalLLMClient('http://custom:8080');
      expect(customClient).toBeInstanceOf(LocalLLMClient);
    });

    it('should extend EventEmitter', () => {
      expect(client.on).toBeDefined();
      expect(client.emit).toBeDefined();
      expect(client.off).toBeDefined();
    });
  });

  describe('query', () => {
    it('should send POST request to /v1/messages', async () => {
      const mockResponse = {
        content: [{ text: 'Response text' }]
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      await client.query('Test prompt');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:42002/v1/messages',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('should include prompt in request body', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ content: [{ text: 'Response' }] }),
      });

      await client.query('Test prompt');

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.messages).toEqual([
        { role: 'user', content: 'Test prompt' }
      ]);
    });

    it('should use default system prompt when not provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ content: [{ text: 'Response' }] }),
      });

      await client.query('Test prompt');

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.system).toBe('You are a helpful AI assistant.');
    });

    it('should use custom system prompt when provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ content: [{ text: 'Response' }] }),
      });

      await client.query('Test prompt', {
        systemPrompt: 'Custom system prompt'
      });

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.system).toBe('Custom system prompt');
    });

    it('should use default temperature when not provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ content: [{ text: 'Response' }] }),
      });

      await client.query('Test prompt');

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.temperature).toBe(0.7);
    });

    it('should use custom temperature when provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ content: [{ text: 'Response' }] }),
      });

      await client.query('Test prompt', { temperature: 0.5 });

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.temperature).toBe(0.5);
    });

    it('should return response text', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          content: [{ text: 'Response text from LLM' }]
        }),
      });

      const result = await client.query('Test prompt');

      expect(result).toBe('Response text from LLM');
    });

    it('should return empty string when no content', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ content: [] }),
      });

      const result = await client.query('Test prompt');

      expect(result).toBe('');
    });

    it('should throw error when response not ok', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        statusText: 'Internal Server Error',
      });

      await expect(client.query('Test prompt')).rejects.toThrow(
        'Local LLM server request failed: Internal Server Error'
      );
    });

    it('should emit error event on failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        statusText: 'Error',
      });

      const errorHandler = vi.fn();
      client.on('error', errorHandler);

      await expect(client.query('Test prompt')).rejects.toThrow();

      expect(errorHandler).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('ECONNREFUSED'));

      await expect(client.query('Test prompt')).rejects.toThrow('ECONNREFUSED');
    });

    it('should include model in request body', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ content: [{ text: 'Response' }] }),
      });

      await client.query('Test prompt');

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.model).toBe('claude-sonnet-3-5');
    });

    it('should include max_tokens in request body', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ content: [{ text: 'Response' }] }),
      });

      await client.query('Test prompt');

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.max_tokens).toBe(4000);
    });
  });

  describe('isHealthy', () => {
    it('should return true when server is healthy', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 'ok',
          model_loaded: true,
        }),
      });

      const result = await client.isHealthy();

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:42002/health');
    });

    it('should return false when server status is error', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 'error',
          model_loaded: false,
        }),
      });

      const result = await client.isHealthy();

      expect(result).toBe(false);
    });

    it('should return false when model not loaded', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 'ok',
          model_loaded: false,
        }),
      });

      const result = await client.isHealthy();

      expect(result).toBe(false);
    });

    it('should return false when HTTP response not ok', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 503,
      });

      const result = await client.isHealthy();

      expect(result).toBe(false);
    });

    it('should return false on network error', async () => {
      mockFetch.mockRejectedValue(new Error('ECONNREFUSED'));

      const result = await client.isHealthy();

      expect(result).toBe(false);
    });
  });

  describe('getHealth', () => {
    it('should return health details when successful', async () => {
      const healthData = {
        status: 'ok',
        model_loaded: true,
        model_name: 'gpt-oss-20b',
        uptime_seconds: 300,
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => healthData,
      });

      const result = await client.getHealth();

      expect(result).toEqual(healthData);
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:42002/health');
    });

    it('should throw error when response not ok', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        statusText: 'Service Unavailable',
      });

      await expect(client.getHealth()).rejects.toThrow(
        'Health check failed: Service Unavailable'
      );
    });

    it('should propagate network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(client.getHealth()).rejects.toThrow('Network error');
    });
  });

  describe('event handling', () => {
    it('should not emit error on successful query', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ content: [{ text: 'Response' }] }),
      });

      const errorHandler = vi.fn();
      client.on('error', errorHandler);

      await client.query('Test prompt');

      expect(errorHandler).not.toHaveBeenCalled();
    });

    it('should emit error event on query failure', async () => {
      mockFetch.mockRejectedValue(new Error('Query failed'));

      const errorHandler = vi.fn();
      client.on('error', errorHandler);

      await expect(client.query('Test prompt')).rejects.toThrow();

      expect(errorHandler).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Query failed' })
      );
    });
  });

  describe('custom base URL', () => {
    it('should use custom base URL for queries', async () => {
      const customClient = new LocalLLMClient('http://custom:8080');

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ content: [{ text: 'Response' }] }),
      });

      await customClient.query('Test');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://custom:8080/v1/messages',
        expect.any(Object)
      );
    });

    it('should use custom base URL for health checks', async () => {
      const customClient = new LocalLLMClient('http://custom:8080');

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'ok', model_loaded: true }),
      });

      await customClient.isHealthy();

      expect(mockFetch).toHaveBeenCalledWith('http://custom:8080/health');
    });
  });
});
