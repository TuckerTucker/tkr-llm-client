/**
 * Store Integration Tests
 *
 * Tests for state management integration between backend stores and UI hooks.
 *
 * @module ui/__tests__/store-integration
 * @version 1.0.0
 * @author State Management Integration Engineer (Agent 4, Wave 1)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useCanvasStore } from '../store';
import type { Node } from '@/../../src/lib/types/reactflow';
import type { NodeData } from '@/../../src/lib/types/ui-types';

describe('Store Integration', () => {
  beforeEach(() => {
    // Reset store before each test
    useCanvasStore.getState().reset();
  });

  it('should export useCanvasStore', () => {
    expect(useCanvasStore).toBeDefined();
    expect(typeof useCanvasStore).toBe('function');
  });

  it('should have initial state', () => {
    const state = useCanvasStore.getState();

    expect(state.nodes).toEqual([]);
    expect(state.edges).toEqual([]);
    expect(state.selectedNodes).toEqual([]);
    expect(state.selectedEdges).toEqual([]);
    expect(state.viewport).toEqual({ x: 0, y: 0, zoom: 1 });
    expect(state.history).toEqual([]);
    expect(state.historyIndex).toBe(-1);
  });

  it('should add node', () => {
    const store = useCanvasStore.getState();

    const node: Node<NodeData> = {
      id: 'test-node-1',
      type: 'template',
      position: { x: 100, y: 100 },
      data: {
        id: 'test-node-1',
        type: 'template',
        label: 'Test Node',
        metadata: {},
        config: {},
      },
    };

    store.addNode(node);

    const state = useCanvasStore.getState();
    expect(state.nodes).toHaveLength(1);
    expect(state.nodes[0]).toEqual(node);
  });

  it('should update node', () => {
    const store = useCanvasStore.getState();

    const node: Node<NodeData> = {
      id: 'test-node-1',
      type: 'template',
      position: { x: 100, y: 100 },
      data: {
        id: 'test-node-1',
        type: 'template',
        label: 'Test Node',
        metadata: {},
        config: {},
      },
    };

    store.addNode(node);
    store.updateNode('test-node-1', {
      position: { x: 200, y: 200 },
    });

    const state = useCanvasStore.getState();
    expect(state.nodes[0].position).toEqual({ x: 200, y: 200 });
  });

  it('should remove node', () => {
    const store = useCanvasStore.getState();

    const node: Node<NodeData> = {
      id: 'test-node-1',
      type: 'template',
      position: { x: 100, y: 100 },
      data: {
        id: 'test-node-1',
        type: 'template',
        label: 'Test Node',
        metadata: {},
        config: {},
      },
    };

    store.addNode(node);
    store.removeNode('test-node-1');

    const state = useCanvasStore.getState();
    expect(state.nodes).toHaveLength(0);
  });

  it('should push and undo history', () => {
    const store = useCanvasStore.getState();

    // Initial state
    expect(store.canUndo()).toBe(false);

    // Add node
    const node: Node<NodeData> = {
      id: 'test-node-1',
      type: 'template',
      position: { x: 100, y: 100 },
      data: {
        id: 'test-node-1',
        type: 'template',
        label: 'Test Node',
        metadata: {},
        config: {},
      },
    };

    store.addNode(node);
    store.pushHistory();

    // Should be able to undo
    expect(store.canUndo()).toBe(true);

    // Undo
    store.undo();

    const state = useCanvasStore.getState();
    expect(state.nodes).toHaveLength(0);
  });

  it('should redo after undo', () => {
    const store = useCanvasStore.getState();

    // Push initial state
    store.pushHistory();

    // Add node
    const node: Node<NodeData> = {
      id: 'test-node-1',
      type: 'template',
      position: { x: 100, y: 100 },
      data: {
        id: 'test-node-1',
        type: 'template',
        label: 'Test Node',
        metadata: {},
        config: {},
      },
    };

    store.addNode(node);
    store.pushHistory();

    // Undo
    store.undo();
    expect(useCanvasStore.getState().nodes).toHaveLength(0);

    // Should be able to redo
    expect(store.canRedo()).toBe(true);

    // Redo
    store.redo();
    expect(useCanvasStore.getState().nodes).toHaveLength(1);
  });

  it('should clear redo history on new action', () => {
    const store = useCanvasStore.getState();

    // Push initial state
    store.pushHistory();

    // Add node 1
    const node1: Node<NodeData> = {
      id: 'test-node-1',
      type: 'template',
      position: { x: 100, y: 100 },
      data: {
        id: 'test-node-1',
        type: 'template',
        label: 'Test Node 1',
        metadata: {},
        config: {},
      },
    };

    store.addNode(node1);
    store.pushHistory();

    // Undo
    store.undo();

    // Add different node
    const node2: Node<NodeData> = {
      id: 'test-node-2',
      type: 'template',
      position: { x: 200, y: 200 },
      data: {
        id: 'test-node-2',
        type: 'template',
        label: 'Test Node 2',
        metadata: {},
        config: {},
      },
    };

    store.addNode(node2);
    store.pushHistory();

    // Should not be able to redo to node1
    expect(store.canRedo()).toBe(false);
  });

  it('should handle selection', () => {
    const store = useCanvasStore.getState();

    const node: Node<NodeData> = {
      id: 'test-node-1',
      type: 'template',
      position: { x: 100, y: 100 },
      data: {
        id: 'test-node-1',
        type: 'template',
        label: 'Test Node',
        metadata: {},
        config: {},
      },
    };

    store.addNode(node);
    store.selectNode('test-node-1');

    const state = useCanvasStore.getState();
    expect(state.selectedNodes).toEqual(['test-node-1']);
    expect(state.nodes[0].selected).toBe(true);
  });

  it('should clear selection', () => {
    const store = useCanvasStore.getState();

    const node: Node<NodeData> = {
      id: 'test-node-1',
      type: 'template',
      position: { x: 100, y: 100 },
      data: {
        id: 'test-node-1',
        type: 'template',
        label: 'Test Node',
        metadata: {},
        config: {},
      },
    };

    store.addNode(node);
    store.selectNode('test-node-1');
    store.clearSelection();

    const state = useCanvasStore.getState();
    expect(state.selectedNodes).toEqual([]);
    expect(state.nodes[0].selected).toBe(false);
  });

  it('should reset store', () => {
    const store = useCanvasStore.getState();

    const node: Node<NodeData> = {
      id: 'test-node-1',
      type: 'template',
      position: { x: 100, y: 100 },
      data: {
        id: 'test-node-1',
        type: 'template',
        label: 'Test Node',
        metadata: {},
        config: {},
      },
    };

    store.addNode(node);
    store.selectNode('test-node-1');
    store.pushHistory();

    store.reset();

    const state = useCanvasStore.getState();
    expect(state.nodes).toEqual([]);
    expect(state.edges).toEqual([]);
    expect(state.selectedNodes).toEqual([]);
    expect(state.history).toEqual([]);
    expect(state.historyIndex).toBe(-1);
  });
});

describe('useCanvas Hook', () => {
  // Note: Hook tests require React testing library
  // These are placeholder tests to verify imports
  it('should export useCanvas hook', async () => {
    const { useCanvas } = await import('../hooks/useCanvas');
    expect(useCanvas).toBeDefined();
    expect(typeof useCanvas).toBe('function');
  });

  it('should export useCanvasHistory hook', async () => {
    const { useCanvasHistory } = await import('../hooks/useCanvas');
    expect(useCanvasHistory).toBeDefined();
    expect(typeof useCanvasHistory).toBe('function');
  });

  it('should export useCanvasSelection hook', async () => {
    const { useCanvasSelection } = await import('../hooks/useCanvas');
    expect(useCanvasSelection).toBeDefined();
    expect(typeof useCanvasSelection).toBe('function');
  });

  it('should export useCanvasViewport hook', async () => {
    const { useCanvasViewport } = await import('../hooks/useCanvas');
    expect(useCanvasViewport).toBeDefined();
    expect(typeof useCanvasViewport).toBe('function');
  });
});
