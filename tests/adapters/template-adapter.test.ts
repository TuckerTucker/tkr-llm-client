/**
 * Template Adapter Tests
 *
 * Unit tests for template adapter functions.
 *
 * @module tests/adapters/template-adapter
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { AgentTemplate } from '../../src/templates/types';
import {
  templateToNode,
  nodeToTemplate,
  templatesToNodes,
} from '../../src/lib/adapters/template-adapter';
import { AdapterError } from '../../src/lib/adapters/errors';

/**
 * Mock template factory
 */
function createMockTemplate(overrides?: Partial<AgentTemplate>): AgentTemplate {
  return {
    metadata: {
      name: 'test-template',
      version: '1.0.0',
      description: 'Test template',
      tags: ['test'],
      ...overrides?.metadata,
    },
    agent: {
      description: 'Test agent',
      prompt: 'Test prompt with {{ variable }}',
      tools: ['Read', 'Write'],
      ...overrides?.agent,
    },
    validation: {
      required: ['variable'],
      types: {
        variable: { type: 'string' },
      },
      ...overrides?.validation,
    },
    ...overrides,
  };
}

describe('templateToNode', () => {
  it('should convert AgentTemplate to TemplateNodeData', () => {
    const template = createMockTemplate();
    const node = templateToNode(template);

    expect(node.data.type).toBe('template');
    expect(node.data.name).toBe('test-template');
    expect(node.data.description).toBe('Test template');
    expect(node.data.tools).toEqual(['Read', 'Write']);
    expect(node.data.tags).toEqual(['test']);
  });

  it('should preserve template metadata', () => {
    const template = createMockTemplate({
      metadata: {
        name: 'security-agent',
        version: '2.0.0',
        description: 'Security checker',
        tags: ['security', 'code'],
      },
    });
    const node = templateToNode(template);

    expect(node.data.tags).toEqual(['security', 'code']);
    expect(node.data.metadata.version).toBe('2.0.0');
  });

  it('should handle templates with extends', () => {
    const template = createMockTemplate({
      metadata: {
        name: 'child-template',
        version: '1.0.0',
        description: 'Child template',
        extends: 'base-template',
      },
    });
    const node = templateToNode(template);

    expect(node.data.extends).toBe('base-template');
  });

  it('should handle templates with mixins', () => {
    const template = createMockTemplate({
      metadata: {
        name: 'mixed-template',
        version: '1.0.0',
        description: 'Mixed template',
        mixins: ['./fragments/safety.yml', './fragments/validation.yml'],
      },
    });
    const node = templateToNode(template);

    expect(node.data.mixins).toEqual([
      './fragments/safety.yml',
      './fragments/validation.yml',
    ]);
  });

  it('should extract required and optional variables', () => {
    const template = createMockTemplate({
      validation: {
        required: ['file', 'concern'],
        optional: ['format'],
        types: {
          file: { type: 'string' },
          concern: { type: 'enum', enum: ['security', 'performance'] },
          format: { type: 'string', default: 'markdown' },
        },
      },
    });
    const node = templateToNode(template);

    expect(node.data.requiredVariables).toEqual(['file', 'concern']);
    expect(node.data.optionalVariables).toEqual(['format']);
  });

  it('should handle tools with config', () => {
    const template = createMockTemplate({
      agent: {
        description: 'Test',
        prompt: 'Test',
        tools: [
          'Read',
          {
            name: 'Write',
            config: './configs/safe-write.yml',
          },
        ],
      },
    });
    const node = templateToNode(template);

    expect(node.data.tools).toEqual(['Read', 'Write']);
  });

  it('should use provided position', () => {
    const template = createMockTemplate();
    const node = templateToNode(template, { x: 100, y: 200 });

    expect(node.position).toEqual({ x: 100, y: 200 });
  });

  it('should default to (0, 0) position', () => {
    const template = createMockTemplate();
    const node = templateToNode(template);

    expect(node.position).toEqual({ x: 0, y: 0 });
  });

  it('should throw AdapterError for invalid template', () => {
    const invalid = {} as AgentTemplate;

    expect(() => templateToNode(invalid)).toThrow(AdapterError);
  });

  it('should throw AdapterError for missing metadata.name', () => {
    const invalid = {
      metadata: {},
      agent: { description: 'Test', prompt: 'Test', tools: [] },
    } as AgentTemplate;

    expect(() => templateToNode(invalid)).toThrow(AdapterError);
  });
});

describe('nodeToTemplate', () => {
  it('should convert TemplateNodeData back to AgentTemplate', () => {
    const original = createMockTemplate();
    const node = templateToNode(original);
    const converted = nodeToTemplate(node);

    expect(converted.metadata.name).toBe(original.metadata.name);
    expect(converted.agent.prompt).toBe(original.agent.prompt);
    expect(converted.agent.tools).toEqual(original.agent.tools);
  });

  it('should preserve all template properties', () => {
    const original = createMockTemplate({
      metadata: {
        name: 'full-template',
        version: '1.0.0',
        description: 'Full template',
        author: 'Test Author',
        tags: ['test', 'full'],
        base: true,
        extends: 'base',
        mixins: ['./fragment.yml'],
      },
      runtime: {
        workingDirectory: '/project',
        timeout: 30000,
        logLevel: 'debug',
      },
    });

    const node = templateToNode(original);
    const converted = nodeToTemplate(node);

    expect(converted.metadata.author).toBe('Test Author');
    expect(converted.metadata.base).toBe(true);
    expect(converted.runtime?.workingDirectory).toBe('/project');
  });

  it('should throw AdapterError for invalid node', () => {
    const invalid = {
      id: 'test',
      position: { x: 0, y: 0 },
      data: {},
    } as any;

    expect(() => nodeToTemplate(invalid)).toThrow(AdapterError);
  });
});

describe('templatesToNodes', () => {
  it('should batch convert templates with grid layout', () => {
    const templates = [
      createMockTemplate({ metadata: { name: 't1', version: '1.0.0', description: 'T1' } }),
      createMockTemplate({ metadata: { name: 't2', version: '1.0.0', description: 'T2' } }),
      createMockTemplate({ metadata: { name: 't3', version: '1.0.0', description: 'T3' } }),
    ];

    const nodes = templatesToNodes(templates, 'grid');

    expect(nodes).toHaveLength(3);
    expect(nodes[0].data.name).toBe('t1');
    expect(nodes[1].data.name).toBe('t2');
    expect(nodes[2].data.name).toBe('t3');

    // Check grid layout (3 columns)
    expect(nodes[0].position).toEqual({ x: 0, y: 0 });
    expect(nodes[1].position).toEqual({ x: 400, y: 0 });
    expect(nodes[2].position).toEqual({ x: 800, y: 0 });
  });

  it('should batch convert templates with tree layout', () => {
    const templates = [
      createMockTemplate({
        metadata: { name: 'parent', version: '1.0.0', description: 'Parent' },
      }),
      createMockTemplate({
        metadata: {
          name: 'child1',
          version: '1.0.0',
          description: 'Child 1',
          extends: 'parent',
        },
      }),
      createMockTemplate({
        metadata: {
          name: 'child2',
          version: '1.0.0',
          description: 'Child 2',
          extends: 'parent',
        },
      }),
    ];

    const nodes = templatesToNodes(templates, 'tree');

    expect(nodes).toHaveLength(3);
  });

  it('should batch convert templates with force layout', () => {
    const templates = [
      createMockTemplate({ metadata: { name: 't1', version: '1.0.0', description: 'T1' } }),
      createMockTemplate({ metadata: { name: 't2', version: '1.0.0', description: 'T2' } }),
    ];

    const nodes = templatesToNodes(templates, 'force');

    expect(nodes).toHaveLength(2);
    // Force layout uses circular positioning
    expect(nodes[0].position.x).toBeGreaterThan(0);
    expect(nodes[0].position.y).toBeGreaterThan(0);
  });

  it('should default to grid layout', () => {
    const templates = [createMockTemplate()];
    const nodes = templatesToNodes(templates);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].position).toEqual({ x: 0, y: 0 });
  });

  it('should handle empty array', () => {
    const nodes = templatesToNodes([]);
    expect(nodes).toEqual([]);
  });

  it('should throw AdapterError for invalid templates', () => {
    const invalid = [{}] as AgentTemplate[];

    expect(() => templatesToNodes(invalid)).toThrow(AdapterError);
  });
});
