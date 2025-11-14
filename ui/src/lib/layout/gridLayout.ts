/**
 * Grid Layout Algorithm
 *
 * Arranges nodes in a regular grid pattern with uniform spacing.
 * Extremely fast and deterministic, best for simple visualizations.
 *
 * @module lib/layout/gridLayout
 * @version 1.0.0
 * @author Layout System Engineer (Agent 2+)
 */

import type { Node, Edge } from 'reactflow';

export interface GridLayoutOptions {
  /** Number of columns (auto-calculated if not provided) */
  columns?: number;

  /** Horizontal spacing between nodes */
  columnSpacing?: number;

  /** Vertical spacing between nodes */
  rowSpacing?: number;

  /** Starting X position */
  startX?: number;

  /** Starting Y position */
  startY?: number;

  /** Sort nodes by type before arranging */
  sortByType?: boolean;
}

const DEFAULT_OPTIONS: Required<GridLayoutOptions> = {
  columns: 0, // Auto-calculate
  columnSpacing: 300,
  rowSpacing: 200,
  startX: 100,
  startY: 100,
  sortByType: true,
};

/**
 * Apply grid layout to nodes
 *
 * Performance target: < 10ms
 *
 * @param nodes - Input nodes
 * @param edges - Input edges (unused but kept for interface consistency)
 * @param options - Layout options
 * @returns Positioned nodes
 */
export function applyGridLayout(
  nodes: Node[],
  edges: Edge[],
  options: GridLayoutOptions = {}
): Node[] {
  const startTime = performance.now();
  const opts = { ...DEFAULT_OPTIONS, ...options };

  if (nodes.length === 0) return [];

  // Sort nodes by type if requested
  let sortedNodes = [...nodes];
  if (opts.sortByType) {
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
  }

  // Calculate optimal number of columns if not specified
  const columns = opts.columns > 0
    ? opts.columns
    : Math.ceil(Math.sqrt(nodes.length));

  // Position nodes in grid
  const layoutedNodes = sortedNodes.map((node, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);

    return {
      ...node,
      position: {
        x: opts.startX + column * opts.columnSpacing,
        y: opts.startY + row * opts.rowSpacing,
      },
      // Add transition style for smooth animation
      style: {
        ...node.style,
        transition: 'all 0.3s ease-in-out',
      },
    };
  });

  const duration = performance.now() - startTime;

  // Log performance warning if too slow
  if (duration > 10) {
    console.warn(`Grid layout took ${duration.toFixed(2)}ms (target: <10ms)`);
  }

  return layoutedNodes;
}

/**
 * Calculate optimal grid dimensions for a given node count
 *
 * @param nodeCount - Number of nodes
 * @returns Optimal columns and rows
 */
export function calculateGridDimensions(nodeCount: number): { columns: number; rows: number } {
  if (nodeCount === 0) return { columns: 0, rows: 0 };

  const columns = Math.ceil(Math.sqrt(nodeCount));
  const rows = Math.ceil(nodeCount / columns);

  return { columns, rows };
}
