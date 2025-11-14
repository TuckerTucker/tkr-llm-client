/**
 * Canvas Store
 *
 * Zustand store for managing ReactFlow canvas state including nodes, edges,
 * viewport, selection, and undo/redo functionality.
 *
 * @module lib/state/canvas-store
 * @version 1.0.0
 * @author State Management Engineer (Agent 3) / Canvas Engineer (Agent 6)
 */

import { create } from 'zustand';
import { Node, Edge } from '../types/reactflow';
import { NodeData, EdgeData } from '../types/ui-types';

/**
 * Viewport state
 */
export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

/**
 * History state for undo/redo
 */
interface HistoryState {
  nodes: Node<NodeData>[];
  edges: Edge<EdgeData>[];
}

/**
 * Canvas state interface
 */
export interface CanvasState {
  // Core state
  nodes: Node<NodeData>[];
  edges: Edge<EdgeData>[];
  selectedNodes: string[];
  selectedEdges: string[];
  viewport: Viewport;

  // History
  history: HistoryState[];
  historyIndex: number;

  // Node operations
  addNode: (node: Node<NodeData>) => void;
  addNodes: (nodes: Node<NodeData>[]) => void;
  updateNode: (id: string, data: Partial<Node<NodeData>>) => void;
  removeNode: (id: string) => void;
  removeNodes: (ids: string[]) => void;
  getNodeById: (id: string) => Node<NodeData> | undefined;
  getNodesByType: (type: string) => Node<NodeData>[];

  // Edge operations
  addEdge: (edge: Edge<EdgeData>) => void;
  addEdges: (edges: Edge<EdgeData>[]) => void;
  updateEdge: (id: string, data: Partial<Edge<EdgeData>>) => void;
  removeEdge: (id: string) => void;
  removeEdges: (ids: string[]) => void;
  getEdgeById: (id: string) => Edge<EdgeData> | undefined;

  // Selection operations
  selectNode: (id: string) => void;
  selectNodes: (ids: string[]) => void;
  selectEdge: (id: string) => void;
  selectEdges: (ids: string[]) => void;
  clearSelection: () => void;

  // Viewport operations
  setViewport: (viewport: Viewport) => void;
  resetViewport: () => void;
  fitView: () => void;

  // History operations
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  pushHistory: () => void;

  // Batch operations
  setNodes: (nodes: Node<NodeData>[]) => void;
  setEdges: (edges: Edge<EdgeData>[]) => void;
  reset: () => void;
}

const DEFAULT_VIEWPORT: Viewport = { x: 0, y: 0, zoom: 1 };
const MAX_HISTORY = 50;

/**
 * Create canvas store
 */
export const useCanvasStore = create<CanvasState>((set, get) => ({
  // Initial state
  nodes: [],
  edges: [],
  selectedNodes: [],
  selectedEdges: [],
  viewport: DEFAULT_VIEWPORT,
  history: [],
  historyIndex: -1,

  // Node operations
  addNode: (node) =>
    set((state) => {
      const newState = { nodes: [...state.nodes, node] };
      return newState;
    }),

  addNodes: (nodes) =>
    set((state) => {
      const newState = { nodes: [...state.nodes, ...nodes] };
      return newState;
    }),

  updateNode: (id, data) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, ...data } : node
      ),
    })),

  removeNode: (id) =>
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== id),
      edges: state.edges.filter((edge) => edge.source !== id && edge.target !== id),
      selectedNodes: state.selectedNodes.filter((nodeId) => nodeId !== id),
    })),

  removeNodes: (ids) =>
    set((state) => {
      const idSet = new Set(ids);
      return {
        nodes: state.nodes.filter((node) => !idSet.has(node.id)),
        edges: state.edges.filter(
          (edge) => !idSet.has(edge.source) && !idSet.has(edge.target)
        ),
        selectedNodes: state.selectedNodes.filter((id) => !idSet.has(id)),
      };
    }),

  getNodeById: (id) => get().nodes.find((node) => node.id === id),

  getNodesByType: (type) => get().nodes.filter((node) => node.type === type),

  // Edge operations
  addEdge: (edge) =>
    set((state) => ({
      edges: [...state.edges, edge],
    })),

  addEdges: (edges) =>
    set((state) => ({
      edges: [...state.edges, ...edges],
    })),

  updateEdge: (id, data) =>
    set((state) => ({
      edges: state.edges.map((edge) =>
        edge.id === id ? { ...edge, ...data } : edge
      ),
    })),

  removeEdge: (id) =>
    set((state) => ({
      edges: state.edges.filter((edge) => edge.id !== id),
      selectedEdges: state.selectedEdges.filter((edgeId) => edgeId !== id),
    })),

  removeEdges: (ids) =>
    set((state) => {
      const idSet = new Set(ids);
      return {
        edges: state.edges.filter((edge) => !idSet.has(edge.id)),
        selectedEdges: state.selectedEdges.filter((id) => !idSet.has(id)),
      };
    }),

  getEdgeById: (id) => get().edges.find((edge) => edge.id === id),

  // Selection operations
  selectNode: (id) =>
    set((state) => ({
      selectedNodes: [id],
      nodes: state.nodes.map((node) => ({
        ...node,
        selected: node.id === id,
      })),
    })),

  selectNodes: (ids) =>
    set((state) => {
      const idSet = new Set(ids);
      return {
        selectedNodes: ids,
        nodes: state.nodes.map((node) => ({
          ...node,
          selected: idSet.has(node.id),
        })),
      };
    }),

  selectEdge: (id) =>
    set((state) => ({
      selectedEdges: [id],
      edges: state.edges.map((edge) => ({
        ...edge,
        selected: edge.id === id,
      })),
    })),

  selectEdges: (ids) =>
    set((state) => {
      const idSet = new Set(ids);
      return {
        selectedEdges: ids,
        edges: state.edges.map((edge) => ({
          ...edge,
          selected: idSet.has(edge.id),
        })),
      };
    }),

  clearSelection: () =>
    set((state) => ({
      selectedNodes: [],
      selectedEdges: [],
      nodes: state.nodes.map((node) => ({ ...node, selected: false })),
      edges: state.edges.map((edge) => ({ ...edge, selected: false })),
    })),

  // Viewport operations
  setViewport: (viewport) =>
    set({
      viewport,
    }),

  resetViewport: () =>
    set({
      viewport: DEFAULT_VIEWPORT,
    }),

  fitView: () => {
    // This will be connected to ReactFlow's fitView in the Canvas component
    set({
      viewport: DEFAULT_VIEWPORT,
    });
  },

  // History operations
  pushHistory: () =>
    set((state) => {
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push({
        nodes: state.nodes,
        edges: state.edges,
      });

      // Keep only last MAX_HISTORY states
      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift();
      }

      return {
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    }),

  undo: () =>
    set((state) => {
      if (state.historyIndex <= 0) return state;

      const previousState = state.history[state.historyIndex - 1];
      return {
        ...state,
        nodes: previousState.nodes,
        edges: previousState.edges,
        historyIndex: state.historyIndex - 1,
      };
    }),

  redo: () =>
    set((state) => {
      if (state.historyIndex >= state.history.length - 1) return state;

      const nextState = state.history[state.historyIndex + 1];
      return {
        ...state,
        nodes: nextState.nodes,
        edges: nextState.edges,
        historyIndex: state.historyIndex + 1,
      };
    }),

  canUndo: () => get().historyIndex > 0,

  canRedo: () => get().historyIndex < get().history.length - 1,

  // Batch operations
  setNodes: (nodes) =>
    set({
      nodes,
    }),

  setEdges: (edges) =>
    set({
      edges,
    }),

  reset: () =>
    set({
      nodes: [],
      edges: [],
      selectedNodes: [],
      selectedEdges: [],
      viewport: DEFAULT_VIEWPORT,
      history: [],
      historyIndex: -1,
    }),
}));
