/**
 * Local LLM Client
 *
 * Direct HTTP client for local LLM server (bypasses Claude SDK)
 * Useful for simple text generation tasks that don't require tools
 */

import { EventEmitter } from 'events';
import { LLMQueryOptions } from './types';

/**
 * Local LLM Client
 *
 * Provides direct HTTP access to local LLM server
 */
export class LocalLLMClient extends EventEmitter {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:42002') {
    super();
    this.baseUrl = baseUrl;
  }

  /**
   * Query local LLM server directly via HTTP
   */
  async query(prompt: string, options: Partial<LLMQueryOptions> = {}): Promise<string> {
    const systemPrompt = options.systemPrompt || 'You are a helpful AI assistant.';
    const temperature = options.temperature ?? 0.7;
    const context = options.context;

    console.log('🔄 [LocalLLMClient] Querying local LLM server');
    console.log(`📝 Prompt length: ${prompt.length} chars`);
    console.log(`🌡️  Temperature: ${temperature}`);
    console.log(`🌐 Base URL: ${this.baseUrl}`);
    if (context) {
      console.log(`📍 Context: ${context}`);
    }

    try {
      const response = await fetch(`${this.baseUrl}/v1/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-3-5',
          messages: [
            { role: 'user', content: prompt }
          ],
          max_tokens: 4000,
          temperature,
          system: systemPrompt
        })
      });

      if (!response.ok) {
        const error = new Error(`Local LLM server request failed: ${response.statusText}`);
        this.emit('error', error);
        throw error;
      }

      const result: any = await response.json();
      const content = result.content?.[0]?.text || '';

      console.log(`✅ [LocalLLMClient] Received ${content.length} chars`);

      return content;
    } catch (error) {
      console.error(`❌ [LocalLLMClient] Query failed:`, error);
      this.emit('error', error as Error);
      throw error;
    }
  }

  /**
   * Check if local LLM server is healthy
   */
  async isHealthy(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      if (!response.ok) {
        return false;
      }
      const data: any = await response.json();
      return data.status === 'ok' && data.model_loaded === true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get health status details
   */
  async getHealth(): Promise<{
    status: string;
    model_loaded: boolean;
    model_name?: string;
    uptime_seconds?: number;
  }> {
    const response = await fetch(`${this.baseUrl}/health`);
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`);
    }
    return response.json() as Promise<{
      status: string;
      model_loaded: boolean;
      model_name?: string;
      uptime_seconds?: number;
    }>;
  }
}
