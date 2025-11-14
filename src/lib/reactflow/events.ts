/**
 * ReactFlow Event Handlers
 *
 * Event handlers for ReactFlow canvas interactions including node changes,
 * edge changes, connections, and user interactions.
 *
 * @module lib/reactflow/events
 * @version 1.0.0
 * @author Canvas & ReactFlow Integration (Agent 6)
 */

import { Node, Edge } from '../types/reactflow';
import { NodeData, EdgeData } from '../types/ui-types';
import { useCanvasStore } from '../state/canvas-store';

/**
 * Node change event types
 */
export type NodeChange =
  | { type: 'add'; item: Node<NodeData> }
  | { type: 'remove'; id: string }
  | { type: 'position'; id: string; position: { x: number; y: number } }
  | { type: 'dimensions'; id: string; dimensions: { width: number; height: number } }
  | { type: 'select'; id: string; selected: boolean };

/**
 * Edge change event types
 */
export type EdgeChange =
  | { type: 'add'; item: Edge<EdgeData> }
  | { type: 'remove'; id: string }
  | { type: 'select'; id: string; selected: boolean };

/**
 * Connection params for new edges
 */
export interface Connection {
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
}

/**
 * Handle node changes from ReactFlow
 *
 * @param changes - Array of node changes
 */
export function handleNodesChange(changes: NodeChange[]): void {
  const store = useCanvasStore.getState();

  changes.forEach((change) => {
    switch (change.type) {
      case 'add':
        store.addNode(change.item);
        break;

      case 'remove':
        store.removeNode(change.id);
        break;

      case 'position':
        store.updateNode(change.id, { position: change.position });
        break;

      case 'dimensions':
        store.updateNode(change.id, {
          width: change.dimensions.width,
          height: change.dimensions.height,
        });
        break;

      case 'select':
        if (change.selected) {
          const currentSelection = store.selectedNodes;
          if (!currentSelection.includes(change.id)) {
            store.selectNodes([...currentSelection, change.id]);
          }
        } else {
          store.selectNodes(
            store.selectedNodes.filter((id) => id !== change.id)
          );
        }
        break;
    }
  });
}

/**
 * Handle edge changes from ReactFlow
 *
 * @param changes - Array of edge changes
 */
export function handleEdgesChange(changes: EdgeChange[]): void {
  const store = useCanvasStore.getState();

  changes.forEach((change) => {
    switch (change.type) {
      case 'add':
        store.addEdge(change.item);
        break;

      case 'remove':
        store.removeEdge(change.id);
        break;

      case 'select':
        if (change.selected) {
          const currentSelection = store.selectedEdges;
          if (!currentSelection.includes(change.id)) {
            store.selectEdges([...currentSelection, change.id]);
          }
        } else {
          store.selectEdges(
            store.selectedEdges.filter((id) => id !== change.id)
          );
        }
        break;
    }
  });
}

/**
 * Validate if a connection is allowed
 *
 * Prevents:
 * - Self-connections
 * - Duplicate connections
 * - Invalid type connections (based on handle types)
 *
 * @param connection - The proposed connection
 * @returns true if connection is valid
 */
export function isValidConnection(connection: Connection): boolean {
  const { source, target } = connection;

  // Prevent self-connections
  if (source === target) {
    return false;
  }

  // Check for duplicate connections
  const store = useCanvasStore.getState();
  const existingEdge = store.edges.find(
    (edge) =>
      edge.source === source &&
      edge.target === target &&
      edge.sourceHandle === connection.sourceHandle &&
      edge.targetHandle === connection.targetHandle
  );

  if (existingEdge) {
    return false;
  }

  // Get source and target nodes
  const sourceNode = store.getNodeById(source);
  const targetNode = store.getNodeById(target);

  if (!sourceNode || !targetNode) {
    return false;
  }

  // Validate connection types
  // Templates can extend other templates
  if (sourceNode.data.type === 'template' && targetNode.data.type === 'template') {
    return true;
  }

  // Templates can include fragments
  if (sourceNode.data.type === 'template' && targetNode.data.type === 'fragment') {
    return true;
  }

  // Templates can reference tool configs
  if (sourceNode.data.type === 'template' && targetNode.data.type === 'toolConfig') {
    return true;
  }

  // Templates can use variables
  if (sourceNode.data.type === 'template' && targetNode.data.type === 'variable') {
    return true;
  }

  // Tool configs can include other tool configs (bundles)
  if (sourceNode.data.type === 'toolConfig' && targetNode.data.type === 'toolConfig') {
    return true;
  }

  // Default: allow connection
  return true;
}

/**
 * Handle new connection
 *
 * Creates a new edge when user connects two nodes
 *
 * @param connection - The new connection params
 */
export function handleConnect(connection: Connection): void {
  if (!isValidConnection(connection)) {
    console.warn('Invalid connection attempted:', connection);
    return;
  }

  const store = useCanvasStore.getState();
  const sourceNode = store.getNodeById(connection.source);
  const targetNode = store.getNodeById(connection.target);

  if (!sourceNode || !targetNode) {
    return;
  }

  // Determine edge type based on node types
  let edgeType = 'default';
  let animated = false;

  if (sourceNode.data.type === 'template' && targetNode.data.type === 'template') {
    edgeType = 'extends';
  } else if (sourceNode.data.type === 'template' && targetNode.data.type === 'fragment') {
    edgeType = 'mixin';
    animated = true;
  } else if (sourceNode.data.type === 'template' && targetNode.data.type === 'variable') {
    edgeType = 'variable';
  } else if (sourceNode.data.type === 'template' && targetNode.data.type === 'toolConfig') {
    edgeType = 'toolRef';
  }

  const newEdge: Edge<EdgeData> = {
    id: `edge-${connection.source}-${connection.target}-${Date.now()}`,
    source: connection.source,
    target: connection.target,
    sourceHandle: connection.sourceHandle || undefined,
    targetHandle: connection.targetHandle || undefined,
    type: edgeType,
    animated,
    data: {
      id: `edge-${connection.source}-${connection.target}-${Date.now()}`,
      type: edgeType as any,
      metadata: {},
    },
  };

  store.addEdge(newEdge);
  store.pushHistory();
}

/**
 * Handle node click
 *
 * @param event - Mouse event
 * @param node - The clicked node
 */
export function handleNodeClick(
  event: React.MouseEvent,
  node: Node<NodeData>
): void {
  const store = useCanvasStore.getState();

  if (event.ctrlKey || event.metaKey) {
    // Multi-select
    const currentSelection = store.selectedNodes;
    if (currentSelection.includes(node.id)) {
      store.selectNodes(currentSelection.filter((id) => id !== node.id));
    } else {
      store.selectNodes([...currentSelection, node.id]);
    }
  } else {
    // Single select
    store.selectNode(node.id);
  }
}

/**
 * Handle node drag end
 *
 * @param event - Mouse event
 * @param node - The dragged node
 */
export function handleNodeDragEnd(
  _event: React.MouseEvent,
  _node: Node<NodeData>
): void {
  const store = useCanvasStore.getState();
  store.pushHistory();
}

/**
 * Handle edge click
 *
 * @param event - Mouse event
 * @param edge - The clicked edge
 */
export function handleEdgeClick(
  event: React.MouseEvent,
  edge: Edge<EdgeData>
): void {
  const store = useCanvasStore.getState();

  if (event.ctrlKey || event.metaKey) {
    // Multi-select
    const currentSelection = store.selectedEdges;
    if (currentSelection.includes(edge.id)) {
      store.selectEdges(currentSelection.filter((id) => id !== edge.id));
    } else {
      store.selectEdges([...currentSelection, edge.id]);
    }
  } else {
    // Single select
    store.selectEdge(edge.id);
  }
}

/**
 * Handle canvas click (background click)
 *
 * Clears selection when clicking on empty canvas
 *
 * @param event - Mouse event
 */
export function handlePaneClick(_event: React.MouseEvent): void {
  const store = useCanvasStore.getState();
  store.clearSelection();
}

/**
 * Handle viewport change
 *
 * @param viewport - New viewport state
 */
export function handleViewportChange(viewport: {
  x: number;
  y: number;
  zoom: number;
}): void {
  const store = useCanvasStore.getState();
  store.setViewport(viewport);
}
