/**
 * useCanvas Hook
 *
 * Convenience hook for accessing canvas state and actions in UI components.
 * Wraps the Zustand canvas store with a clean, intuitive API.
 *
 * @module ui/hooks/useCanvas
 * @version 1.0.0
 * @author State Management Integration Engineer (Agent 4, Wave 1)
 */

import { useCanvasStore } from '../store';

/**
 * Canvas hook for UI components
 *
 * Provides access to canvas state and actions with optimized selectors.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { nodes, edges, addNode, undo, redo, canUndo, canRedo } = useCanvas();
 *
 *   const handleAddNode = () => {
 *     addNode({
 *       id: 'node-1',
 *       type: 'template',
 *       position: { x: 100, y: 100 },
 *       data: { label: 'New Node' },
 *     });
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={handleAddNode}>Add Node</button>
 *       <button onClick={undo} disabled={!canUndo}>Undo</button>
 *       <button onClick={redo} disabled={!canRedo}>Redo</button>
 *     </div>
 *   );
 * }
 * ```
 *
 * @returns Canvas state and actions
 */
export function useCanvas() {
  // Subscribe to state slices
  const nodes = useCanvasStore((state) => state.nodes);
  const edges = useCanvasStore((state) => state.edges);
  const selectedNodes = useCanvasStore((state) => state.selectedNodes);
  const selectedEdges = useCanvasStore((state) => state.selectedEdges);
  const viewport = useCanvasStore((state) => state.viewport);

  // Node operations
  const addNode = useCanvasStore((state) => state.addNode);
  const addNodes = useCanvasStore((state) => state.addNodes);
  const updateNode = useCanvasStore((state) => state.updateNode);
  const removeNode = useCanvasStore((state) => state.removeNode);
  const removeNodes = useCanvasStore((state) => state.removeNodes);
  const getNodeById = useCanvasStore((state) => state.getNodeById);
  const getNodesByType = useCanvasStore((state) => state.getNodesByType);

  // Edge operations
  const addEdge = useCanvasStore((state) => state.addEdge);
  const addEdges = useCanvasStore((state) => state.addEdges);
  const updateEdge = useCanvasStore((state) => state.updateEdge);
  const removeEdge = useCanvasStore((state) => state.removeEdge);
  const removeEdges = useCanvasStore((state) => state.removeEdges);
  const getEdgeById = useCanvasStore((state) => state.getEdgeById);

  // Selection operations
  const selectNode = useCanvasStore((state) => state.selectNode);
  const selectNodes = useCanvasStore((state) => state.selectNodes);
  const selectEdge = useCanvasStore((state) => state.selectEdge);
  const selectEdges = useCanvasStore((state) => state.selectEdges);
  const clearSelection = useCanvasStore((state) => state.clearSelection);

  // Viewport operations
  const setViewport = useCanvasStore((state) => state.setViewport);
  const resetViewport = useCanvasStore((state) => state.resetViewport);
  const fitView = useCanvasStore((state) => state.fitView);

  // Batch operations
  const setNodes = useCanvasStore((state) => state.setNodes);
  const setEdges = useCanvasStore((state) => state.setEdges);
  const reset = useCanvasStore((state) => state.reset);

  // History operations
  const undo = useCanvasStore((state) => state.undo);
  const redo = useCanvasStore((state) => state.redo);
  const canUndo = useCanvasStore((state) => state.canUndo);
  const canRedo = useCanvasStore((state) => state.canRedo);
  const pushHistory = useCanvasStore((state) => state.pushHistory);

  return {
    // State
    nodes,
    edges,
    selectedNodes,
    selectedEdges,
    viewport,

    // Node operations
    addNode,
    addNodes,
    updateNode,
    removeNode,
    removeNodes,
    getNodeById,
    getNodesByType,

    // Edge operations
    addEdge,
    addEdges,
    updateEdge,
    removeEdge,
    removeEdges,
    getEdgeById,

    // Selection operations
    selectNode,
    selectNodes,
    selectEdge,
    selectEdges,
    clearSelection,

    // Viewport operations
    setViewport,
    resetViewport,
    fitView,

    // Batch operations
    setNodes,
    setEdges,
    reset,

    // History operations
    undo,
    redo,
    canUndo: canUndo(),
    canRedo: canRedo(),
    pushHistory,
  };
}

/**
 * Hook for history state only
 *
 * Optimized hook that only subscribes to history-related state.
 * Use this when you only need undo/redo functionality.
 *
 * @example
 * ```tsx
 * function UndoButton() {
 *   const { undo, canUndo } = useCanvasHistory();
 *   return <button onClick={undo} disabled={!canUndo}>Undo</button>;
 * }
 * ```
 */
export function useCanvasHistory() {
  const undo = useCanvasStore((state) => state.undo);
  const redo = useCanvasStore((state) => state.redo);
  const canUndo = useCanvasStore((state) => state.canUndo);
  const canRedo = useCanvasStore((state) => state.canRedo);
  const historyIndex = useCanvasStore((state) => state.historyIndex);
  const historyLength = useCanvasStore((state) => state.history.length);

  return {
    undo,
    redo,
    canUndo: canUndo(),
    canRedo: canRedo(),
    historyIndex,
    historyLength,
  };
}

/**
 * Hook for selection state only
 *
 * Optimized hook that only subscribes to selection-related state.
 *
 * @example
 * ```tsx
 * function SelectionInfo() {
 *   const { selectedNodes, selectedEdges, clearSelection } = useCanvasSelection();
 *   return (
 *     <div>
 *       Selected: {selectedNodes.length} nodes, {selectedEdges.length} edges
 *       <button onClick={clearSelection}>Clear</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useCanvasSelection() {
  const selectedNodes = useCanvasStore((state) => state.selectedNodes);
  const selectedEdges = useCanvasStore((state) => state.selectedEdges);
  const selectNode = useCanvasStore((state) => state.selectNode);
  const selectNodes = useCanvasStore((state) => state.selectNodes);
  const selectEdge = useCanvasStore((state) => state.selectEdge);
  const selectEdges = useCanvasStore((state) => state.selectEdges);
  const clearSelection = useCanvasStore((state) => state.clearSelection);

  return {
    selectedNodes,
    selectedEdges,
    selectNode,
    selectNodes,
    selectEdge,
    selectEdges,
    clearSelection,
  };
}

/**
 * Hook for viewport state only
 *
 * Optimized hook that only subscribes to viewport-related state.
 *
 * @example
 * ```tsx
 * function ViewportControls() {
 *   const { viewport, setViewport, resetViewport } = useCanvasViewport();
 *   return (
 *     <div>
 *       Zoom: {viewport.zoom}
 *       <button onClick={resetViewport}>Reset View</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useCanvasViewport() {
  const viewport = useCanvasStore((state) => state.viewport);
  const setViewport = useCanvasStore((state) => state.setViewport);
  const resetViewport = useCanvasStore((state) => state.resetViewport);
  const fitView = useCanvasStore((state) => state.fitView);

  return {
    viewport,
    setViewport,
    resetViewport,
    fitView,
  };
}
