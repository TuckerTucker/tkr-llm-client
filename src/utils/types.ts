/**
 * Utility Types for LLM Client
 *
 * Generic types used across the library
 */

/**
 * LLM thinking block extracted from model response
 *
 * Generic version - context can be any string (layer name, task ID, etc.)
 */
export interface ThinkingBlock {
  /**
   * Optional context identifier (e.g., "aspirational", "task-123", etc.)
   */
  context?: string;

  /**
   * Raw thinking content
   */
  content: string;

  /**
   * Unix timestamp (milliseconds)
   */
  timestamp: number;

  /**
   * Unique identifier
   */
  id: string;
}
