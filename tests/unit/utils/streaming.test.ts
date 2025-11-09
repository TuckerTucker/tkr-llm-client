/**
 * Tests for streaming utilities
 *
 * Tests async iterable helpers for message streams
 */

import { describe, it, expect } from 'vitest';
import {
  collectMessages,
  extractTextContent,
  filterMessages,
  takeMessages,
  mapMessages,
} from '../../../src/utils/streaming';
import { LLMMessage } from '../../../src/client/types';

// Helper to create async iterable from array
async function* createAsyncIterable<T>(items: T[]): AsyncIterable<T> {
  for (const item of items) {
    yield item;
  }
}

describe('collectMessages', () => {
  it('should collect all messages into array', async () => {
    const messages: LLMMessage[] = [
      { type: 'text', text: 'Message 1' },
      { type: 'text', text: 'Message 2' },
      { type: 'result', result: 'Result' },
    ];

    const iterable = createAsyncIterable(messages);
    const collected = await collectMessages(iterable);

    expect(collected).toEqual(messages);
    expect(collected).toHaveLength(3);
  });

  it('should handle empty iterable', async () => {
    const iterable = createAsyncIterable<LLMMessage>([]);
    const collected = await collectMessages(iterable);

    expect(collected).toEqual([]);
  });

  it('should preserve message order', async () => {
    const messages: LLMMessage[] = [
      { type: 'text', text: 'First' },
      { type: 'text', text: 'Second' },
      { type: 'text', text: 'Third' },
    ];

    const iterable = createAsyncIterable(messages);
    const collected = await collectMessages(iterable);

    expect(collected[0].text).toBe('First');
    expect(collected[1].text).toBe('Second');
    expect(collected[2].text).toBe('Third');
  });

  it('should handle large number of messages', async () => {
    const messages: LLMMessage[] = Array.from({ length: 1000 }, (_, i) => ({
      type: 'text' as const,
      text: `Message ${i}`,
    }));

    const iterable = createAsyncIterable(messages);
    const collected = await collectMessages(iterable);

    expect(collected).toHaveLength(1000);
  });
});

describe('extractTextContent', () => {
  it('should extract text from text messages', () => {
    const messages: LLMMessage[] = [
      { type: 'text', text: 'Hello' },
      { type: 'text', text: 'World' },
    ];

    const content = extractTextContent(messages);

    expect(content).toBe('Hello\nWorld');
  });

  it('should extract result from result messages', () => {
    const messages: LLMMessage[] = [
      { type: 'result', result: 'Result 1' },
      { type: 'result', result: 'Result 2' },
    ];

    const content = extractTextContent(messages);

    expect(content).toBe('Result 1\nResult 2');
  });

  it('should extract content from content field', () => {
    const messages: LLMMessage[] = [
      { type: 'text', content: 'Content 1' },
      { type: 'text', content: 'Content 2' },
    ];

    const content = extractTextContent(messages);

    expect(content).toBe('Content 1\nContent 2');
  });

  it('should filter out non-text/result messages', () => {
    const messages: LLMMessage[] = [
      { type: 'text', text: 'Keep this' },
      { type: 'thinking', content: 'Skip this' },
      { type: 'result', result: 'Keep this too' },
      { type: 'error', error: 'Skip this too' },
    ];

    const content = extractTextContent(messages);

    expect(content).toBe('Keep this\nKeep this too');
    expect(content).not.toContain('Skip');
  });

  it('should handle empty messages array', () => {
    const content = extractTextContent([]);

    expect(content).toBe('');
  });

  it('should trim the final result', () => {
    const messages: LLMMessage[] = [
      { type: 'text', text: '  Text with spaces  ' },
    ];

    const content = extractTextContent(messages);

    expect(content).toBe('Text with spaces');
  });

  it('should handle messages with missing text fields', () => {
    const messages: LLMMessage[] = [
      { type: 'text', text: 'Valid' },
      { type: 'text' } as any, // Missing text field - will produce empty string
      { type: 'result', result: 'Also valid' },
    ];

    const content = extractTextContent(messages);

    // Empty strings from missing fields are included, then trimmed at the end
    expect(content).toBe('Valid\n\nAlso valid');
  });
});

describe('filterMessages', () => {
  it('should filter messages by single type', async () => {
    const messages: LLMMessage[] = [
      { type: 'text', text: 'Text 1' },
      { type: 'result', result: 'Result' },
      { type: 'text', text: 'Text 2' },
    ];

    const iterable = createAsyncIterable(messages);
    const filtered = filterMessages(iterable, ['text']);
    const collected = await collectMessages(filtered);

    expect(collected).toHaveLength(2);
    expect(collected[0].type).toBe('text');
    expect(collected[1].type).toBe('text');
  });

  it('should filter messages by multiple types', async () => {
    const messages: LLMMessage[] = [
      { type: 'text', text: 'Text' },
      { type: 'result', result: 'Result' },
      { type: 'thinking', content: 'Thinking' },
      { type: 'error', error: 'Error' },
    ];

    const iterable = createAsyncIterable(messages);
    const filtered = filterMessages(iterable, ['text', 'result']);
    const collected = await collectMessages(filtered);

    expect(collected).toHaveLength(2);
    expect(collected[0].type).toBe('text');
    expect(collected[1].type).toBe('result');
  });

  it('should return empty when no matches', async () => {
    const messages: LLMMessage[] = [
      { type: 'text', text: 'Text' },
      { type: 'result', result: 'Result' },
    ];

    const iterable = createAsyncIterable(messages);
    const filtered = filterMessages(iterable, ['error']);
    const collected = await collectMessages(filtered);

    expect(collected).toHaveLength(0);
  });

  it('should handle empty iterable', async () => {
    const iterable = createAsyncIterable<LLMMessage>([]);
    const filtered = filterMessages(iterable, ['text']);
    const collected = await collectMessages(filtered);

    expect(collected).toEqual([]);
  });
});

describe('takeMessages', () => {
  it('should take first N messages', async () => {
    const messages: LLMMessage[] = [
      { type: 'text', text: '1' },
      { type: 'text', text: '2' },
      { type: 'text', text: '3' },
      { type: 'text', text: '4' },
      { type: 'text', text: '5' },
    ];

    const iterable = createAsyncIterable(messages);
    const taken = takeMessages(iterable, 3);
    const collected = await collectMessages(taken);

    expect(collected).toHaveLength(3);
    expect(collected[0].text).toBe('1');
    expect(collected[1].text).toBe('2');
    expect(collected[2].text).toBe('3');
  });

  it('should take all when count exceeds length', async () => {
    const messages: LLMMessage[] = [
      { type: 'text', text: '1' },
      { type: 'text', text: '2' },
    ];

    const iterable = createAsyncIterable(messages);
    const taken = takeMessages(iterable, 10);
    const collected = await collectMessages(taken);

    expect(collected).toHaveLength(2);
  });

  it('should take zero messages when count is 0', async () => {
    const messages: LLMMessage[] = [
      { type: 'text', text: '1' },
      { type: 'text', text: '2' },
    ];

    const iterable = createAsyncIterable(messages);
    const taken = takeMessages(iterable, 0);
    const collected = await collectMessages(taken);

    expect(collected).toHaveLength(0);
  });

  it('should handle empty iterable', async () => {
    const iterable = createAsyncIterable<LLMMessage>([]);
    const taken = takeMessages(iterable, 5);
    const collected = await collectMessages(taken);

    expect(collected).toEqual([]);
  });
});

describe('mapMessages', () => {
  it('should transform messages', async () => {
    const messages: LLMMessage[] = [
      { type: 'text', text: 'Hello' },
      { type: 'text', text: 'World' },
    ];

    const iterable = createAsyncIterable(messages);
    const mapped = mapMessages(iterable, msg => msg.text?.toUpperCase() || '');
    const collected: string[] = [];

    for await (const item of mapped) {
      collected.push(item);
    }

    expect(collected).toEqual(['HELLO', 'WORLD']);
  });

  it('should extract specific fields', async () => {
    const messages: LLMMessage[] = [
      { type: 'text', text: 'Message 1' },
      { type: 'result', result: 'Result 1' },
    ];

    const iterable = createAsyncIterable(messages);
    const mapped = mapMessages(iterable, msg => msg.type);
    const collected: string[] = [];

    for await (const type of mapped) {
      collected.push(type);
    }

    expect(collected).toEqual(['text', 'result']);
  });

  it('should handle complex transformations', async () => {
    const messages: LLMMessage[] = [
      { type: 'text', text: 'A' },
      { type: 'text', text: 'B' },
    ];

    const iterable = createAsyncIterable(messages);
    const mapped = mapMessages(iterable, msg => ({
      original: msg.text,
      length: msg.text?.length || 0,
    }));

    const collected: Array<{ original?: string; length: number }> = [];

    for await (const item of mapped) {
      collected.push(item);
    }

    expect(collected[0].original).toBe('A');
    expect(collected[0].length).toBe(1);
    expect(collected[1].original).toBe('B');
    expect(collected[1].length).toBe(1);
  });

  it('should handle empty iterable', async () => {
    const iterable = createAsyncIterable<LLMMessage>([]);
    const mapped = mapMessages(iterable, msg => msg.type);
    const collected: string[] = [];

    for await (const item of mapped) {
      collected.push(item);
    }

    expect(collected).toEqual([]);
  });
});
