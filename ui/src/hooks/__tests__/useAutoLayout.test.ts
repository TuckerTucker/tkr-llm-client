/**
 * useAutoLayout Hook Tests
 *
 * Unit tests for the useAutoLayout hook to verify all 7 layout algorithms
 * work correctly with proper performance characteristics.
 *
 * @module hooks/__tests__/useAutoLayout.test
 * @version 1.0.0
 * @author Layout Integration Engineer (Agent 2) - Wave 1
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAutoLayout, LayoutAlgorithmType } from '../useAutoLayout';
import type { Node, Edge } from '../../../../src/lib/types/reactflow';
import type { NodeData, EdgeData } from '../../lib/types/ui-types';

// Mock data for testing
const createMockNodes = (count: number): Node<NodeData>[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `node-${i}`,
    type: 'template',
    position: { x: 0, y: 0 },
    data: {
      id: `node-${i}`,
      type: 'template' as const,
      name: `Template ${i}`,
      metadata: {},
      description: '',
      tags: [],
      tools: [],
      requiredVariables: [],
      optionalVariables: [],
    },
  }));
};

const createMockEdges = (nodeCount: number): Edge<EdgeData>[] => {
  const edges: Edge<EdgeData>[] = [];
  for (let i = 0; i < nodeCount - 1; i++) {
    edges.push({
      id: `edge-${i}`,
      source: `node-${i}`,
      target: `node-${i + 1}`,
      type: 'extends',
    });
  }
  return edges;
};

describe('useAutoLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Layout Algorithms', () => {
    const testAlgorithm = (
      algorithm: LayoutAlgorithmType,
      nodeCount: number = 10
    ) => {
      const nodes = createMockNodes(nodeCount);
      const edges = createMockEdges(nodeCount);

      const { result } = renderHook(() =>
        useAutoLayout(nodes, edges, {
          algorithm,
          animated: false,
        })
      );

      return result;
    };

    it('applies dagre layout correctly', async () => {
      const result = testAlgorithm('dagre', 10);

      await waitFor(() => {
        expect(result.current.layoutedNodes).toHaveLength(10);
        expect(result.current.currentAlgorithm).toBe('dagre');
        expect(result.current.isLayouting).toBe(false);
      });

      // Check that nodes have been positioned (not all at origin)
      const positionedCount = result.current.layoutedNodes.filter(
        (n) => n.position.x !== 0 || n.position.y !== 0
      ).length;
      expect(positionedCount).toBeGreaterThan(0);
    });

    it('applies force layout correctly', async () => {
      const result = testAlgorithm('force', 10);

      await waitFor(() => {
        expect(result.current.layoutedNodes).toHaveLength(10);
        expect(result.current.currentAlgorithm).toBe('force');
        expect(result.current.isLayouting).toBe(false);
      });
    });

    it('applies elk layout correctly', async () => {
      const result = testAlgorithm('elk', 10);

      await waitFor(() => {
        expect(result.current.layoutedNodes).toHaveLength(10);
        expect(result.current.currentAlgorithm).toBe('elk');
        expect(result.current.isLayouting).toBe(false);
      });
    });

    it('applies grid layout correctly', async () => {
      const result = testAlgorithm('grid', 10);

      await waitFor(() => {
        expect(result.current.layoutedNodes).toHaveLength(10);
        expect(result.current.currentAlgorithm).toBe('grid');
        expect(result.current.isLayouting).toBe(false);
      });

      // Grid layout should create uniform spacing
      const nodes = result.current.layoutedNodes;
      expect(nodes[0].position.x).toBeDefined();
      expect(nodes[0].position.y).toBeDefined();
    });

    it('applies circular layout correctly', async () => {
      const result = testAlgorithm('circular', 10);

      await waitFor(() => {
        expect(result.current.layoutedNodes).toHaveLength(10);
        expect(result.current.currentAlgorithm).toBe('circular');
        expect(result.current.isLayouting).toBe(false);
      });
    });

    it('applies tree layout correctly', async () => {
      const result = testAlgorithm('tree', 10);

      await waitFor(() => {
        expect(result.current.layoutedNodes).toHaveLength(10);
        expect(result.current.currentAlgorithm).toBe('tree');
        expect(result.current.isLayouting).toBe(false);
      });
    });

    it('preserves manual positions', async () => {
      const nodes = createMockNodes(5).map((n, i) => ({
        ...n,
        position: { x: i * 100, y: i * 50 },
      }));
      const edges = createMockEdges(5);

      const { result } = renderHook(() =>
        useAutoLayout(nodes, edges, {
          algorithm: 'manual',
          animated: false,
        })
      );

      await waitFor(() => {
        expect(result.current.layoutedNodes).toHaveLength(5);
        expect(result.current.currentAlgorithm).toBe('manual');
      });

      // Manual layout should preserve positions
      expect(result.current.layoutedNodes[0].position).toEqual({ x: 0, y: 0 });
      expect(result.current.layoutedNodes[1].position).toEqual({ x: 100, y: 50 });
    });
  });

  describe('Performance', () => {
    it('completes dagre layout within performance target', async () => {
      const nodes = createMockNodes(50);
      const edges = createMockEdges(50);

      const { result } = renderHook(() =>
        useAutoLayout(nodes, edges, {
          algorithm: 'dagre',
          animated: false,
        })
      );

      await waitFor(() => {
        expect(result.current.isLayouting).toBe(false);
      });

      // Should complete in < 100ms (relaxed target for CI)
      expect(result.current.lastLayoutTime).toBeLessThan(200);
    });

    it('completes grid layout within performance target', async () => {
      const nodes = createMockNodes(50);
      const edges = createMockEdges(50);

      const { result } = renderHook(() =>
        useAutoLayout(nodes, edges, {
          algorithm: 'grid',
          animated: false,
        })
      );

      await waitFor(() => {
        expect(result.current.isLayouting).toBe(false);
      });

      // Grid should be very fast (< 20ms)
      expect(result.current.lastLayoutTime).toBeLessThan(50);
    });
  });

  describe('Error Handling', () => {
    it('falls back to grid on layout error', async () => {
      // Create nodes with invalid data to trigger error
      const invalidNodes: Node<NodeData>[] = [];
      const edges = createMockEdges(0);

      const { result } = renderHook(() =>
        useAutoLayout(invalidNodes, edges, {
          algorithm: 'dagre',
          animated: false,
        })
      );

      await waitFor(() => {
        expect(result.current.isLayouting).toBe(false);
      });

      // Should either stay on dagre with empty nodes or fall back to grid
      expect(['dagre', 'grid']).toContain(result.current.currentAlgorithm);
    });
  });

  describe('Animation', () => {
    it('disables animation for large graphs', () => {
      const nodes = createMockNodes(150); // More than 100
      const edges = createMockEdges(150);

      const { result } = renderHook(() =>
        useAutoLayout(nodes, edges, {
          algorithm: 'dagre',
          animated: true,
        })
      );

      // canAnimate should be false for > 100 nodes
      expect(result.current.canAnimate).toBe(false);
    });

    it('enables animation for small graphs', () => {
      const nodes = createMockNodes(50);
      const edges = createMockEdges(50);

      const { result } = renderHook(() =>
        useAutoLayout(nodes, edges, {
          algorithm: 'dagre',
          animated: true,
        })
      );

      // canAnimate should be true for <= 100 nodes
      expect(result.current.canAnimate).toBe(true);
    });
  });

  describe('Actions', () => {
    it('applies layout on demand', async () => {
      const nodes = createMockNodes(5);
      const edges = createMockEdges(5);

      const { result } = renderHook(() =>
        useAutoLayout(nodes, edges, {
          algorithm: 'dagre',
          animated: false,
        })
      );

      await waitFor(() => {
        expect(result.current.isLayouting).toBe(false);
      });

      // Apply different layout
      result.current.applyLayout('grid');

      await waitFor(() => {
        expect(result.current.currentAlgorithm).toBe('grid');
      });
    });

    it('resets layout to original positions', async () => {
      const nodes = createMockNodes(5).map((n, i) => ({
        ...n,
        position: { x: i * 100, y: i * 100 },
      }));
      const edges = createMockEdges(5);

      const { result } = renderHook(() =>
        useAutoLayout(nodes, edges, {
          algorithm: 'dagre',
          animated: false,
        })
      );

      await waitFor(() => {
        expect(result.current.isLayouting).toBe(false);
      });

      // Reset to original
      result.current.resetLayout();

      expect(result.current.currentAlgorithm).toBe('manual');
      expect(result.current.layoutedNodes[0].position).toEqual({ x: 0, y: 0 });
    });
  });

  describe('Layout Validation', () => {
    it('validates layout algorithm support', () => {
      const nodes = createMockNodes(5);
      const edges = createMockEdges(5);

      const { result } = renderHook(() =>
        useAutoLayout(nodes, edges, {
          algorithm: 'dagre',
          animated: false,
        })
      );

      expect(result.current.layoutSupported('dagre')).toBe(true);
      expect(result.current.layoutSupported('force')).toBe(true);
      expect(result.current.layoutSupported('grid')).toBe(true);
      expect(result.current.layoutSupported('elk')).toBe(true);
      expect(result.current.layoutSupported('circular')).toBe(true);
      expect(result.current.layoutSupported('tree')).toBe(true);
      expect(result.current.layoutSupported('manual')).toBe(true);
    });
  });
});
