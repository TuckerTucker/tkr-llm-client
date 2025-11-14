/**
 * Debounced Validator Tests
 *
 * Unit tests for debounced validation functionality.
 *
 * @module tests/lib/validation/debounced
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { AgentTemplate } from '../../../src/templates/types';
import {
  DebouncedValidator,
  createDebouncedValidator,
} from '../../../src/lib/validation/debounced';

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
 * Helper to wait for specified time
 */
function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe('DebouncedValidator', () => {
  describe('Basic debouncing', () => {
    it('should debounce rapid validation calls', async () => {
      const validator = new DebouncedValidator({ delay: 100 });
      const template = createMockTemplate();

      // Make rapid calls
      const promise1 = validator.validate({ type: 'template', data: template }, { nodeId: 'test' });
      const promise2 = validator.validate({ type: 'template', data: template }, { nodeId: 'test' });
      const promise3 = validator.validate({ type: 'template', data: template }, { nodeId: 'test' });

      // Wait for debounce to complete
      await wait(150);

      const result = await promise3;

      expect(result.valid).toBe(true);
      expect(validator.pendingCount()).toBe(0);
    });

    it('should only execute last validation in rapid sequence', async () => {
      const validator = new DebouncedValidator({ delay: 50 });

      const template1 = createMockTemplate('template-1');
      const template2 = createMockTemplate('template-2');
      const template3 = createMockTemplate('template-3');

      // Rapid calls with same nodeId
      validator.validate({ type: 'template', data: template1 }, { nodeId: 'test' });
      validator.validate({ type: 'template', data: template2 }, { nodeId: 'test' });
      const promise3 = validator.validate({ type: 'template', data: template3 }, { nodeId: 'test' });

      await wait(100);
      const result = await promise3;

      expect(result.valid).toBe(true);
    });

    it('should handle different nodeIds independently', async () => {
      const validator = new DebouncedValidator({ delay: 50 });

      const template1 = createMockTemplate('template-1');
      const template2 = createMockTemplate('template-2');

      const promise1 = validator.validate({ type: 'template', data: template1 }, { nodeId: 'node-1' });
      const promise2 = validator.validate({ type: 'template', data: template2 }, { nodeId: 'node-2' });

      await wait(100);

      const [result1, result2] = await Promise.all([promise1, promise2]);

      expect(result1.valid).toBe(true);
      expect(result2.valid).toBe(true);
    });
  });

  describe('Configuration options', () => {
    it('should respect custom delay', async () => {
      const validator = new DebouncedValidator({ delay: 200 });
      const template = createMockTemplate();

      const startTime = Date.now();
      const promise = validator.validate({ type: 'template', data: template }, { nodeId: 'test' });

      await wait(250);
      await promise;
      const duration = Date.now() - startTime;

      expect(duration).toBeGreaterThanOrEqual(200);
    });

    it('should support leading edge validation', async () => {
      const validator = new DebouncedValidator({ delay: 100, leading: true, trailing: false });
      const template = createMockTemplate();

      const startTime = Date.now();
      const promise = validator.validate({ type: 'template', data: template }, { nodeId: 'test' });

      const result = await promise;
      const duration = Date.now() - startTime;

      expect(result.valid).toBe(true);
      expect(duration).toBeLessThan(50); // Should execute immediately
    });

    it('should enforce maxWait timeout', async () => {
      const validator = new DebouncedValidator({ delay: 100, maxWait: 150 });
      const template = createMockTemplate();

      // Make calls every 50ms to keep restarting the debounce timer
      const promise1 = validator.validate({ type: 'template', data: template }, { nodeId: 'test' });
      await wait(50);
      const promise2 = validator.validate({ type: 'template', data: template }, { nodeId: 'test' });
      await wait(50);
      const promise3 = validator.validate({ type: 'template', data: template }, { nodeId: 'test' });

      // maxWait should force execution within 150ms from first call
      await wait(100);
      const result = await promise3;

      expect(result.valid).toBe(true);
    });
  });

  describe('Cancel operations', () => {
    it('should cancel pending validation', async () => {
      const validator = new DebouncedValidator({ delay: 100 });
      const template = createMockTemplate();

      validator.validate({ type: 'template', data: template }, { nodeId: 'test' });
      expect(validator.isPending('test')).toBe(true);

      validator.cancel('test');
      expect(validator.isPending('test')).toBe(false);
    });

    it('should cancel all pending validations', async () => {
      const validator = new DebouncedValidator({ delay: 100 });

      validator.validate({ type: 'template', data: createMockTemplate() }, { nodeId: 'test-1' });
      validator.validate({ type: 'template', data: createMockTemplate() }, { nodeId: 'test-2' });
      validator.validate({ type: 'template', data: createMockTemplate() }, { nodeId: 'test-3' });

      expect(validator.pendingCount()).toBe(3);

      validator.cancelAll();
      expect(validator.pendingCount()).toBe(0);
    });
  });

  describe('Flush operations', () => {
    it('should immediately execute pending validation on flush', async () => {
      const validator = new DebouncedValidator({ delay: 1000 });
      const template = createMockTemplate();

      const promise = validator.validate({ type: 'template', data: template }, { nodeId: 'test' });

      // Flush immediately instead of waiting for debounce
      await validator.flush('test');

      const result = await promise;
      expect(result.valid).toBe(true);
      expect(validator.isPending('test')).toBe(false);
    });

    it('should flush all pending validations', async () => {
      const validator = new DebouncedValidator({ delay: 1000 });

      const promise1 = validator.validate({ type: 'template', data: createMockTemplate() }, { nodeId: 'test-1' });
      const promise2 = validator.validate({ type: 'template', data: createMockTemplate() }, { nodeId: 'test-2' });

      expect(validator.pendingCount()).toBe(2);

      await validator.flushAll();

      const [result1, result2] = await Promise.all([promise1, promise2]);

      expect(result1.valid).toBe(true);
      expect(result2.valid).toBe(true);
      expect(validator.pendingCount()).toBe(0);
    });
  });

  describe('Pending state tracking', () => {
    it('should track pending validations count', async () => {
      const validator = new DebouncedValidator({ delay: 100 });

      expect(validator.pendingCount()).toBe(0);

      validator.validate({ type: 'template', data: createMockTemplate() }, { nodeId: 'test-1' });
      expect(validator.pendingCount()).toBe(1);

      validator.validate({ type: 'template', data: createMockTemplate() }, { nodeId: 'test-2' });
      expect(validator.pendingCount()).toBe(2);

      await wait(150);
      expect(validator.pendingCount()).toBe(0);
    });

    it('should check if specific key is pending', async () => {
      const validator = new DebouncedValidator({ delay: 100 });

      validator.validate({ type: 'template', data: createMockTemplate() }, { nodeId: 'test' });
      expect(validator.isPending('test')).toBe(true);
      expect(validator.isPending('other')).toBe(false);

      await wait(150);
      expect(validator.isPending('test')).toBe(false);
    });
  });

  describe('Error handling', () => {
    it('should handle validation errors gracefully', async () => {
      const validator = new DebouncedValidator({ delay: 50 });

      // Invalid template (missing required fields)
      const invalidTemplate = {
        metadata: { name: '', version: '1.0.0', description: 'Test' },
        agent: { description: 'Test', prompt: 'Test', tools: [] },
      } as AgentTemplate;

      const result = await validator.validate(
        { type: 'template', data: invalidTemplate },
        { nodeId: 'test' }
      );

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});

describe('createDebouncedValidator', () => {
  it('should create a debounced validation function', async () => {
    const validate = createDebouncedValidator({ delay: 50 });

    const template = createMockTemplate();
    const result = await validate({ type: 'template', data: template }, { nodeId: 'test' });

    expect(result.valid).toBe(true);
  });

  it('should create validator with default config', async () => {
    const validate = createDebouncedValidator();

    const template = createMockTemplate();
    const result = await validate({ type: 'template', data: template });

    expect(result.valid).toBe(true);
  });
});

describe('Performance', () => {
  it('should reduce validation calls through debouncing', async () => {
    const validator = new DebouncedValidator({ delay: 50 });
    const template = createMockTemplate();

    // Make rapid calls and track the last one
    let lastPromise: Promise<any>;
    for (let i = 0; i < 10; i++) {
      lastPromise = validator.validate({ type: 'template', data: template }, { nodeId: 'test' });
      await wait(2); // Shorter delays
    }

    await wait(100); // Wait for debounce to complete

    // Only the last validation should have executed
    const result = await lastPromise!;
    expect(result.valid).toBe(true);
  });
});
