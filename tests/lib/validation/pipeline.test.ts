/**
 * Validation Pipeline Tests
 *
 * Unit tests for validation pipeline functions.
 *
 * @module tests/lib/validation/pipeline
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { AgentTemplate, ToolConfig, PromptFragment } from '../../../src/templates/types';
import {
  validateNode,
  validateTemplate,
  validateToolConfig,
  validateFragment,
  validateVariable,
  validateNodes,
  hasErrors,
  hasWarnings,
  getErrorsBySeverity,
  formatValidationErrors,
} from '../../../src/lib/validation/pipeline';

/**
 * Mock template factory
 */
function createMockTemplate(overrides?: Partial<AgentTemplate>): AgentTemplate {
  return {
    metadata: {
      name: 'test-template',
      version: '1.0.0',
      description: 'Test template',
      ...overrides?.metadata,
    },
    agent: {
      description: 'Test agent',
      prompt: 'Test prompt',
      tools: ['Read', 'Write'],
      ...overrides?.agent,
    },
    ...overrides,
  };
}

/**
 * Mock tool config factory
 */
function createMockToolConfig(overrides?: Partial<ToolConfig>): ToolConfig {
  return {
    tool: {
      name: 'Read',
      permissions: {
        allowedPaths: ['src/**/*.ts'],
      },
      ...overrides?.tool,
    },
  };
}

/**
 * Mock fragment factory
 */
function createMockFragment(overrides?: Partial<PromptFragment>): PromptFragment {
  return {
    fragment: {
      name: 'test-fragment',
      instructions: 'Test instructions',
      ...overrides?.fragment,
    },
  };
}

describe('validateNode', () => {
  it('should validate template node', async () => {
    const template = createMockTemplate();
    const result = await validateNode({ type: 'template', data: template });

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.duration).toBeGreaterThan(0);
    expect(result.timestamp).toBeGreaterThan(0);
  });

  it('should validate tool-config node', async () => {
    const config = createMockToolConfig();
    const result = await validateNode({ type: 'tool-config', data: config });

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should validate fragment node', async () => {
    const fragment = createMockFragment();
    const result = await validateNode({ type: 'fragment', data: fragment });

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should validate variable node', async () => {
    const template = createMockTemplate({
      agent: {
        description: 'Test',
        prompt: 'Review {{ file }}',
        tools: ['Read'],
      },
      validation: {
        required: ['file'],
        types: {
          file: { type: 'string' },
        },
      },
    });

    const result = await validateNode({
      type: 'variable',
      data: {
        template,
        variables: { file: 'test.ts' },
      },
    });

    expect(result.valid).toBe(true);
  });

  it('should detect invalid template', async () => {
    const invalidTemplate = {
      metadata: {
        name: '',  // Invalid: empty name
        version: '1.0.0',
        description: 'Test',
      },
      agent: {
        description: 'Test',
        prompt: 'Test',
        tools: [],  // Invalid: no tools
      },
    } as AgentTemplate;

    const result = await validateNode({ type: 'template', data: invalidTemplate });

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should include nodeId in result if provided', async () => {
    const template = createMockTemplate();
    const result = await validateNode(
      { type: 'template', data: template },
      { nodeId: 'test-node-123' }
    );

    expect(result.nodeId).toBe('test-node-123');
  });

  it('should measure validation duration', async () => {
    const template = createMockTemplate();
    const result = await validateNode({ type: 'template', data: template });

    expect(result.duration).toBeGreaterThanOrEqual(0);
    expect(result.duration).toBeLessThan(1000); // Should be fast (<1s)
  });

  it('should handle unknown node type', async () => {
    const result = await validateNode({ type: 'unknown', data: {} });

    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toContain('Unknown node type');
  });

  it('should handle validation errors gracefully', async () => {
    const result = await validateNode({ type: 'template', data: null as any });

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe('validateTemplate', () => {
  it('should validate valid template', async () => {
    const template = createMockTemplate();
    const result = await validateTemplate(template);

    expect(result.valid).toBe(true);
  });

  it('should detect missing required fields', async () => {
    const template = createMockTemplate({
      metadata: {
        name: 'test',
        version: '1.0.0',
        description: '',  // Invalid: empty description
      },
    });

    const result = await validateTemplate(template);

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.field === 'metadata.description')).toBe(true);
  });

  it('should detect invalid tools', async () => {
    const template = createMockTemplate({
      agent: {
        description: 'Test',
        prompt: 'Test',
        tools: ['WebSearch'],  // Invalid: network tool
      },
    });

    const result = await validateTemplate(template);

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.message.includes('forbidden'))).toBe(true);
  });
});

describe('validateToolConfig', () => {
  it('should validate valid tool config', async () => {
    const config = createMockToolConfig();
    const result = await validateToolConfig(config);

    expect(result.valid).toBe(true);
  });

  it('should detect invalid tool name', async () => {
    const config = createMockToolConfig({
      tool: {
        name: 'InvalidTool',
      },
    });

    const result = await validateToolConfig(config);

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.field === 'tool.name')).toBe(true);
  });

  it('should detect forbidden network tools', async () => {
    const config = createMockToolConfig({
      tool: {
        name: 'WebFetch',  // Forbidden
      },
    });

    const result = await validateToolConfig(config);

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.message.includes('forbidden'))).toBe(true);
  });
});

describe('validateFragment', () => {
  it('should validate valid fragment', async () => {
    const fragment = createMockFragment();
    const result = await validateFragment(fragment);

    expect(result.valid).toBe(true);
  });

  it('should detect missing name', async () => {
    const fragment = createMockFragment({
      fragment: {
        name: '',  // Invalid
        instructions: 'Test',
      },
    });

    const result = await validateFragment(fragment);

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.field === 'fragment.name')).toBe(true);
  });

  it('should detect missing instructions', async () => {
    const fragment = createMockFragment({
      fragment: {
        name: 'test',
        instructions: '',  // Invalid
      },
    });

    const result = await validateFragment(fragment);

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.field === 'fragment.instructions')).toBe(true);
  });
});

describe('validateVariable', () => {
  it('should validate when all required variables provided', async () => {
    const template = createMockTemplate({
      agent: {
        description: 'Test',
        prompt: 'Review {{ file }}',
        tools: ['Read'],
      },
      validation: {
        required: ['file'],
      },
    });

    const result = await validateVariable(template, { file: 'test.ts' });

    expect(result.valid).toBe(true);
  });

  it('should detect missing required variables', async () => {
    const template = createMockTemplate({
      agent: {
        description: 'Test',
        prompt: 'Review {{ file }}',
        tools: ['Read'],
      },
      validation: {
        required: ['file'],
      },
    });

    const result = await validateVariable(template, {});

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.message.includes('file'))).toBe(true);
  });

  it('should validate variable types', async () => {
    const template = createMockTemplate({
      agent: {
        description: 'Test',
        prompt: 'Test',
        tools: ['Read'],
      },
      validation: {
        required: ['count'],
        types: {
          count: { type: 'number' },
        },
      },
    });

    const result = await validateVariable(template, { count: 'not-a-number' });

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.message.includes('number'))).toBe(true);
  });
});

describe('validateNodes', () => {
  it('should validate multiple nodes in parallel', async () => {
    const nodes = [
      { type: 'template' as const, data: createMockTemplate() },
      { type: 'tool-config' as const, data: createMockToolConfig() },
      { type: 'fragment' as const, data: createMockFragment() },
    ];

    const results = await validateNodes(nodes);

    expect(results).toHaveLength(3);
    expect(results.every(r => r.valid)).toBe(true);
  });

  it('should return results in same order as input', async () => {
    const template1 = createMockTemplate({ metadata: { name: 'template-1', version: '1.0.0', description: 'Test 1' } });
    const template2 = createMockTemplate({ metadata: { name: 'template-2', version: '1.0.0', description: 'Test 2' } });

    const nodes = [
      { type: 'template' as const, data: template1 },
      { type: 'template' as const, data: template2 },
    ];

    const results = await validateNodes(nodes);

    expect(results[0].valid).toBe(true);
    expect(results[1].valid).toBe(true);
  });
});

describe('hasErrors', () => {
  it('should return true for results with errors', () => {
    const result = {
      valid: false,
      errors: [
        { field: 'test', message: 'Test error', severity: 'error' as const },
      ],
    };

    expect(hasErrors(result)).toBe(true);
  });

  it('should return false for results with only warnings', () => {
    const result = {
      valid: true,
      errors: [
        { field: 'test', message: 'Test warning', severity: 'warning' as const },
      ],
    };

    expect(hasErrors(result)).toBe(false);
  });

  it('should return false for valid results', () => {
    const result = {
      valid: true,
      errors: [],
    };

    expect(hasErrors(result)).toBe(false);
  });
});

describe('hasWarnings', () => {
  it('should return true for results with warnings', () => {
    const result = {
      valid: true,
      errors: [
        { field: 'test', message: 'Test warning', severity: 'warning' as const },
      ],
    };

    expect(hasWarnings(result)).toBe(true);
  });

  it('should return false for results with only errors', () => {
    const result = {
      valid: false,
      errors: [
        { field: 'test', message: 'Test error', severity: 'error' as const },
      ],
    };

    expect(hasWarnings(result)).toBe(false);
  });
});

describe('getErrorsBySeverity', () => {
  it('should filter errors by severity', () => {
    const result = {
      valid: false,
      errors: [
        { field: 'test1', message: 'Error', severity: 'error' as const },
        { field: 'test2', message: 'Warning', severity: 'warning' as const },
        { field: 'test3', message: 'Error 2', severity: 'error' as const },
      ],
    };

    const errors = getErrorsBySeverity(result, 'error');
    const warnings = getErrorsBySeverity(result, 'warning');

    expect(errors).toHaveLength(2);
    expect(warnings).toHaveLength(1);
  });
});

describe('formatValidationErrors', () => {
  it('should format errors as readable messages', () => {
    const result = {
      valid: false,
      errors: [
        { field: 'metadata.name', message: 'Name is required', severity: 'error' as const },
        { field: 'agent.tools', message: 'At least one tool required', severity: 'error' as const },
      ],
    };

    const messages = formatValidationErrors(result);

    expect(messages).toHaveLength(2);
    expect(messages[0]).toContain('Error in metadata.name');
    expect(messages[0]).toContain('Name is required');
  });

  it('should optionally exclude warnings', () => {
    const result = {
      valid: true,
      errors: [
        { field: 'test1', message: 'Error', severity: 'error' as const },
        { field: 'test2', message: 'Warning', severity: 'warning' as const },
      ],
    };

    const withWarnings = formatValidationErrors(result, true);
    const withoutWarnings = formatValidationErrors(result, false);

    expect(withWarnings).toHaveLength(2);
    expect(withoutWarnings).toHaveLength(1);
  });
});

describe('Performance', () => {
  it('should validate templates in under 100ms', async () => {
    const template = createMockTemplate();
    const result = await validateTemplate(template);

    expect(result.duration).toBeLessThan(100);
  });

  it('should validate large template sets efficiently', async () => {
    const templates = Array.from({ length: 50 }, (_, i) =>
      createMockTemplate({ metadata: { name: `template-${i}`, version: '1.0.0', description: 'Test' } })
    );

    const nodes = templates.map(t => ({ type: 'template' as const, data: t }));

    const start = performance.now();
    const results = await validateNodes(nodes);
    const duration = performance.now() - start;

    expect(results).toHaveLength(50);
    expect(duration).toBeLessThan(500); // 50 validations in <500ms
  });
});
