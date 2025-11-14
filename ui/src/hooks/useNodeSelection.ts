/**
 * Node Selection Hook for ReactFlow Canvas
 *
 * Provides node and edge selection functionality with support for:
 * - Single-select (click)
 * - Multi-select (Cmd/Ctrl+click)
 * - Select-all (Cmd/Ctrl+A)
 * - Deselect (Esc or click canvas)
 * - Delete selected (Delete key)
 * - Keyboard shortcuts
 *
 * @module hooks/useNodeSelection
 * @version 1.0.0
 * @author Interaction Engineer (Agent 2)
 */

import { useCallback, useEffect } from 'react';
import { useSelection } from '@/../../src/lib/interactions/selection';
import { useCanvasStore } from '@/../../src/lib/state/canvas-store';

/**
 * Node selection hook
 *
 * Provides selection handlers and state for nodes and edges.
 *
 * @returns Selection handlers and state
 */
export function useNodeSelection() {
  const selection = useSelection();
  const store = useCanvasStore();

  /**
   * Select a single node
   *
   * @param id - Node ID
   * @param multi - Whether to add to selection (multi-select)
   */
  const selectNode = useCallback(
    (id: string, multi: boolean = false) => {
      const mode = multi ? 'toggle' : 'replace';
      selection.selectNode(id, mode);
    },
    [selection]
  );

  /**
   * Select multiple nodes
   *
   * @param ids - Array of node IDs
   * @param multi - Whether to add to selection
   */
  const selectNodes = useCallback(
    (ids: string[], multi: boolean = false) => {
      const mode = multi ? 'add' : 'replace';
      selection.selectNodes(ids, mode);
    },
    [selection]
  );

  /**
   * Select a single edge
   *
   * @param id - Edge ID
   * @param multi - Whether to add to selection
   */
  const selectEdge = useCallback(
    (id: string, multi: boolean = false) => {
      const mode = multi ? 'toggle' : 'replace';
      selection.selectEdge(id, mode);
    },
    [selection]
  );

  /**
   * Select multiple edges
   *
   * @param ids - Array of edge IDs
   * @param multi - Whether to add to selection
   */
  const selectEdges = useCallback(
    (ids: string[], multi: boolean = false) => {
      const mode = multi ? 'add' : 'replace';
      selection.selectEdges(ids, mode);
    },
    [selection]
  );

  /**
   * Deselect all nodes and edges
   */
  const deselectAll = useCallback(() => {
    selection.deselectAll();
  }, [selection]);

  /**
   * Select all nodes and edges
   */
  const selectAll = useCallback(() => {
    selection.selectAll();
  }, [selection]);

  /**
   * Delete selected nodes and edges
   */
  const deleteSelected = useCallback(() => {
    const selectedNodeIds = selection.selectedNodes;
    const selectedEdgeIds = selection.selectedEdges;

    // Remove nodes (edges connected to them will be removed automatically)
    if (selectedNodeIds.length > 0) {
      store.removeNodes(selectedNodeIds);
    }

    // Remove edges
    if (selectedEdgeIds.length > 0) {
      store.removeEdges(selectedEdgeIds);
    }

    // Push to history after deletion
    if (selectedNodeIds.length > 0 || selectedEdgeIds.length > 0) {
      store.pushHistory();
    }

    // Clear selection
    selection.deselectAll();
  }, [selection, store]);

  /**
   * Toggle selection of a node or edge
   *
   * @param id - Node or edge ID
   * @param type - Type: 'node' or 'edge'
   */
  const toggleSelection = useCallback(
    (id: string, type: 'node' | 'edge') => {
      if (type === 'node') {
        selection.selectNode(id, 'toggle');
      } else {
        selection.selectEdge(id, 'toggle');
      }
    },
    [selection]
  );

  /**
   * Duplicate selected nodes
   */
  const duplicateSelected = useCallback(() => {
    const selectedNodeIds = selection.selectedNodes;
    const selectedNodes = store.nodes.filter((node) =>
      selectedNodeIds.includes(node.id)
    );

    if (selectedNodes.length === 0) return;

    // Create duplicates with offset positions
    const duplicates = selectedNodes.map((node, index) => ({
      ...node,
      id: `${node.id}-copy-${Date.now()}-${index}`,
      position: {
        x: node.position.x + 50,
        y: node.position.y + 50,
      },
      data: {
        ...node.data,
        id: `${node.data.id}-copy-${Date.now()}-${index}`,
        name: `${node.data.name} (Copy)`,
      },
      selected: false,
    }));

    // Add duplicates to canvas
    store.addNodes(duplicates);
    store.pushHistory();

    // Select duplicates
    const duplicateIds = duplicates.map((node) => node.id);
    selection.selectNodes(duplicateIds, 'replace');
  }, [selection, store]);

  /**
   * Select connected nodes
   *
   * Selects all nodes connected to the currently selected nodes.
   */
  const selectConnectedNodes = useCallback(() => {
    const selectedNodeIds = selection.selectedNodes;
    if (selectedNodeIds.length === 0) return;

    const connectedNodeIds = new Set<string>(selectedNodeIds);

    // Find all edges connected to selected nodes
    store.edges.forEach((edge) => {
      if (selectedNodeIds.includes(edge.source)) {
        connectedNodeIds.add(edge.target);
      }
      if (selectedNodeIds.includes(edge.target)) {
        connectedNodeIds.add(edge.source);
      }
    });

    // Select all connected nodes
    selection.selectNodes(Array.from(connectedNodeIds), 'replace');
  }, [selection, store]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if we're in an input element
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Cmd/Ctrl+A: Select all
      if ((event.metaKey || event.ctrlKey) && event.key === 'a') {
        event.preventDefault();
        selectAll();
      }

      // Escape: Deselect all
      if (event.key === 'Escape') {
        event.preventDefault();
        deselectAll();
      }

      // Delete/Backspace: Delete selected
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        deleteSelected();
      }

      // Cmd/Ctrl+D: Duplicate selected
      if ((event.metaKey || event.ctrlKey) && event.key === 'd') {
        event.preventDefault();
        duplicateSelected();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectAll, deselectAll, deleteSelected, duplicateSelected]);

  return {
    // State
    selectedNodes: selection.selectedNodes,
    selectedEdges: selection.selectedEdges,

    // Single selection
    selectNode,
    selectEdge,

    // Multi selection
    selectNodes,
    selectEdges,

    // Selection operations
    selectAll,
    deselectAll,
    deleteSelected,
    toggleSelection,
    duplicateSelected,
    selectConnectedNodes,

    // Event handlers
    handleNodeClick: selection.handleNodeClick,
    handleEdgeClick: selection.handleEdgeClick,
    handlePaneClick: selection.handlePaneClick,

    // Utilities
    setCanvasRef: selection.setCanvasRef,
  };
}
