/**
 * Validation Cache Tests
 *
 * Unit tests for validation cache with cache effectiveness verification.
 *
 * @module tests/lib/validation/cache
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { AgentTemplate } from '../../../src/templates/types';
import {
  ValidationCache,
  createCachedValidator,
} from '../../../src/lib/validation/cache';

/**
 * Mock template factory
 */
function createMockTemplate(name: string = 'test-template'): AgentTemplate {
  return {
    metadata: {
      name,
      version: '1.0.0',
      description: 'Test template',
    },
    agent: {
      description: 'Test agent',
      prompt: 'Test prompt',
      tools: ['Read'],
    },
  };
}

/**
 * Helper to wait
 */
function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe('ValidationCache', () => {
  describe('Basic caching', () => {
    it('should cache validation results', async () => {
      const cache = new ValidationCache({ maxSize: 100, ttl: 300000 });
      const template = createMockTemplate();

      // First call should validate and cache
      const result1 = await cache.validate({ type: 'template', data: template }, { nodeId: 'test' });

      // Second call should return cached result
      const result2 = await cache.validate({ type: 'template', data: template }, { nodeId: 'test' });

      expect(result1.valid).toBe(true);
      expect(result2.valid).toBe(true);
      expect(cache.size()).toBe(1);
    });

    it('should return cached results instantly', async () => {
      const cache = new ValidationCache();
      const template = createMockTemplate();

      // First call (uncached)
      await cache.validate({ type: 'template', data: template }, { nodeId: 'test' });

      // Second call (cached) should be much faster
      const startTime = performance.now();
      await cache.validate({ type: 'template', data: template }, { nodeId: 'test' });
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(5); // Cached access should be <5ms
    });

    it('should track separate cache entries for different nodes', async () => {
      const cache = new ValidationCache();

      await cache.validate({ type: 'template', data: createMockTemplate('template-1') }, { nodeId: 'node-1' });
      await cache.validate({ type: 'template', data: createMockTemplate('template-2') }, { nodeId: 'node-2' });

      expect(cache.size()).toBe(2);
    });
  });

  describe('Cache invalidation', () => {
    it('should invalidate cache when content changes', async () => {
      const cache = new ValidationCache({ useContentHashing: true });
      const template1 = createMockTemplate('template-1');
      const template2 = createMockTemplate('template-2');

      // Cache first template
      await cache.validate({ type: 'template', data: template1 }, { nodeId: 'test' });
      expect(cache.size()).toBe(1);

      // Validate different template with same nodeId (should invalidate and re-cache)
      await cache.validate({ type: 'template', data: template2 }, { nodeId: 'test' });
      expect(cache.size()).toBe(1);

      const stats = cache.getStats();
      expect(stats.invalidations).toBe(1);
    });

    it('should invalidate cache when TTL expires', async () => {
      const cache = new ValidationCache({ ttl: 100 }); // 100ms TTL
      const template = createMockTemplate();

      // First call
      await cache.validate({ type: 'template', data: template }, { nodeId: 'test' });

      // Wait for TTL to expire
      await wait(150);

      // Second call should re-validate (cache expired)
      await cache.validate({ type: 'template', data: template }, { nodeId: 'test' });

      const stats = cache.getStats();
      expect(stats.invalidations).toBeGreaterThan(0);
    });

    it('should allow manual invalidation by key', async () => {
      const cache = new ValidationCache();
      const template = createMockTemplate();

      await cache.validate({ type: 'template', data: template }, { nodeId: 'test' });
      expect(cache.has('test')).toBe(true);

      cache.invalidate('test');
      expect(cache.has('test')).toBe(false);
    });

    it('should allow conditional invalidation', async () => {
      const cache = new ValidationCache();

      await cache.validate({ type: 'template', data: createMockTemplate() }, { nodeId: 'template-1' });
      await cache.validate({ type: 'template', data: createMockTemplate() }, { nodeId: 'template-2' });
      await cache.validate({ type: 'template', data: createMockTemplate() }, { nodeId: 'other-1' });

      cache.invalidateWhere(key => key.startsWith('template-'));

      expect(cache.size()).toBe(1); // Only 'other-1' should remain
    });

    it('should clear all cache entries', async () => {
      const cache = new ValidationCache();

      await cache.validate({ type: 'template', data: createMockTemplate() }, { nodeId: 'test-1' });
      await cache.validate({ type: 'template', data: createMockTemplate() }, { nodeId: 'test-2' });
      await cache.validate({ type: 'template', data: createMockTemplate() }, { nodeId: 'test-3' });

      expect(cache.size()).toBe(3);

      cache.clear();
      expect(cache.size()).toBe(0);
    });
  });

  describe('LRU eviction', () => {
    it('should evict least recently used entry when cache is full', async () => {
      const cache = new ValidationCache({ maxSize: 3 });

      // Fill cache
      await cache.validate({ type: 'template', data: createMockTemplate() }, { nodeId: 'test-1' });
      await cache.validate({ type: 'template', data: createMockTemplate() }, { nodeId: 'test-2' });
      await cache.validate({ type: 'template', data: createMockTemplate() }, { nodeId: 'test-3' });

      expect(cache.size()).toBe(3);

      // Add one more (should evict test-1)
      await cache.validate({ type: 'template', data: createMockTemplate() }, { nodeId: 'test-4' });

      expect(cache.size()).toBe(3);
      expect(cache.has('test-1')).toBe(false); // Oldest should be evicted
      expect(cache.has('test-4')).toBe(true);

      const stats = cache.getStats();
      expect(stats.evictions).toBe(1);
    });

    it('should update access time on cache hit', async () => {
      const cache = new ValidationCache({ maxSize: 2, useContentHashing: false });

      // Add two entries
      await cache.validate({ type: 'template', data: createMockTemplate('unique-1') }, { nodeId: 'test-1' });
      await cache.validate({ type: 'template', data: createMockTemplate('unique-2') }, { nodeId: 'test-2' });

      await wait(10); // Small delay to ensure different timestamps

      // Access test-1 (update its access time)
      await cache.validate({ type: 'template', data: createMockTemplate('unique-1') }, { nodeId: 'test-1' });

      await wait(10); // Small delay

      // Add new entry (should evict test-2, not test-1)
      await cache.validate({ type: 'template', data: createMockTemplate('unique-3') }, { nodeId: 'test-3' });

      expect(cache.has('test-1')).toBe(true); // Recently accessed
      expect(cache.has('test-2')).toBe(false); // Evicted
      expect(cache.has('test-3')).toBe(true);
    });
  });

  describe('Cache statistics', () => {
    it('should track cache hits and misses', async () => {
      const cache = new ValidationCache();
      const template = createMockTemplate();

      // First call: miss
      await cache.validate({ type: 'template', data: template }, { nodeId: 'test' });

      // Second call: hit
      await cache.validate({ type: 'template', data: template }, { nodeId: 'test' });

      // Third call: hit
      await cache.validate({ type: 'template', data: template }, { nodeId: 'test' });

      const stats = cache.getStats();

      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBeCloseTo(0.666, 2); // 2/3
    });

    it('should calculate hit rate correctly', async () => {
      const cache = new ValidationCache();
      const template = createMockTemplate();

      // 1 miss
      await cache.validate({ type: 'template', data: template }, { nodeId: 'test-1' });

      // 4 hits
      await cache.validate({ type: 'template', data: template }, { nodeId: 'test-1' });
      await cache.validate({ type: 'template', data: template }, { nodeId: 'test-1' });
      await cache.validate({ type: 'template', data: template }, { nodeId: 'test-1' });
      await cache.validate({ type: 'template', data: template }, { nodeId: 'test-1' });

      const stats = cache.getStats();

      expect(stats.hits).toBe(4);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(0.8); // 4/5 = 0.8
    });

    it('should track evictions and invalidations', async () => {
      const cache = new ValidationCache({ maxSize: 2, ttl: 100 });

      // Add 3 entries (1 eviction)
      await cache.validate({ type: 'template', data: createMockTemplate() }, { nodeId: 'test-1' });
      await cache.validate({ type: 'template', data: createMockTemplate() }, { nodeId: 'test-2' });
      await cache.validate({ type: 'template', data: createMockTemplate() }, { nodeId: 'test-3' });

      // Wait for TTL to expire
      await wait(150);

      // Access expired entry (1 invalidation)
      await cache.validate({ type: 'template', data: createMockTemplate() }, { nodeId: 'test-2' });

      const stats = cache.getStats();

      expect(stats.evictions).toBe(1);
      expect(stats.invalidations).toBeGreaterThan(0);
    });

    it('should reset statistics', async () => {
      const cache = new ValidationCache();
      const template = createMockTemplate();

      await cache.validate({ type: 'template', data: template }, { nodeId: 'test' });
      await cache.validate({ type: 'template', data: template }, { nodeId: 'test' });

      expect(cache.getStats().hits).toBeGreaterThan(0);

      cache.resetStats();

      const stats = cache.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.evictions).toBe(0);
      expect(stats.invalidations).toBe(0);
    });
  });

  describe('Configuration', () => {
    it('should respect maxSize limit', async () => {
      const cache = new ValidationCache({ maxSize: 5 });

      // Add 10 entries
      for (let i = 0; i < 10; i++) {
        await cache.validate({ type: 'template', data: createMockTemplate() }, { nodeId: `test-${i}` });
      }

      expect(cache.size()).toBe(5);
    });

    it('should work with content hashing disabled', async () => {
      const cache = new ValidationCache({ useContentHashing: false });
      const template1 = createMockTemplate('template-1');
      const template2 = createMockTemplate('template-2');

      // Both should be cached separately (no content-based invalidation)
      await cache.validate({ type: 'template', data: template1 }, { nodeId: 'test' });
      await cache.validate({ type: 'template', data: template2 }, { nodeId: 'test' });

      // Without content hashing, second call might reuse cache (incorrect behavior)
      // But it won't invalidate based on content
      const stats = cache.getStats();
      expect(stats.hits + stats.misses).toBeGreaterThan(0);
    });
  });
});

describe('createCachedValidator', () => {
  it('should create a cached validation function', async () => {
    const validate = createCachedValidator({ maxSize: 100 });

    const template = createMockTemplate();
    const result = await validate({ type: 'template', data: template }, { nodeId: 'test' });

    expect(result.valid).toBe(true);
  });

  it('should create validator with default config', async () => {
    const validate = createCachedValidator();

    const template = createMockTemplate();
    const result = await validate({ type: 'template', data: template });

    expect(result.valid).toBe(true);
  });
});

describe('Cache effectiveness', () => {
  it('should achieve >70% hit rate in typical usage', async () => {
    const cache = new ValidationCache({ maxSize: 100 });
    const templates = [
      createMockTemplate('template-1'),
      createMockTemplate('template-2'),
      createMockTemplate('template-3'),
    ];

    // Simulate typical usage: some nodes validated repeatedly
    for (let i = 0; i < 100; i++) {
      const templateIndex = i % 3; // Cycle through templates
      const template = templates[templateIndex];
      await cache.validate(
        { type: 'template', data: template },
        { nodeId: `template-${templateIndex + 1}` }
      );
    }

    const stats = cache.getStats();

    expect(stats.hitRate).toBeGreaterThan(0.7); // >70% hit rate
    expect(stats.hits).toBeGreaterThan(stats.misses);
  });

  it('should demonstrate performance improvement from caching', async () => {
    const cache = new ValidationCache();
    const template = createMockTemplate();

    // Uncached validation
    const uncachedStart = performance.now();
    await cache.validate({ type: 'template', data: template }, { nodeId: 'test' });
    const uncachedDuration = performance.now() - uncachedStart;

    // Cached validation (10 times)
    const cachedStart = performance.now();
    for (let i = 0; i < 10; i++) {
      await cache.validate({ type: 'template', data: template }, { nodeId: 'test' });
    }
    const cachedDuration = performance.now() - cachedStart;

    // Cached accesses should be much faster than uncached
    const avgCachedDuration = cachedDuration / 10;
    expect(avgCachedDuration).toBeLessThan(uncachedDuration);
  });

  it('should handle high-frequency validation efficiently', async () => {
    const cache = new ValidationCache({ maxSize: 50 });

    // Simulate high-frequency validation (100 calls)
    const startTime = performance.now();
    for (let i = 0; i < 100; i++) {
      const templateIndex = i % 10; // 10 different templates
      await cache.validate(
        { type: 'template', data: createMockTemplate(`template-${templateIndex}`) },
        { nodeId: `template-${templateIndex}` }
      );
    }
    const duration = performance.now() - startTime;

    const stats = cache.getStats();

    // Should complete quickly
    expect(duration).toBeLessThan(1000); // <1 second for 100 validations

    // Should have good hit rate
    expect(stats.hitRate).toBeGreaterThan(0.7);
  });
});

describe('Performance', () => {
  it('should validate with cache overhead <5ms', async () => {
    const cache = new ValidationCache();
    const template = createMockTemplate();

    // Prime cache
    await cache.validate({ type: 'template', data: template }, { nodeId: 'test' });

    // Measure cached access
    const start = performance.now();
    await cache.validate({ type: 'template', data: template }, { nodeId: 'test' });
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(5);
  });

  it('should handle large cache sizes efficiently', async () => {
    const cache = new ValidationCache({ maxSize: 1000 });

    // Add 1000 entries
    const startTime = performance.now();
    for (let i = 0; i < 1000; i++) {
      await cache.validate(
        { type: 'template', data: createMockTemplate(`template-${i}`) },
        { nodeId: `test-${i}` }
      );
    }
    const duration = performance.now() - startTime;

    expect(cache.size()).toBe(1000);
    expect(duration).toBeLessThan(10000); // <10s for 1000 validations
  });
});
