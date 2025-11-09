/**
 * Claude SDK Client
 *
 * Generic wrapper around Claude Agent SDK
 * Refactored from ACE's ClaudeCodeAdapter to be framework-agnostic
 */

import { EventEmitter } from 'events';
import { query } from '@anthropic-ai/claude-agent-sdk';
import { ILLMClient } from './interfaces';
import { LLMMessage, LLMQueryOptions, SubagentResult, LLMClientConfig } from './types';
import { extractThinkingBlocks } from '../utils/thinking';

/**
 * Claude SDK Client
 *
 * Provides query, direct query, and subagent execution using Claude Agent SDK
 */
export class ClaudeSDKClient extends EventEmitter implements ILLMClient {
  private abortController: AbortController;
  private defaultConfig: LLMClientConfig['defaults'];
  private context?: string;

  constructor(config: LLMClientConfig) {
    super();
    this.abortController = new AbortController();
    this.defaultConfig = config.defaults || {
      maxMessages: 100,
      maxTurns: 1,
      queryTimeout: 30000,
    };
    this.context = undefined;
  }

  /**
   * Set the current context for thinking attribution
   */
  setContext(context?: string): void {
    this.context = context;
  }

  /**
   * Query Claude Agent SDK with streaming response
   */
  async *query(prompt: string, options: Partial<LLMQueryOptions> = {}): AsyncIterable<LLMMessage> {
    // Apply config defaults with option overrides
    const maxMessages = options.maxMessages ?? this.defaultConfig!.maxMessages;
    const maxTurns = options.maxTurns ?? this.defaultConfig!.maxTurns;
    const timeout = options.timeout ?? this.defaultConfig!.queryTimeout;
    const context = options.context ?? this.context;

    // Log outgoing query
    console.log('\n🚀 [ClaudeSDKClient] Sending query to Claude Agent SDK');
    console.log('📝 Prompt preview:', prompt.substring(0, 200) + (prompt.length > 200 ? '...' : ''));
    console.log('⚙️  Query options:', {
      maxMessages,
      maxTurns,
      timeout,
      context: context || 'none',
      systemPrompt: options.systemPrompt ? 'provided' : 'none',
      allowedTools: options.allowedTools || 'all',
      model: options.model || 'claude-sonnet-4-5'
    });

    let messageCount = 0;
    const startTime = Date.now();

    // Progress tracking for visibility
    const logProgress = () => {
      const elapsed = Date.now() - startTime;
      console.log(`⏳ [Query Progress] ${elapsed}ms elapsed, ${messageCount} messages received`);
    };

    // Log progress every 5 seconds
    const progressInterval = setInterval(logProgress, 5000);

    const timeoutId = timeout > 0 ? setTimeout(() => {
      const elapsed = Date.now() - startTime;
      console.warn(`⏱️  Query timeout after ${timeout}ms (${elapsed}ms elapsed), aborting...`);
      console.warn(`📊 Final stats: ${messageCount} messages received before timeout`);
      this.abortController.abort();
    }, timeout) : null;

    try {
      const queryOptions: any = {
        model: options.model || 'claude-sonnet-4-5',
        maxTurns,
        workingDirectory: options.workingDirectory || process.cwd()
      };

      if (options.systemPrompt) {
        queryOptions.systemPrompt = options.systemPrompt;
      }

      if (options.allowedTools) {
        queryOptions.allowedTools = options.allowedTools;
      }

      if (options.mcpConfig) {
        queryOptions.mcpServers = {
          [options.mcpConfig]: {
            command: options.mcpConfig,
            args: []
          }
        };
      }

      if (options.temperature !== undefined) {
        queryOptions.temperature = options.temperature;
      }

      if (options.permissionMode) {
        queryOptions.permissionMode = options.permissionMode;
      }

      if (options.maxBudgetUsd !== undefined) {
        queryOptions.maxBudgetUsd = options.maxBudgetUsd;
      }

      console.log('🔄 Calling Claude Agent SDK query()...');

      for await (const message of query({
        prompt,
        options: queryOptions
      })) {
        messageCount++;

        // Log message received
        console.log(`📨 [ClaudeSDKClient] Message ${messageCount}/${maxMessages}:`, {
          type: message.type,
          subtype: (message as any).subtype,
          role: (message as any).role
        });

        // Extract and emit thinking blocks
        const msgAny = message as any;
        if (msgAny.text || msgAny.content) {
          const textContent = msgAny.text || msgAny.content;
          if (typeof textContent === 'string') {
            console.log(`💭 [Model Output] ${textContent.substring(0, 500)}${textContent.length > 500 ? '...' : ''}`);

            // Extract and emit thinking blocks
            const thinkingBlocks = extractThinkingBlocks(textContent, context);
            thinkingBlocks.forEach(block => {
              console.log(`🧠 [Thinking Block] Context: ${block.context || 'none'}, Length: ${block.content.length} chars`);
              this.emit('thinking', block);
            });
          }
        }

        if (msgAny.name && msgAny.input) {
          console.log(`🔧 [Tool Use] ${msgAny.name}:`, JSON.stringify(msgAny.input, null, 2).substring(0, 300));
        }

        if (message.type === 'result' && msgAny.result) {
          if (typeof msgAny.result === 'string') {
            console.log(`✅ [Result] ${msgAny.result.substring(0, 500)}${msgAny.result.length > 500 ? '...' : ''}`);

            // Extract and emit thinking blocks from result
            const thinkingBlocks = extractThinkingBlocks(msgAny.result, context);
            thinkingBlocks.forEach(block => {
              console.log(`🧠 [Thinking Block] Context: ${block.context || 'none'}, Length: ${block.content.length} chars`);
              this.emit('thinking', block);
            });
          }
        }

        // Enforce message limit
        if (messageCount > maxMessages) {
          console.warn(`⚠️  Reached maxMessages limit (${maxMessages}), stopping query`);
          break;
        }

        // Convert SDK message to LLMMessage
        const llmMessage: LLMMessage = {
          type: message.type as any,
          subtype: msgAny.subtype,
          role: msgAny.role,
          content: msgAny.content,
          text: msgAny.text,
          result: msgAny.result,
          name: msgAny.name,
          input: msgAny.input,
          metadata: msgAny
        };

        // Emit message event
        this.emit('message', llmMessage);

        yield llmMessage;
      }

      const elapsed = Date.now() - startTime;
      console.log(`✅ [ClaudeSDKClient] Query completed in ${elapsed}ms (${messageCount} messages)`);
    } catch (error) {
      const elapsed = Date.now() - startTime;
      console.error(`❌ [ClaudeSDKClient] Query failed after ${elapsed}ms:`, error);
      this.emit('error', error as Error);
      throw error;
    } finally {
      clearInterval(progressInterval);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }

  /**
   * Query LLM directly without Claude Code SDK intervention
   * Use this for simple text generation tasks that don't require tools
   */
  async queryDirect(prompt: string, options: Partial<LLMQueryOptions> = {}): Promise<string> {
    const systemPrompt = options.systemPrompt || 'You are a helpful AI assistant.';
    const temperature = options.temperature ?? 0.7;
    const baseUrl = process.env['ANTHROPIC_BASE_URL'] || 'http://localhost:42002';

    console.log('🔄 [Direct Query] Bypassing Claude Code SDK, calling LLM server directly');
    console.log(`📝 Prompt length: ${prompt.length} chars`);
    console.log(`🌡️  Temperature: ${temperature}`);
    console.log(`🌐 Base URL: ${baseUrl}`);

    // Call LLM server directly via HTTP
    const response = await fetch(`${baseUrl}/v1/messages`, {
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
      const error = new Error(`LLM server request failed: ${response.statusText}`);
      this.emit('error', error);
      throw error;
    }

    const result: any = await response.json();
    const content = result.content?.[0]?.text || '';

    console.log(`✅ [Direct Query] Received ${content.length} chars`);

    return content;
  }

  /**
   * Execute a task using a subagent
   */
  async executeSubagent(name: string, task: string): Promise<SubagentResult> {
    const messages: LLMMessage[] = [];

    for await (const message of this.query(
      `Use the ${name} subagent to: ${task}`,
      { allowedTools: ['Task'] }
    )) {
      messages.push(message);
    }

    const lastMessage = messages[messages.length - 1];
    return {
      success: lastMessage?.type === 'result' && lastMessage.subtype === 'success',
      output: lastMessage?.type === 'result' && lastMessage.subtype === 'success' ? lastMessage.result || '' : '',
      metadata: messages
    };
  }

  /**
   * Shutdown the client and clean up resources
   */
  shutdown(): void {
    this.abortController.abort();
    this.removeAllListeners();
  }
}
