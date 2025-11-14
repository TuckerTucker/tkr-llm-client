/**
 * Generic LLM Client Interfaces
 *
 * These interfaces are framework-agnostic and can be used in any TypeScript project
 */

import { EventEmitter } from 'events';
import { LLMMessage, LLMQueryOptions } from './types';

/**
 * Main LLM client interface
 *
 * Provides methods for querying LLMs (both Claude SDK and local server)
 */
export interface ILLMClient extends EventEmitter {
  /**
   * Query the LLM with streaming response
   *
   * @param prompt - The prompt to send
   * @param options - Query options (tools, temperature, etc.)
   * @returns Async iterable of messages from the LLM
   */
  query(prompt: string, options?: Partial<LLMQueryOptions>): AsyncIterable<LLMMessage>;

  /**
   * Query LLM directly without SDK intervention (bypass mode)
   * Use for simple text generation tasks that don't require tools
   *
   * @param prompt - The prompt to send
   * @param options - Query options
   * @returns Promise resolving to the LLM's text response
   */
  queryDirect(prompt: string, options?: Partial<LLMQueryOptions>): Promise<string>;

  /**
   * Set the current context for thinking attribution
   *
   * @param context - Optional context string (e.g., layer name, task ID, etc.)
   */
  setContext(context?: string): void;

  /**
   * Shutdown the client and clean up resources
   */
  shutdown(): void;
}

/**
 * Event emitter interface for thinking blocks and messages
 *
 * Events:
 * - 'thinking': Emitted when a thinking block is extracted from LLM response
 * - 'message': Emitted for each message received from LLM
 * - 'error': Emitted when an error occurs during query
 */
export interface ILLMEventEmitter extends EventEmitter {
  on(event: 'thinking', listener: (block: import('../utils/types').ThinkingBlock) => void): this;
  on(event: 'message', listener: (message: LLMMessage) => void): this;
  on(event: 'error', listener: (error: Error) => void): this;

  off(event: 'thinking', listener: (block: import('../utils/types').ThinkingBlock) => void): this;
  off(event: 'message', listener: (message: LLMMessage) => void): this;
  off(event: 'error', listener: (error: Error) => void): this;
}
