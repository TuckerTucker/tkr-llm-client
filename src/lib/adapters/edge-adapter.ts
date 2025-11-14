/**
 * Edge Adapter
 *
 * Creates edges for ReactFlow representing relationships between nodes.
 *
 * @module lib/adapters/edge-adapter
 * @version 1.0.0
 * @author Data Bridge Engineer (Agent 1)
 */

import type { EdgeData } from '../types/ui-types';
import type { Edge } from '../types/reactflow';
import { AdapterError } from './errors';

/**
 * Creates an inheritance edge (extends relationship).
 *
 * Represents a child template extending a parent template.
 *
 * @param sourceId - Parent template node ID
 * @param targetId - Child template node ID
 * @returns Edge with extends type
 * @throws {AdapterError} If IDs are invalid
 *
 * @example
 * ```typescript
 * const edge = createExtendsEdge('base-agent', 'code-reviewer');
 * ```
 */
export function createExtendsEdge(
  sourceId: string,
  targetId: string
): Edge<EdgeData> {
  try {
    if (!sourceId || !targetId) {
      throw new Error('Source and target IDs are required');
    }

    const edgeData: EdgeData = {
      id: `extends-${sourceId}-${targetId}`,
      type: 'extends',
      label: 'extends',
      animated: false,
      metadata: {
        relationship: 'inheritance',
      },
    };

    const edge: Edge<EdgeData> = {
      id: edgeData.id,
      source: sourceId,
      target: targetId,
      type: 'extends',
      label: 'extends',
      animated: false,
      data: edgeData,
      markerEnd: 'arrow',
      style: {
        stroke: '#3b82f6',
        strokeWidth: 2,
      },
    };

    return edge;
  } catch (error) {
    throw new AdapterError(
      `Failed to create extends edge: ${(error as Error).message}`,
      { sourceId, targetId },
      'edge'
    );
  }
}

/**
 * Creates a mixin edge (fragment → template).
 *
 * Represents a fragment being mixed into a template.
 *
 * @param sourceId - Fragment node ID
 * @param targetId - Template node ID
 * @param order - Insertion order (1, 2, 3...)
 * @returns Edge with mixin type and animation
 * @throws {AdapterError} If IDs or order are invalid
 *
 * @example
 * ```typescript
 * const edge = createMixinEdge('safety-checks', 'file-writer', 1);
 * ```
 */
export function createMixinEdge(
  sourceId: string,
  targetId: string,
  order: number
): Edge<EdgeData> {
  try {
    if (!sourceId || !targetId) {
      throw new Error('Source and target IDs are required');
    }
    if (typeof order !== 'number' || order < 1) {
      throw new Error('Order must be a positive number');
    }

    const edgeData: EdgeData = {
      id: `mixin-${sourceId}-${targetId}`,
      type: 'mixin',
      label: `mixin (${order})`,
      animated: true,
      metadata: {
        relationship: 'composition',
        order,
      },
    };

    const edge: Edge<EdgeData> = {
      id: edgeData.id,
      source: sourceId,
      target: targetId,
      type: 'mixin',
      label: `mixin (${order})`,
      animated: true,
      data: edgeData,
      markerEnd: 'arrow',
      style: {
        stroke: '#10b981',
        strokeWidth: 2,
        strokeDasharray: '5,5',
      },
    };

    return edge;
  } catch (error) {
    throw new AdapterError(
      `Failed to create mixin edge: ${(error as Error).message}`,
      { sourceId, targetId, order },
      'edge'
    );
  }
}

/**
 * Creates a variable binding edge (variable → template).
 *
 * Represents a variable being bound to a template.
 *
 * @param sourceId - Variable node ID
 * @param targetId - Template node ID
 * @returns Edge with variable type
 * @throws {AdapterError} If IDs are invalid
 *
 * @example
 * ```typescript
 * const edge = createVariableEdge('var-file', 'code-reviewer');
 * ```
 */
export function createVariableEdge(
  sourceId: string,
  targetId: string
): Edge<EdgeData> {
  try {
    if (!sourceId || !targetId) {
      throw new Error('Source and target IDs are required');
    }

    const edgeData: EdgeData = {
      id: `variable-${sourceId}-${targetId}`,
      type: 'variable',
      label: 'binds',
      animated: false,
      metadata: {
        relationship: 'binding',
      },
    };

    const edge: Edge<EdgeData> = {
      id: edgeData.id,
      source: sourceId,
      target: targetId,
      type: 'variable',
      label: 'binds',
      animated: false,
      data: edgeData,
      markerEnd: 'arrow',
      style: {
        stroke: '#f59e0b',
        strokeWidth: 1.5,
      },
    };

    return edge;
  } catch (error) {
    throw new AdapterError(
      `Failed to create variable edge: ${(error as Error).message}`,
      { sourceId, targetId },
      'edge'
    );
  }
}

/**
 * Creates a tool reference edge (toolConfig → template).
 *
 * Represents a tool configuration being referenced by a template.
 *
 * @param sourceId - ToolConfig node ID
 * @param targetId - Template node ID
 * @returns Edge with toolRef type
 * @throws {AdapterError} If IDs are invalid
 *
 * @example
 * ```typescript
 * const edge = createToolRefEdge('config-Write', 'file-writer');
 * ```
 */
export function createToolRefEdge(
  sourceId: string,
  targetId: string
): Edge<EdgeData> {
  try {
    if (!sourceId || !targetId) {
      throw new Error('Source and target IDs are required');
    }

    const edgeData: EdgeData = {
      id: `toolRef-${sourceId}-${targetId}`,
      type: 'toolRef',
      label: 'configures',
      animated: false,
      metadata: {
        relationship: 'configuration',
      },
    };

    const edge: Edge<EdgeData> = {
      id: edgeData.id,
      source: sourceId,
      target: targetId,
      type: 'toolRef',
      label: 'configures',
      animated: false,
      data: edgeData,
      markerEnd: 'arrow',
      style: {
        stroke: '#8b5cf6',
        strokeWidth: 1.5,
        strokeDasharray: '3,3',
      },
    };

    return edge;
  } catch (error) {
    throw new AdapterError(
      `Failed to create tool ref edge: ${(error as Error).message}`,
      { sourceId, targetId },
      'edge'
    );
  }
}

/**
 * Creates a bundle edge (bundle → template).
 *
 * Represents a tool bundle being used by a template.
 *
 * @param sourceId - Bundle node ID
 * @param targetId - Template node ID
 * @returns Edge with bundle type
 * @throws {AdapterError} If IDs are invalid
 *
 * @example
 * ```typescript
 * const edge = createBundleEdge('bundle-file-ops', 'file-manager');
 * ```
 */
export function createBundleEdge(
  sourceId: string,
  targetId: string
): Edge<EdgeData> {
  try {
    if (!sourceId || !targetId) {
      throw new Error('Source and target IDs are required');
    }

    const edgeData: EdgeData = {
      id: `bundle-${sourceId}-${targetId}`,
      type: 'bundle',
      label: 'provides tools',
      animated: false,
      metadata: {
        relationship: 'bundle',
      },
    };

    const edge: Edge<EdgeData> = {
      id: edgeData.id,
      source: sourceId,
      target: targetId,
      type: 'bundle',
      label: 'provides tools',
      animated: false,
      data: edgeData,
      markerEnd: 'arrow',
      style: {
        stroke: '#ec4899',
        strokeWidth: 2,
      },
    };

    return edge;
  } catch (error) {
    throw new AdapterError(
      `Failed to create bundle edge: ${(error as Error).message}`,
      { sourceId, targetId },
      'edge'
    );
  }
}
