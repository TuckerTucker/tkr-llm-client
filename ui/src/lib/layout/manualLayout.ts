/**
 * Manual Layout Algorithm
 *
 * Preserves user-defined node positions without modification.
 * Best for maintaining custom layouts or when users have manually arranged nodes.
 *
 * @module lib/layout/manualLayout
 * @version 1.0.0
 * @author Layout System Engineer (Agent 2+)
 */

import type { Node, Edge } from 'reactflow';

export interface ManualLayoutOptions {
  /** Ensure minimum spacing between nodes */
  enforceMinSpacing?: boolean;

  /** Minimum spacing in pixels */
  minSpacing?: number;

  /** Snap nodes to grid */
  snapToGrid?: boolean;

  /** Grid size in pixels */
  gridSize?: number;
}

const DEFAULT_OPTIONS: Required<ManualLayoutOptions> = {
  enforceMinSpacing: false,
  minSpacing: 50,
  snapToGrid: false,
  gridSize: 20,
};

/**
 * Apply manual layout (preserve positions)
 *
 * Performance target: < 1ms
 *
 * This "layout" algorithm is very fast as it preserves existing positions.
 * Optionally applies constraints like grid snapping or minimum spacing.
 *
 * @param nodes - Input nodes
 * @param edges - Input edges (unused but kept for interface consistency)
 * @param options - Layout options
 * @returns Nodes with preserved or constrained positions
 */
export function applyManualLayout(
  nodes: Node[],
  edges: Edge[],
  options: ManualLayoutOptions = {}
): Node[] {
  const startTime = performance.now();
  const opts = { ...DEFAULT_OPTIONS, ...options };

  if (nodes.length === 0) return [];

  let processedNodes = [...nodes];

  // Apply grid snapping if enabled
  if (opts.snapToGrid) {
    processedNodes = processedNodes.map((node) => ({
      ...node,
      position: {
        x: Math.round(node.position.x / opts.gridSize) * opts.gridSize,
        y: Math.round(node.position.y / opts.gridSize) * opts.gridSize,
      },
    }));
  }

  // Enforce minimum spacing if enabled
  if (opts.enforceMinSpacing) {
    processedNodes = enforceSpacing(processedNodes, opts.minSpacing);
  }

  // Add transition style for smooth animation (even though positions don't change much)
  const layoutedNodes = processedNodes.map((node) => ({
    ...node,
    style: {
      ...node.style,
      transition: 'all 0.3s ease-in-out',
    },
  }));

  const duration = performance.now() - startTime;

  // Log performance warning if too slow (should be nearly instant)
  if (duration > 1) {
    console.warn(`Manual layout took ${duration.toFixed(2)}ms (target: <1ms)`);
  }

  return layoutedNodes;
}

/**
 * Enforce minimum spacing between nodes
 *
 * Uses a simple collision detection and resolution algorithm.
 */
function enforceSpacing(nodes: Node[], minSpacing: number): Node[] {
  const result = [...nodes];
  const nodeRadius = 125; // Approximate node radius

  // Check each pair of nodes for overlap
  for (let i = 0; i < result.length; i++) {
    for (let j = i + 1; j < result.length; j++) {
      const nodeA = result[i];
      const nodeB = result[j];

      const dx = nodeB.position.x - nodeA.position.x;
      const dy = nodeB.position.y - nodeA.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      const minDistance = nodeRadius * 2 + minSpacing;

      if (distance < minDistance && distance > 0) {
        // Nodes are too close, push them apart
        const overlap = minDistance - distance;
        const angle = Math.atan2(dy, dx);

        // Move both nodes away from each other
        const moveDistance = overlap / 2;

        result[i] = {
          ...nodeA,
          position: {
            x: nodeA.position.x - moveDistance * Math.cos(angle),
            y: nodeA.position.y - moveDistance * Math.sin(angle),
          },
        };

        result[j] = {
          ...nodeB,
          position: {
            x: nodeB.position.x + moveDistance * Math.cos(angle),
            y: nodeB.position.y + moveDistance * Math.sin(angle),
          },
        };
      }
    }
  }

  return result;
}

/**
 * Snap node positions to grid
 *
 * @param nodes - Input nodes
 * @param gridSize - Grid size in pixels
 * @returns Nodes with grid-snapped positions
 */
export function snapNodesToGrid(nodes: Node[], gridSize: number = 20): Node[] {
  return nodes.map((node) => ({
    ...node,
    position: {
      x: Math.round(node.position.x / gridSize) * gridSize,
      y: Math.round(node.position.y / gridSize) * gridSize,
    },
  }));
}

/**
 * Check if nodes have custom positions (not all at origin)
 *
 * @param nodes - Input nodes
 * @returns True if nodes appear to have custom positions
 */
export function hasCustomPositions(nodes: Node[]): boolean {
  if (nodes.length === 0) return false;

  // Check if any node is not at the origin
  const hasNonOrigin = nodes.some(
    (node) => node.position.x !== 0 || node.position.y !== 0
  );

  if (!hasNonOrigin) return false;

  // Check if nodes have varied positions (not all at same position)
  const firstPos = nodes[0].position;
  const hasVariedPositions = nodes.some(
    (node) =>
      node.position.x !== firstPos.x || node.position.y !== firstPos.y
  );

  return hasVariedPositions;
}
