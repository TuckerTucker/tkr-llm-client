/**
 * Streaming Utilities
 *
 * Helpers for working with async iterables and streams
 */

import { LLMMessage } from '../client/types';

/**
 * Collect all messages from async iterable into array
 *
 * @param iterable - Async iterable of messages
 * @returns Promise resolving to array of all messages
 */
export async function collectMessages(
  iterable: AsyncIterable<LLMMessage>
): Promise<LLMMessage[]> {
  const messages: LLMMessage[] = [];
  for await (const message of iterable) {
    messages.push(message);
  }
  return messages;
}

/**
 * Extract text content from messages
 *
 * @param messages - Array of LLM messages
 * @returns Concatenated text content
 */
export function extractTextContent(messages: LLMMessage[]): string {
  return messages
    .filter(msg => msg.type === 'result' || msg.type === 'text')
    .map(msg => msg.result || msg.content || msg.text || '')
    .join('\n')
    .trim();
}

/**
 * Filter messages by type
 *
 * @param iterable - Async iterable of messages
 * @param types - Message types to include
 * @returns Filtered async iterable
 */
export async function* filterMessages(
  iterable: AsyncIterable<LLMMessage>,
  types: LLMMessage['type'][]
): AsyncIterable<LLMMessage> {
  for await (const message of iterable) {
    if (types.includes(message.type)) {
      yield message;
    }
  }
}

/**
 * Take first N messages from iterable
 *
 * @param iterable - Async iterable
 * @param count - Number of messages to take
 * @returns Limited async iterable
 */
export async function* takeMessages(
  iterable: AsyncIterable<LLMMessage>,
  count: number
): AsyncIterable<LLMMessage> {
  let taken = 0;
  for await (const message of iterable) {
    if (taken >= count) {
      break;
    }
    yield message;
    taken++;
  }
}

/**
 * Map messages through a transform function
 *
 * @param iterable - Async iterable of messages
 * @param transform - Transform function
 * @returns Transformed async iterable
 */
export async function* mapMessages<T>(
  iterable: AsyncIterable<LLMMessage>,
  transform: (message: LLMMessage) => T
): AsyncIterable<T> {
  for await (const message of iterable) {
    yield transform(message);
  }
}
