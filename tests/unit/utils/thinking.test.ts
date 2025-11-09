/**
 * Tests for ThinkingExtractor utilities
 *
 * Tests extraction, detection, and manipulation of <thinking> blocks
 */

import { describe, it, expect } from 'vitest';
import {
  extractThinkingBlocks,
  hasThinkingBlocks,
  stripThinkingBlocks,
  getFirstThinkingBlock,
} from '../../../src/utils/thinking';

describe('extractThinkingBlocks', () => {
  it('should extract a single thinking block', () => {
    const text = 'Some text <thinking>This is my thought</thinking> more text';
    const blocks = extractThinkingBlocks(text);

    expect(blocks).toHaveLength(1);
    expect(blocks[0].content).toBe('This is my thought');
    expect(blocks[0].context).toBeUndefined();
    expect(blocks[0].id).toMatch(/^think-\d+-0-[a-z0-9]+$/);
  });

  it('should extract multiple thinking blocks', () => {
    const text = `
      <thinking>First thought</thinking>
      Some content
      <thinking>Second thought</thinking>
      More content
      <thinking>Third thought</thinking>
    `;
    const blocks = extractThinkingBlocks(text);

    expect(blocks).toHaveLength(3);
    expect(blocks[0].content).toBe('First thought');
    expect(blocks[1].content).toBe('Second thought');
    expect(blocks[2].content).toBe('Third thought');
  });

  it('should handle multiline thinking blocks', () => {
    const text = `
      <thinking>
        This is a multiline
        thinking block with
        several lines
      </thinking>
    `;
    const blocks = extractThinkingBlocks(text);

    expect(blocks).toHaveLength(1);
    expect(blocks[0].content).toContain('multiline');
    expect(blocks[0].content).toContain('several lines');
  });

  it('should trim whitespace from block content', () => {
    const text = '<thinking>   content with spaces   </thinking>';
    const blocks = extractThinkingBlocks(text);

    expect(blocks[0].content).toBe('content with spaces');
  });

  it('should set context when provided', () => {
    const text = '<thinking>thought</thinking>';
    const blocks = extractThinkingBlocks(text, 'test-context');

    expect(blocks[0].context).toBe('test-context');
  });

  it('should use provided base timestamp', () => {
    const baseTimestamp = 1000000;
    const text = '<thinking>first</thinking><thinking>second</thinking>';
    const blocks = extractThinkingBlocks(text, undefined, baseTimestamp);

    expect(blocks[0].timestamp).toBe(baseTimestamp);
    expect(blocks[1].timestamp).toBe(baseTimestamp + 1);
  });

  it('should generate unique IDs for each block', () => {
    const text = '<thinking>A</thinking><thinking>B</thinking><thinking>C</thinking>';
    const blocks = extractThinkingBlocks(text);

    const ids = blocks.map(b => b.id);
    const uniqueIds = new Set(ids);

    expect(uniqueIds.size).toBe(3);
  });

  it('should return empty array when no thinking blocks found', () => {
    const text = 'This text has no thinking blocks at all';
    const blocks = extractThinkingBlocks(text);

    expect(blocks).toEqual([]);
  });

  it('should handle empty thinking blocks', () => {
    const text = '<thinking></thinking>';
    const blocks = extractThinkingBlocks(text);

    expect(blocks).toHaveLength(0);
  });

  it('should handle malformed tags gracefully', () => {
    const text = '<thinking>valid</thinking> <thinking incomplete';
    const blocks = extractThinkingBlocks(text);

    expect(blocks).toHaveLength(1);
    expect(blocks[0].content).toBe('valid');
  });

  it('should handle nested angle brackets', () => {
    const text = '<thinking>Use <example> tags here</thinking>';
    const blocks = extractThinkingBlocks(text);

    expect(blocks).toHaveLength(1);
    expect(blocks[0].content).toBe('Use <example> tags here');
  });
});

describe('hasThinkingBlocks', () => {
  it('should return true when thinking blocks present', () => {
    const text = 'Text with <thinking>thoughts</thinking> here';
    expect(hasThinkingBlocks(text)).toBe(true);
  });

  it('should return false when no thinking blocks', () => {
    const text = 'Plain text without any special tags';
    expect(hasThinkingBlocks(text)).toBe(false);
  });

  it('should handle empty string', () => {
    expect(hasThinkingBlocks('')).toBe(false);
  });

  it('should detect thinking blocks with newlines', () => {
    const text = '<thinking>\nmultiline\n</thinking>';
    expect(hasThinkingBlocks(text)).toBe(true);
  });
});

describe('stripThinkingBlocks', () => {
  it('should remove thinking blocks from text', () => {
    const text = 'Before <thinking>remove this</thinking> After';
    const stripped = stripThinkingBlocks(text);

    expect(stripped).toBe('Before  After');
  });

  it('should remove all thinking blocks', () => {
    const text = '<thinking>A</thinking> middle <thinking>B</thinking>';
    const stripped = stripThinkingBlocks(text);

    expect(stripped).toBe('middle');
  });

  it('should trim result', () => {
    const text = '   <thinking>remove</thinking>   ';
    const stripped = stripThinkingBlocks(text);

    expect(stripped).toBe('');
  });

  it('should handle text with no thinking blocks', () => {
    const text = 'Plain text content';
    const stripped = stripThinkingBlocks(text);

    expect(stripped).toBe('Plain text content');
  });

  it('should handle multiline thinking blocks', () => {
    const text = `
      Keep this
      <thinking>
        Remove
        This
      </thinking>
      And keep this
    `;
    const stripped = stripThinkingBlocks(text);

    expect(stripped).toContain('Keep this');
    expect(stripped).toContain('And keep this');
    expect(stripped).not.toContain('Remove');
  });
});

describe('getFirstThinkingBlock', () => {
  it('should return first thinking block content', () => {
    const text = '<thinking>First</thinking> <thinking>Second</thinking>';
    const first = getFirstThinkingBlock(text);

    expect(first).toBe('First');
  });

  it('should return null when no thinking blocks', () => {
    const text = 'No thinking here';
    const first = getFirstThinkingBlock(text);

    expect(first).toBeNull();
  });

  it('should trim the content', () => {
    const text = '<thinking>  content with spaces  </thinking>';
    const first = getFirstThinkingBlock(text);

    expect(first).toBe('content with spaces');
  });

  it('should handle multiline content', () => {
    const text = '<thinking>\nLine 1\nLine 2\n</thinking>';
    const first = getFirstThinkingBlock(text);

    expect(first).toContain('Line 1');
    expect(first).toContain('Line 2');
  });

  it('should return null for empty thinking block', () => {
    const text = '<thinking></thinking>';
    const first = getFirstThinkingBlock(text);

    // Empty thinking block (after trim) is falsy, so returns null
    expect(first).toBeNull();
  });
});
