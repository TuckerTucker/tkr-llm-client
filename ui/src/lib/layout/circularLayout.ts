/**
 * Circular Layout Algorithm
 *
 * Arranges nodes in a circle or ellipse pattern.
 * Best for showing cyclical relationships or balanced structures.
 *
 * @module lib/layout/circularLayout
 * @version 1.0.0
 * @author Layout System Engineer (Agent 2+)
 */

import type { Node, Edge } from 'reactflow';

export interface CircularLayoutOptions {
  /** Center X position */
  centerX?: number;

  /** Center Y position */
  centerY?: number;

  /** Radius of the circle */
  radius?: number;

  /** Starting angle in radians (0 = right, Math.PI/2 = top) */
  startAngle?: number;

  /** Sort nodes before arranging (by type or degree) */
  sortBy?: 'type' | 'degree' | 'none';

  /** Use ellipse instead of circle */
  ellipse?: boolean;

  /** Horizontal radius (for ellipse) */
  radiusX?: number;

  /** Vertical radius (for ellipse) */
  radiusY?: number;
}

const DEFAULT_OPTIONS: Required<CircularLayoutOptions> = {
  centerX: 500,
  centerY: 400,
  radius: 300,
  startAngle: -Math.PI / 2, // Start at top
  sortBy: 'type',
  ellipse: false,
  radiusX: 400,
  radiusY: 300,
};

/**
 * Apply circular layout to nodes
 *
 * Performance target: < 20ms
 *
 * @param nodes - Input nodes
 * @param edges - Input edges (used for degree calculation)
 * @param options - Layout options
 * @returns Positioned nodes
 */
export function applyCircularLayout(
  nodes: Node[],
  edges: Edge[],
  options: CircularLayoutOptions = {}
): Node[] {
  const startTime = performance.now();
  const opts = { ...DEFAULT_OPTIONS, ...options };

  if (nodes.length === 0) return [];

  // Sort nodes if requested
  let sortedNodes = [...nodes];

  if (opts.sortBy === 'type') {
    const typeOrder = ['template', 'fragment', 'toolConfig', 'variable', 'bundle', 'resolved'];
    sortedNodes.sort((a, b) => {
      const aType = a.type || 'unknown';
      const bType = b.type || 'unknown';
      const aIndex = typeOrder.indexOf(aType);
      const bIndex = typeOrder.indexOf(bType);

      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;

      return aIndex - bIndex;
    });
  } else if (opts.sortBy === 'degree') {
    // Calculate degree (number of connections) for each node
    const degrees = new Map<string, number>();
    nodes.forEach((node) => degrees.set(node.id, 0));

    edges.forEach((edge) => {
      degrees.set(edge.source, (degrees.get(edge.source) || 0) + 1);
      degrees.set(edge.target, (degrees.get(edge.target) || 0) + 1);
    });

    sortedNodes.sort((a, b) => (degrees.get(b.id) || 0) - (degrees.get(a.id) || 0));
  }

  // Calculate angle step
  const angleStep = (2 * Math.PI) / nodes.length;

  // Position nodes around circle/ellipse
  const layoutedNodes = sortedNodes.map((node, index) => {
    const angle = opts.startAngle + index * angleStep;

    let x: number, y: number;

    if (opts.ellipse) {
      // Ellipse positioning
      x = opts.centerX + opts.radiusX * Math.cos(angle);
      y = opts.centerY + opts.radiusY * Math.sin(angle);
    } else {
      // Circle positioning
      x = opts.centerX + opts.radius * Math.cos(angle);
      y = opts.centerY + opts.radius * Math.sin(angle);
    }

    return {
      ...node,
      position: { x, y },
      // Add transition style for smooth animation
      style: {
        ...node.style,
        transition: 'all 0.3s ease-in-out',
      },
    };
  });

  const duration = performance.now() - startTime;

  // Log performance warning if too slow
  if (duration > 20) {
    console.warn(`Circular layout took ${duration.toFixed(2)}ms (target: <20ms)`);
  }

  return layoutedNodes;
}

/**
 * Calculate optimal radius based on node count
 *
 * @param nodeCount - Number of nodes
 * @param minSpacing - Minimum spacing between nodes
 * @returns Optimal radius
 */
export function calculateOptimalRadius(nodeCount: number, minSpacing: number = 150): number {
  if (nodeCount === 0) return 0;

  // Calculate circumference needed for minimum spacing
  const circumference = nodeCount * minSpacing;

  // Calculate radius from circumference (C = 2πr)
  const radius = circumference / (2 * Math.PI);

  return Math.max(radius, 200); // Minimum radius of 200
}
