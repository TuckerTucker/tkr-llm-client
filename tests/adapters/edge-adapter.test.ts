/**
 * Edge Adapter Tests
 *
 * Unit tests for edge adapter functions.
 *
 * @module tests/adapters/edge-adapter
 */

import { describe, it, expect } from 'vitest';
import {
  createExtendsEdge,
  createMixinEdge,
  createVariableEdge,
  createToolRefEdge,
  createBundleEdge,
} from '../../src/lib/adapters/edge-adapter';
import { AdapterError } from '../../src/lib/adapters/errors';

describe('createExtendsEdge', () => {
  it('should create extends edge', () => {
    const edge = createExtendsEdge('parent', 'child');

    expect(edge.id).toBe('extends-parent-child');
    expect(edge.source).toBe('parent');
    expect(edge.target).toBe('child');
    expect(edge.type).toBe('extends');
    expect(edge.label).toBe('extends');
    expect(edge.animated).toBe(false);
    expect(edge.data?.type).toBe('extends');
  });

  it('should throw for missing source', () => {
    expect(() => createExtendsEdge('', 'child')).toThrow(AdapterError);
  });

  it('should throw for missing target', () => {
    expect(() => createExtendsEdge('parent', '')).toThrow(AdapterError);
  });
});

describe('createMixinEdge', () => {
  it('should create mixin edge with order', () => {
    const edge = createMixinEdge('fragment', 'template', 2);

    expect(edge.id).toBe('mixin-fragment-template');
    expect(edge.source).toBe('fragment');
    expect(edge.target).toBe('template');
    expect(edge.type).toBe('mixin');
    expect(edge.label).toBe('mixin (2)');
    expect(edge.animated).toBe(true);
    expect(edge.data?.metadata?.order).toBe(2);
  });

  it('should throw for invalid order', () => {
    expect(() => createMixinEdge('fragment', 'template', 0)).toThrow(
      AdapterError
    );
    expect(() => createMixinEdge('fragment', 'template', -1)).toThrow(
      AdapterError
    );
  });
});

describe('createVariableEdge', () => {
  it('should create variable edge', () => {
    const edge = createVariableEdge('var-file', 'template');

    expect(edge.id).toBe('variable-var-file-template');
    expect(edge.source).toBe('var-file');
    expect(edge.target).toBe('template');
    expect(edge.type).toBe('variable');
    expect(edge.label).toBe('binds');
    expect(edge.data?.type).toBe('variable');
  });
});

describe('createToolRefEdge', () => {
  it('should create tool ref edge', () => {
    const edge = createToolRefEdge('config-Write', 'template');

    expect(edge.id).toBe('toolRef-config-Write-template');
    expect(edge.source).toBe('config-Write');
    expect(edge.target).toBe('template');
    expect(edge.type).toBe('toolRef');
    expect(edge.label).toBe('configures');
  });
});

describe('createBundleEdge', () => {
  it('should create bundle edge', () => {
    const edge = createBundleEdge('bundle-file-ops', 'template');

    expect(edge.id).toBe('bundle-bundle-file-ops-template');
    expect(edge.source).toBe('bundle-file-ops');
    expect(edge.target).toBe('template');
    expect(edge.type).toBe('bundle');
    expect(edge.label).toBe('provides tools');
  });
});
