/**
 * Unified LLM Client
 *
 * Combines Claude SDK and local LLM clients with intelligent fallback
 */

import { EventEmitter } from 'events';
import { ILLMClient } from './interfaces';
import { LLMMessage, LLMQueryOptions, SubagentResult, LLMClientConfig } from './types';
import { ClaudeSDKClient } from './ClaudeSDKClient';
import { LocalLLMClient } from './LocalLLMClient';

/**
 * Unified LLM Client
 *
 * Provides a single interface for both Claude SDK and local LLM server
 * with automatic fallback and intelligent routing
 */
export class LLMClient extends EventEmitter implements ILLMClient {
  private sdkClient: ClaudeSDKClient;
  private localClient: LocalLLMClient;
  private config: LLMClientConfig;
  private context?: string;

  constructor(config: LLMClientConfig) {
    super();
    this.config = config;

    // Initialize SDK client
    this.sdkClient = new ClaudeSDKClient(config);

    // Initialize local client
    const localPort = config.localServer?.port || 42002;
    const baseUrl = config.claudeSDK?.baseUrl || `http://localhost:${localPort}`;
    this.localClient = new LocalLLMClient(baseUrl);

    // Forward events from SDK client
    this.sdkClient.on('thinking', (block) => this.emit('thinking', block));
    this.sdkClient.on('message', (message) => this.emit('message', message));
    this.sdkClient.on('error', (error) => this.emit('error', error));

    // Forward events from local client
    this.localClient.on('error', (error) => this.emit('error', error));
  }

  /**
   * Set current context for thinking attribution
   */
  setContext(context?: string): void {
    this.context = context;
    this.sdkClient.setContext(context);
  }

  /**
   * Query LLM with streaming response
   *
   * Uses Claude SDK by default (provides tool access)
   * Falls back to cloud API if local server unavailable and fallback enabled
   */
  async *query(prompt: string, options: Partial<LLMQueryOptions> = {}): AsyncIterable<LLMMessage> {
    // Merge context
    const queryOptions = {
      ...options,
      context: options.context ?? this.context
    };

    try {
      // Use SDK client (connects to local server or cloud)
      for await (const message of this.sdkClient.query(prompt, queryOptions)) {
        yield message;
      }
    } catch (error) {
      console.error('❌ [LLMClient] SDK query failed:', error);

      // Check if fallback is enabled
      if (this.config.claudeSDK?.enableFallback) {
        console.log('🔄 [LLMClient] Attempting fallback to cloud API...');
        // SDK will handle fallback internally via ANTHROPIC_API_KEY
        throw error; // Re-throw for now, SDK handles fallback
      } else {
        throw error;
      }
    }
  }

  /**
   * Query LLM directly without SDK (bypass mode)
   *
   * Faster for simple text generation, no tool access
   * Uses local LLM server directly via HTTP
   */
  async queryDirect(prompt: string, options: Partial<LLMQueryOptions> = {}): Promise<string> {
    // Merge context
    const queryOptions = {
      ...options,
      context: options.context ?? this.context
    };

    try {
      // Check if local server is healthy
      const isHealthy = await this.localClient.isHealthy();

      if (!isHealthy) {
        console.warn('⚠️  [LLMClient] Local server unhealthy, falling back to SDK direct query');
        return await this.sdkClient.queryDirect(prompt, queryOptions);
      }

      // Use local client for direct HTTP query
      return await this.localClient.query(prompt, queryOptions);
    } catch (error) {
      console.error('❌ [LLMClient] Direct query failed:', error);

      // Fallback to SDK direct query
      if (this.config.claudeSDK?.enableFallback) {
        console.log('🔄 [LLMClient] Falling back to SDK direct query...');
        return await this.sdkClient.queryDirect(prompt, queryOptions);
      } else {
        throw error;
      }
    }
  }

  /**
   * Execute a task using a subagent
   */
  async executeSubagent(name: string, task: string): Promise<SubagentResult> {
    return await this.sdkClient.executeSubagent(name, task);
  }

  /**
   * Check if local LLM server is healthy
   */
  async isLocalServerHealthy(): Promise<boolean> {
    return await this.localClient.isHealthy();
  }

  /**
   * Get local server health details
   */
  async getLocalServerHealth(): Promise<{
    status: string;
    model_loaded: boolean;
    model_name?: string;
    uptime_seconds?: number;
  }> {
    return await this.localClient.getHealth();
  }

  /**
   * Shutdown client and clean up resources
   */
  shutdown(): void {
    this.sdkClient.shutdown();
    this.removeAllListeners();
  }
}
