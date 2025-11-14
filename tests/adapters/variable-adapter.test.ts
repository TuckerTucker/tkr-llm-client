/**
 * Variable Adapter Tests
 *
 * Unit tests for variable adapter functions.
 *
 * @module tests/adapters/variable-adapter
 */

import { describe, it, expect } from 'vitest';
import type { ValidationTypeRule } from '../../src/templates/types';
import {
  variableToNode,
  extractVariableValues,
  createVariableNodesFromTemplate,
} from '../../src/lib/adapters/variable-adapter';
import { AdapterError } from '../../src/lib/adapters/errors';

describe('variableToNode', () => {
  it('should create variable node from string type', () => {
    const rule: ValidationTypeRule = {
      type: 'string',
      default: 'test.txt',
    };

    const node = variableToNode('file', rule);

    expect(node.id).toBe('var-file');
    expect(node.data.type).toBe('variable');
    expect(node.data.variableName).toBe('file');
    expect(node.data.variableType).toBe('string');
    expect(node.data.value).toBe('test.txt');
    expect(node.data.defaultValue).toBe('test.txt');
    expect(node.data.required).toBe(false);
  });

  it('should create variable node from enum type', () => {
    const rule: ValidationTypeRule = {
      type: 'enum',
      enum: ['security', 'performance', 'style'],
      default: 'security',
    };

    const node = variableToNode('concern', rule);

    expect(node.data.variableType).toBe('enum');
    expect(node.data.enumOptions).toEqual([
      'security',
      'performance',
      'style',
    ]);
  });

  it('should mark as required if no default', () => {
    const rule: ValidationTypeRule = {
      type: 'string',
    };

    const node = variableToNode('required-var', rule);

    expect(node.data.required).toBe(true);
    expect(node.data.value).toBeUndefined();
  });

  it('should throw for invalid variable name', () => {
    const rule: ValidationTypeRule = { type: 'string' };

    expect(() => variableToNode('', rule)).toThrow(AdapterError);
  });

  it('should throw for invalid rule', () => {
    expect(() => variableToNode('var', {} as any)).toThrow(AdapterError);
  });
});

describe('extractVariableValues', () => {
  it('should extract variable values from nodes', () => {
    const nodes = [
      variableToNode('file', { type: 'string', default: 'test.txt' }),
      variableToNode('concern', {
        type: 'enum',
        enum: ['security'],
        default: 'security',
      }),
    ];

    // Set values
    nodes[0].data.value = 'actual.txt';
    nodes[1].data.value = 'security';

    const values = extractVariableValues(nodes);

    expect(values).toEqual({
      file: 'actual.txt',
      concern: 'security',
    });
  });

  it('should use default values if not set', () => {
    const nodes = [
      variableToNode('file', { type: 'string', default: 'default.txt' }),
    ];

    const values = extractVariableValues(nodes);

    expect(values).toEqual({
      file: 'default.txt',
    });
  });

  it('should throw for missing required variable', () => {
    const nodes = [variableToNode('required', { type: 'string' })];

    expect(() => extractVariableValues(nodes)).toThrow(AdapterError);
  });

  it('should handle empty array', () => {
    const values = extractVariableValues([]);
    expect(values).toEqual({});
  });
});

describe('createVariableNodesFromTemplate', () => {
  it('should create nodes from validation rules', () => {
    const rules = {
      required: ['file'],
      optional: ['format'],
      types: {
        file: { type: 'string' as const },
        format: { type: 'string' as const, default: 'markdown' },
      },
    };

    const nodes = createVariableNodesFromTemplate(rules);

    expect(nodes).toHaveLength(2);
    expect(nodes[0].data.variableName).toBe('file');
    expect(nodes[1].data.variableName).toBe('format');
  });

  it('should handle no validation rules', () => {
    const nodes = createVariableNodesFromTemplate(undefined);
    expect(nodes).toEqual([]);
  });

  it('should handle missing types', () => {
    const nodes = createVariableNodesFromTemplate({
      required: ['file'],
    });
    expect(nodes).toEqual([]);
  });
});
