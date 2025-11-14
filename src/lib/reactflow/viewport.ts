/**
 * Viewport Control Utilities
 *
 * Utilities for controlling the ReactFlow viewport including zoom, pan, and fit view.
 *
 * @module lib/reactflow/viewport
 * @version 1.0.0
 * @author Canvas & ReactFlow Integration (Agent 6)
 */

import { useCanvasStore, Viewport } from '../state/canvas-store';
import { Node } from '../types/reactflow';
import { NodeData } from '../types/ui-types';

/**
 * Zoom levels
 */
export const ZOOM_LEVELS = {
  MIN: 0.1,
  MAX: 2.0,
  DEFAULT: 1.0,
  STEP: 0.1,
};

/**
 * Zoom in
 *
 * Increases zoom by ZOOM_STEP, up to MAX zoom
 */
export function zoomIn(): void {
  const store = useCanvasStore.getState();
  const currentZoom = store.viewport.zoom;
  const newZoom = Math.min(currentZoom + ZOOM_LEVELS.STEP, ZOOM_LEVELS.MAX);

  store.setViewport({
    ...store.viewport,
    zoom: newZoom,
  });
}

/**
 * Zoom out
 *
 * Decreases zoom by ZOOM_STEP, down to MIN zoom
 */
export function zoomOut(): void {
  const store = useCanvasStore.getState();
  const currentZoom = store.viewport.zoom;
  const newZoom = Math.max(currentZoom - ZOOM_LEVELS.STEP, ZOOM_LEVELS.MIN);

  store.setViewport({
    ...store.viewport,
    zoom: newZoom,
  });
}

/**
 * Set zoom to specific level
 *
 * @param zoom - Zoom level (will be clamped to MIN-MAX range)
 */
export function setZoom(zoom: number): void {
  const store = useCanvasStore.getState();
  const clampedZoom = Math.max(
    ZOOM_LEVELS.MIN,
    Math.min(zoom, ZOOM_LEVELS.MAX)
  );

  store.setViewport({
    ...store.viewport,
    zoom: clampedZoom,
  });
}

/**
 * Reset zoom to default (1.0)
 */
export function resetZoom(): void {
  const store = useCanvasStore.getState();

  store.setViewport({
    ...store.viewport,
    zoom: ZOOM_LEVELS.DEFAULT,
  });
}

/**
 * Pan viewport by delta
 *
 * @param dx - Delta X
 * @param dy - Delta Y
 */
export function panBy(dx: number, dy: number): void {
  const store = useCanvasStore.getState();

  store.setViewport({
    ...store.viewport,
    x: store.viewport.x + dx,
    y: store.viewport.y + dy,
  });
}

/**
 * Pan viewport to specific position
 *
 * @param x - X position
 * @param y - Y position
 */
export function panTo(x: number, y: number): void {
  const store = useCanvasStore.getState();

  store.setViewport({
    ...store.viewport,
    x,
    y,
  });
}

/**
 * Reset pan to center (0, 0)
 */
export function resetPan(): void {
  const store = useCanvasStore.getState();

  store.setViewport({
    ...store.viewport,
    x: 0,
    y: 0,
  });
}

/**
 * Calculate bounds for all nodes
 *
 * @param nodes - Nodes to calculate bounds for
 * @returns Bounding box { minX, minY, maxX, maxY }
 */
export function calculateNodeBounds(nodes: Node<NodeData>[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  if (nodes.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  nodes.forEach((node) => {
    const { x, y } = node.position;
    const width = node.width || 200; // Default width
    const height = node.height || 150; // Default height

    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + width);
    maxY = Math.max(maxY, y + height);
  });

  return { minX, minY, maxX, maxY };
}

/**
 * Fit view to show all nodes
 *
 * Calculates viewport to fit all nodes with padding
 *
 * @param options - Options for fit view
 * @param options.padding - Padding around nodes (default: 50)
 * @param options.maxZoom - Maximum zoom level (default: 1.5)
 * @param options.duration - Animation duration in ms (default: 0 - no animation)
 * @returns New viewport
 */
export function fitViewToNodes(options?: {
  padding?: number;
  maxZoom?: number;
  duration?: number;
}): Viewport {
  const { padding = 50, maxZoom = 1.5 } = options || {};

  const store = useCanvasStore.getState();
  const nodes = store.nodes;

  if (nodes.length === 0) {
    return store.viewport;
  }

  const bounds = calculateNodeBounds(nodes);

  // Assume canvas size (this would be passed from Canvas component in real impl)
  const canvasWidth = 1200;
  const canvasHeight = 800;

  const boundsWidth = bounds.maxX - bounds.minX;
  const boundsHeight = bounds.maxY - bounds.minY;

  // Calculate zoom to fit all nodes
  const zoomX = (canvasWidth - padding * 2) / boundsWidth;
  const zoomY = (canvasHeight - padding * 2) / boundsHeight;
  const zoom = Math.min(
    Math.min(zoomX, zoomY),
    maxZoom,
    ZOOM_LEVELS.MAX
  );

  // Calculate center position
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;

  const x = canvasWidth / 2 - centerX * zoom;
  const y = canvasHeight / 2 - centerY * zoom;

  const newViewport: Viewport = { x, y, zoom };

  store.setViewport(newViewport);

  return newViewport;
}

/**
 * Center view on specific node
 *
 * @param nodeId - Node ID to center on
 * @param options - Options
 * @param options.zoom - Zoom level (default: keep current)
 * @param options.duration - Animation duration in ms (default: 0)
 */
export function centerOnNode(
  nodeId: string,
  options?: { zoom?: number; duration?: number }
): void {
  const store = useCanvasStore.getState();
  const node = store.getNodeById(nodeId);

  if (!node) {
    console.warn(`Node ${nodeId} not found`);
    return;
  }

  const { zoom } = options || {};

  // Assume canvas size (this would be passed from Canvas component)
  const canvasWidth = 1200;
  const canvasHeight = 800;

  const nodeWidth = node.width || 200;
  const nodeHeight = node.height || 150;

  const nodeCenterX = node.position.x + nodeWidth / 2;
  const nodeCenterY = node.position.y + nodeHeight / 2;

  const currentZoom = zoom !== undefined ? zoom : store.viewport.zoom;

  const x = canvasWidth / 2 - nodeCenterX * currentZoom;
  const y = canvasHeight / 2 - nodeCenterY * currentZoom;

  store.setViewport({
    x,
    y,
    zoom: currentZoom,
  });
}

/**
 * Center view on selected nodes
 *
 * @param options - Options
 * @param options.padding - Padding around selection (default: 50)
 * @param options.maxZoom - Maximum zoom level (default: 1.5)
 */
export function centerOnSelection(options?: {
  padding?: number;
  maxZoom?: number;
}): void {
  const store = useCanvasStore.getState();
  const selectedNodeIds = store.selectedNodes;

  if (selectedNodeIds.length === 0) {
    console.warn('No nodes selected');
    return;
  }

  const selectedNodes = selectedNodeIds
    .map((id) => store.getNodeById(id))
    .filter((node): node is Node<NodeData> => node !== undefined);

  if (selectedNodes.length === 0) {
    return;
  }

  // Calculate bounds for selected nodes
  const bounds = calculateNodeBounds(selectedNodes);

  const { padding = 50, maxZoom = 1.5 } = options || {};

  // Assume canvas size
  const canvasWidth = 1200;
  const canvasHeight = 800;

  const boundsWidth = bounds.maxX - bounds.minX;
  const boundsHeight = bounds.maxY - bounds.minY;

  // Calculate zoom
  const zoomX = (canvasWidth - padding * 2) / boundsWidth;
  const zoomY = (canvasHeight - padding * 2) / boundsHeight;
  const zoom = Math.min(
    Math.min(zoomX, zoomY),
    maxZoom,
    ZOOM_LEVELS.MAX
  );

  // Calculate center
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;

  const x = canvasWidth / 2 - centerX * zoom;
  const y = canvasHeight / 2 - centerY * zoom;

  store.setViewport({ x, y, zoom });
}

/**
 * Get current zoom level as percentage
 *
 * @returns Zoom percentage (e.g., "100%" for 1.0 zoom)
 */
export function getZoomPercentage(): string {
  const store = useCanvasStore.getState();
  const percentage = Math.round(store.viewport.zoom * 100);
  return `${percentage}%`;
}
