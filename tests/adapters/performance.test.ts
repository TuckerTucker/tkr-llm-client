/**
 * Performance Benchmarks
 *
 * Validates that adapters meet performance requirements:
 * - <10ms per template conversion
 * - 100 templates in <500ms
 *
 * @module tests/adapters/performance
 */

import { describe, it, expect } from 'vitest';
import type { AgentTemplate } from '../../src/templates/types';
import { templateToNode, templatesToNodes } from '../../src/lib/adapters/template-adapter';

/**
 * Creates a mock template for benchmarking
 */
function createBenchmarkTemplate(index: number): AgentTemplate {
  return {
    metadata: {
      name: `benchmark-template-${index}`,
      version: '1.0.0',
      description: `Benchmark template ${index}`,
      tags: ['benchmark', 'test'],
    },
    agent: {
      description: 'Benchmark agent',
      prompt: 'Test prompt with {{ variable }}',
      tools: ['Read', 'Write', 'Edit', 'Bash'],
    },
    validation: {
      required: ['variable'],
      optional: ['format'],
      types: {
        variable: { type: 'string' },
        format: { type: 'string', default: 'markdown' },
      },
    },
  };
}

describe('Performance Benchmarks', () => {
  it('should convert single template in <10ms', () => {
    const template = createBenchmarkTemplate(1);

    const start = performance.now();
    const node = templateToNode(template);
    const end = performance.now();

    const duration = end - start;

    expect(node.data.name).toBe('benchmark-template-1');
    expect(duration).toBeLessThan(10);
  });

  it('should convert 100 templates in <500ms', () => {
    const templates = Array.from({ length: 100 }, (_, i) =>
      createBenchmarkTemplate(i)
    );

    const start = performance.now();
    const nodes = templatesToNodes(templates, 'grid');
    const end = performance.now();

    const duration = end - start;

    expect(nodes).toHaveLength(100);
    expect(duration).toBeLessThan(500);

    console.log(`✓ Converted 100 templates in ${duration.toFixed(2)}ms`);
  });

  it('should maintain <10ms average per template in batch', () => {
    const templates = Array.from({ length: 100 }, (_, i) =>
      createBenchmarkTemplate(i)
    );

    const start = performance.now();
    const nodes = templatesToNodes(templates, 'grid');
    const end = performance.now();

    const duration = end - start;
    const averagePerTemplate = duration / templates.length;

    expect(nodes).toHaveLength(100);
    expect(averagePerTemplate).toBeLessThan(10);

    console.log(`✓ Average time per template: ${averagePerTemplate.toFixed(3)}ms`);
  });

  it('should convert 1000 templates efficiently', () => {
    const templates = Array.from({ length: 1000 }, (_, i) =>
      createBenchmarkTemplate(i)
    );

    const start = performance.now();
    const nodes = templatesToNodes(templates, 'grid');
    const end = performance.now();

    const duration = end - start;
    const averagePerTemplate = duration / templates.length;

    expect(nodes).toHaveLength(1000);

    console.log(`✓ Converted 1000 templates in ${duration.toFixed(2)}ms`);
    console.log(`✓ Average: ${averagePerTemplate.toFixed(3)}ms per template`);
  });
});
