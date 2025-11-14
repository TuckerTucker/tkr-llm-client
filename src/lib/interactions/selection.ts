/**
 * Selection Logic
 *
 * Handles single/multi-select (Ctrl/Cmd), box selection, select all (Cmd+A),
 * deselect all (Escape), and selection state management.
 *
 * @module lib/interactions/selection
 * @version 1.0.0
 * @author Interaction Engineer (Agent 2)
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Node, Edge } from '../types/reactflow';
import { NodeData, EdgeData } from '../types/ui-types';
import { useCanvasStore } from '../state/canvas-store';

/**
 * Box selection bounds
 */
export interface SelectionBox {
  /** Selection box active */
  active: boolean;

  /** Start X coordinate */
  startX: number;

  /** Start Y coordinate */
  startY: number;

  /** Current X coordinate */
  currentX: number;

  /** Current Y coordinate */
  currentY: number;
}

/**
 * Selection mode
 */
export type SelectionMode = 'replace' | 'add' | 'remove' | 'toggle';

/**
 * Hook for managing selection operations
 *
 * @returns Selection handlers and state
 */
export function useSelection() {
  const store = useCanvasStore();
  const [selectionBox, setSelectionBox] = useState<SelectionBox>({
    active: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
  });

  const isMouseDownRef = useRef(false);
  const canvasRef = useRef<HTMLElement | null>(null);

  /**
   * Get selection mode from keyboard modifiers
   *
   * @param event - Keyboard or mouse event
   * @returns Selection mode
   */
  const getSelectionMode = useCallback(
    (
      event: React.MouseEvent | React.KeyboardEvent | MouseEvent | KeyboardEvent
    ): SelectionMode => {
      if (event.ctrlKey || event.metaKey) {
        // Cmd/Ctrl: Toggle selection
        return 'toggle';
      }
      if (event.shiftKey) {
        // Shift: Add to selection
        return 'add';
      }
      if (event.altKey) {
        // Alt: Remove from selection
        return 'remove';
      }
      // Default: Replace selection
      return 'replace';
    },
    []
  );

  /**
   * Select a single node
   *
   * @param nodeId - Node ID to select
   * @param mode - Selection mode
   */
  const selectNode = useCallback(
    (nodeId: string, mode: SelectionMode = 'replace') => {
      const currentSelection = store.selectedNodes;

      switch (mode) {
        case 'replace':
          store.selectNode(nodeId);
          break;

        case 'add':
          if (!currentSelection.includes(nodeId)) {
            store.selectNodes([...currentSelection, nodeId]);
          }
          break;

        case 'remove':
          store.selectNodes(currentSelection.filter((id) => id !== nodeId));
          break;

        case 'toggle':
          if (currentSelection.includes(nodeId)) {
            store.selectNodes(currentSelection.filter((id) => id !== nodeId));
          } else {
            store.selectNodes([...currentSelection, nodeId]);
          }
          break;
      }
    },
    [store]
  );

  /**
   * Select multiple nodes
   *
   * @param nodeIds - Array of node IDs to select
   * @param mode - Selection mode
   */
  const selectNodes = useCallback(
    (nodeIds: string[], mode: SelectionMode = 'replace') => {
      const currentSelection = store.selectedNodes;

      switch (mode) {
        case 'replace':
          store.selectNodes(nodeIds);
          break;

        case 'add':
          const newSelection = new Set([...currentSelection, ...nodeIds]);
          store.selectNodes(Array.from(newSelection));
          break;

        case 'remove':
          const remaining = currentSelection.filter((id) => !nodeIds.includes(id));
          store.selectNodes(remaining);
          break;

        case 'toggle':
          const toggledSelection = [...currentSelection];
          nodeIds.forEach((id) => {
            const index = toggledSelection.indexOf(id);
            if (index >= 0) {
              toggledSelection.splice(index, 1);
            } else {
              toggledSelection.push(id);
            }
          });
          store.selectNodes(toggledSelection);
          break;
      }
    },
    [store]
  );

  /**
   * Select a single edge
   *
   * @param edgeId - Edge ID to select
   * @param mode - Selection mode
   */
  const selectEdge = useCallback(
    (edgeId: string, mode: SelectionMode = 'replace') => {
      const currentSelection = store.selectedEdges;

      switch (mode) {
        case 'replace':
          store.selectEdge(edgeId);
          break;

        case 'add':
          if (!currentSelection.includes(edgeId)) {
            store.selectEdges([...currentSelection, edgeId]);
          }
          break;

        case 'remove':
          store.selectEdges(currentSelection.filter((id) => id !== edgeId));
          break;

        case 'toggle':
          if (currentSelection.includes(edgeId)) {
            store.selectEdges(currentSelection.filter((id) => id !== edgeId));
          } else {
            store.selectEdges([...currentSelection, edgeId]);
          }
          break;
      }
    },
    [store]
  );

  /**
   * Select multiple edges
   *
   * @param edgeIds - Array of edge IDs to select
   * @param mode - Selection mode
   */
  const selectEdges = useCallback(
    (edgeIds: string[], mode: SelectionMode = 'replace') => {
      const currentSelection = store.selectedEdges;

      switch (mode) {
        case 'replace':
          store.selectEdges(edgeIds);
          break;

        case 'add':
          const newSelection = new Set([...currentSelection, ...edgeIds]);
          store.selectEdges(Array.from(newSelection));
          break;

        case 'remove':
          const remaining = currentSelection.filter((id) => !edgeIds.includes(id));
          store.selectEdges(remaining);
          break;

        case 'toggle':
          const toggledSelection = [...currentSelection];
          edgeIds.forEach((id) => {
            const index = toggledSelection.indexOf(id);
            if (index >= 0) {
              toggledSelection.splice(index, 1);
            } else {
              toggledSelection.push(id);
            }
          });
          store.selectEdges(toggledSelection);
          break;
      }
    },
    [store]
  );

  /**
   * Select all nodes and edges
   */
  const selectAll = useCallback(() => {
    const allNodeIds = store.nodes.map((node) => node.id);
    const allEdgeIds = store.edges.map((edge) => edge.id);

    store.selectNodes(allNodeIds);
    store.selectEdges(allEdgeIds);
  }, [store]);

  /**
   * Deselect all nodes and edges
   */
  const deselectAll = useCallback(() => {
    store.clearSelection();
  }, [store]);

  /**
   * Check if node is in selection box
   *
   * @param node - Node to check
   * @param box - Selection box
   * @returns True if node is in box
   */
  const isNodeInBox = useCallback(
    (node: Node<NodeData>, box: SelectionBox): boolean => {
      const minX = Math.min(box.startX, box.currentX);
      const maxX = Math.max(box.startX, box.currentX);
      const minY = Math.min(box.startY, box.currentY);
      const maxY = Math.max(box.startY, box.currentY);

      const nodeWidth = node.width || 200;
      const nodeHeight = node.height || 100;

      // Check if node overlaps with selection box
      const nodeRight = node.position.x + nodeWidth;
      const nodeBottom = node.position.y + nodeHeight;

      return (
        node.position.x <= maxX &&
        nodeRight >= minX &&
        node.position.y <= maxY &&
        nodeBottom >= minY
      );
    },
    []
  );

  /**
   * Start box selection
   *
   * @param event - Mouse event
   */
  const startBoxSelection = useCallback(
    (event: React.MouseEvent) => {
      // Only start box selection on background click (not on nodes/edges)
      if ((event.target as HTMLElement).classList.contains('react-flow__pane')) {
        isMouseDownRef.current = true;

        const rect = canvasRef.current?.getBoundingClientRect();
        const x = event.clientX - (rect?.left || 0);
        const y = event.clientY - (rect?.top || 0);

        setSelectionBox({
          active: true,
          startX: x,
          startY: y,
          currentX: x,
          currentY: y,
        });
      }
    },
    []
  );

  /**
   * Update box selection
   *
   * @param event - Mouse event
   */
  const updateBoxSelection = useCallback(
    (event: React.MouseEvent | MouseEvent) => {
      if (!isMouseDownRef.current || !selectionBox.active) return;

      const rect = canvasRef.current?.getBoundingClientRect();
      const x = event.clientX - (rect?.left || 0);
      const y = event.clientY - (rect?.top || 0);

      setSelectionBox((prev) => ({
        ...prev,
        currentX: x,
        currentY: y,
      }));

      // Update selection based on box
      const mode = getSelectionMode(event);
      const nodesInBox = store.nodes.filter((node) =>
        isNodeInBox(node, { ...selectionBox, currentX: x, currentY: y })
      );
      const nodeIds = nodesInBox.map((node) => node.id);

      selectNodes(nodeIds, mode);
    },
    [selectionBox, store.nodes, isNodeInBox, getSelectionMode, selectNodes]
  );

  /**
   * End box selection
   */
  const endBoxSelection = useCallback(() => {
    isMouseDownRef.current = false;
    setSelectionBox({
      active: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
    });
  }, []);

  /**
   * Handle node click with selection
   *
   * @param event - Mouse event
   * @param node - Clicked node
   */
  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: Node<NodeData>) => {
      event.stopPropagation();
      const mode = getSelectionMode(event);
      selectNode(node.id, mode);
    },
    [getSelectionMode, selectNode]
  );

  /**
   * Handle edge click with selection
   *
   * @param event - Mouse event
   * @param edge - Clicked edge
   */
  const handleEdgeClick = useCallback(
    (event: React.MouseEvent, edge: Edge<EdgeData>) => {
      event.stopPropagation();
      const mode = getSelectionMode(event);
      selectEdge(edge.id, mode);
    },
    [getSelectionMode, selectEdge]
  );

  /**
   * Handle canvas click (deselect)
   *
   * @param event - Mouse event
   */
  const handlePaneClick = useCallback(
    (event: React.MouseEvent) => {
      if (!event.ctrlKey && !event.metaKey && !event.shiftKey) {
        deselectAll();
      }
    },
    [deselectAll]
  );

  /**
   * Set canvas ref for box selection
   *
   * @param ref - Canvas element ref
   */
  const setCanvasRef = useCallback((ref: HTMLElement | null) => {
    canvasRef.current = ref;
  }, []);

  // Global mouse handlers for box selection
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (isMouseDownRef.current && selectionBox.active) {
        updateBoxSelection(event);
      }
    };

    const handleMouseUp = () => {
      if (isMouseDownRef.current) {
        endBoxSelection();
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [selectionBox.active, updateBoxSelection, endBoxSelection]);

  return {
    // State
    selectionBox,
    selectedNodes: store.selectedNodes,
    selectedEdges: store.selectedEdges,

    // Selection methods
    selectNode,
    selectNodes,
    selectEdge,
    selectEdges,
    selectAll,
    deselectAll,

    // Box selection
    startBoxSelection,
    updateBoxSelection,
    endBoxSelection,

    // Event handlers
    handleNodeClick,
    handleEdgeClick,
    handlePaneClick,

    // Utilities
    setCanvasRef,
    getSelectionMode,
    isNodeInBox,
  };
}

/**
 * Get box selection dimensions
 *
 * @param box - Selection box
 * @returns Box dimensions and position
 */
export function getSelectionBoxDimensions(box: SelectionBox): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const x = Math.min(box.startX, box.currentX);
  const y = Math.min(box.startY, box.currentY);
  const width = Math.abs(box.currentX - box.startX);
  const height = Math.abs(box.currentY - box.startY);

  return { x, y, width, height };
}
