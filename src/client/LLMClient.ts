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
import { TemplateRegistry } from '../templates/registry';
import { resolveTemplate } from '../templates/resolver';
import type { ResolvedAgentConfig } from '../templates/types';

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
  private registry?: TemplateRegistry;

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
   * Query LLM using an agent template
   *
   * Loads template from registry, resolves it with variables,
   * converts to query options, and streams response using query()
   *
   * @param templateName - Name of the template to use
   * @param variables - Variables for template interpolation
   * @param options - Additional query options (merged with template config)
   * @returns Async iterable of LLM messages
   *
   * @example
   * ```typescript
   * const client = new LLMClient({ claudeSDK: {} });
   *
   * // Use template with variables
   * for await (const message of client.queryFromTemplate('code-reviewer-agent', {
   *   targetFile: './src/index.ts',
   *   outputPath: './review.md'
   * })) {
   *   console.log(message);
   * }
   * ```
   */
  async *queryFromTemplate(
    templateName: string,
    variables: Record<string, any>,
    options?: Partial<LLMQueryOptions>
  ): AsyncIterable<LLMMessage> {
    // Lazy initialize registry
    if (!this.registry) {
      this.registry = new TemplateRegistry('./agent-templates');
      await this.registry.scan();
    }

    // Get template from registry
    const template = this.registry.getTemplate(templateName);
    if (!template) {
      throw new Error(
        `Template not found: ${templateName}. Available templates: ${this.registry.listNames().join(', ')}`
      );
    }

    // Resolve template with variables
    const resolved: ResolvedAgentConfig = await resolveTemplate(template, variables);

    // Convert ResolvedAgentConfig to LLMQueryOptions
    const templateOptions: Partial<LLMQueryOptions> = {
      systemPrompt: resolved.prompt,
      allowedTools: resolved.tools,
      model: resolved.settings.model,
      temperature: resolved.settings.temperature,
      maxTurns: resolved.settings.maxTurns,
      permissionMode: resolved.settings.permissionMode as any,
      workingDirectory: resolved.runtime.workingDirectory,
      timeout: resolved.runtime.timeout,
    };

    // Merge template options with runtime options (runtime options take precedence)
    const mergedOptions: Partial<LLMQueryOptions> = {
      ...templateOptions,
      ...options,
    };

    // Use system prompt as the query prompt
    const prompt = resolved.prompt;

    // Call existing query() method with merged options
    for await (const message of this.query(prompt, mergedOptions)) {
      yield message;
    }
  }

  /**
   * Shutdown client and clean up resources
   */
  shutdown(): void {
    this.sdkClient.shutdown();
    this.removeAllListeners();
  }
}
