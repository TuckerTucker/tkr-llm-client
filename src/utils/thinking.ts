/**
 * ThinkingExtractor
 *
 * Utilities for extracting <thinking> blocks from LLM responses
 * Generic version - works with any context, not just ACE layers
 */

import { ThinkingBlock } from './types';

/**
 * Extract all <thinking> blocks from text content
 *
 * @param text - The text to extract thinking blocks from
 * @param context - Optional context string (e.g., layer name, task ID, etc.)
 * @param baseTimestamp - Base timestamp for block ordering
 * @returns Array of extracted thinking blocks
 */
export function extractThinkingBlocks(
  text: string,
  context?: string,
  baseTimestamp: number = Date.now()
): ThinkingBlock[] {
  const blocks: ThinkingBlock[] = [];

  // Match <thinking>...</thinking> blocks (non-greedy)
  const regex = /<thinking>([\s\S]*?)<\/thinking>/g;
  let match;
  let index = 0;

  while ((match = regex.exec(text)) !== null) {
    if (!match[1]) continue;
    const content = match[1].trim();

    blocks.push({
      context,
      content,
      timestamp: baseTimestamp + index, // Slight offset for ordering
      id: `think-${baseTimestamp}-${index}-${Math.random().toString(36).substr(2, 9)}`
    });

    index++;
  }

  return blocks;
}

/**
 * Check if text contains thinking blocks
 */
export function hasThinkingBlocks(text: string): boolean {
  return /<thinking>[\s\S]*?<\/thinking>/.test(text);
}

/**
 * Remove thinking blocks from text (for clean display)
 */
export function stripThinkingBlocks(text: string): string {
  return text.replace(/<thinking>[\s\S]*?<\/thinking>/g, '').trim();
}

/**
 * Get first thinking block (most common case)
 */
export function getFirstThinkingBlock(text: string): string | null {
  const match = /<thinking>([\s\S]*?)<\/thinking>/.exec(text);
  return (match && match[1]) ? match[1].trim() : null;
}
