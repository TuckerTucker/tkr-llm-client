/**
 * Node Positioning Utilities
 *
 * Provides grid-based positioning and bounds calculation for ReactFlow nodes.
 *
 * @module lib/utils/nodePositioning
 * @version 1.0.0
 * @author Adapter Integration Engineer (Agent 1)
 */

import type { Node } from '@backend/lib/types/reactflow';

/**
 * Grid layout settings for positioning nodes.
 */
export interface GridSettings {
  /** Horizontal spacing between columns */
  columnWidth: number;

  /** Vertical spacing between rows */
  rowHeight: number;

  /** Number of columns in the grid */
  columns: number;

  /** Starting X offset */
  startX?: number;

  /** Starting Y offset */
  startY?: number;
}

/**
 * Default grid settings for template conversion.
 */
export const DEFAULT_GRID_SETTINGS: GridSettings = {
  columnWidth: 400,
  rowHeight: 250,
  columns: 3,
  startX: 50,
  startY: 50,
};

/**
 * Calculates grid position for a node at the given index.
 *
 * @param index - Node index in the array (0-based)
 * @param settings - Grid layout settings
 * @returns Position object { x, y }
 *
 * @example
 * ```typescript
 * const pos = calculateGridPosition(0, DEFAULT_GRID_SETTINGS);
 * // { x: 50, y: 50 }
 *
 * const pos2 = calculateGridPosition(3, DEFAULT_GRID_SETTINGS);
 * // { x: 50, y: 300 } (next row)
 * ```
 */
export function calculateGridPosition(
  index: number,
  settings: GridSettings = DEFAULT_GRID_SETTINGS
): { x: number; y: number } {
  const { columnWidth, rowHeight, columns, startX = 0, startY = 0 } = settings;

  const row = Math.floor(index / columns);
  const col = index % columns;

  return {
    x: startX + col * columnWidth,
    y: startY + row * rowHeight,
  };
}

/**
 * Calculates the bounding box for a set of nodes.
 *
 * @param nodes - Array of nodes with positions
 * @returns Bounding box { minX, minY, maxX, maxY, width, height }
 *
 * @example
 * ```typescript
 * const bounds = calculateBounds(nodes);
 * console.log(bounds.width, bounds.height);
 * ```
 */
export function calculateBounds(nodes: Node[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
} {
  if (nodes.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const node of nodes) {
    const { x, y } = node.position;
    const width = node.width || 200; // Default node width
    const height = node.height || 100; // Default node height

    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + width);
    maxY = Math.max(maxY, y + height);
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Positions an array of nodes in a grid layout.
 *
 * @param nodes - Array of nodes to position
 * @param settings - Grid layout settings
 * @returns Nodes with updated positions
 *
 * @example
 * ```typescript
 * const positioned = positionNodesInGrid(nodes, {
 *   columnWidth: 350,
 *   rowHeight: 200,
 *   columns: 4,
 * });
 * ```
 */
export function positionNodesInGrid<T = any>(
  nodes: Node<T>[],
  settings: GridSettings = DEFAULT_GRID_SETTINGS
): Node<T>[] {
  return nodes.map((node, index) => ({
    ...node,
    position: calculateGridPosition(index, settings),
  }));
}

/**
 * Positions nodes by type in separate zones.
 *
 * Useful for organizing different node types (templates, tools, variables)
 * into distinct visual areas.
 *
 * @param nodesByType - Map of node type to nodes array
 * @param settings - Grid layout settings
 * @returns All nodes with updated positions
 *
 * @example
 * ```typescript
 * const positioned = positionNodesByType({
 *   template: templateNodes,
 *   toolConfig: toolNodes,
 *   variable: variableNodes,
 * });
 * ```
 */
export function positionNodesByType<T = any>(
  nodesByType: Record<string, Node<T>[]>,
  settings: GridSettings = DEFAULT_GRID_SETTINGS
): Node<T>[] {
  const allNodes: Node<T>[] = [];
  let currentY = settings.startY || 0;

  for (const [, nodes] of Object.entries(nodesByType)) {
    if (nodes.length === 0) continue;

    // Position this type's nodes
    const positioned = nodes.map((node, index) => {
      const { columnWidth, columns, startX = 0 } = settings;
      const row = Math.floor(index / columns);
      const col = index % columns;

      return {
        ...node,
        position: {
          x: startX + col * columnWidth,
          y: currentY + row * settings.rowHeight,
        },
      };
    });

    allNodes.push(...positioned);

    // Update Y offset for next type
    const rows = Math.ceil(nodes.length / settings.columns);
    currentY += rows * settings.rowHeight + 100; // Extra spacing between types
  }

  return allNodes;
}

/**
 * Centers nodes around a specific point.
 *
 * @param nodes - Array of nodes to center
 * @param center - Center point { x, y }
 * @returns Nodes with centered positions
 *
 * @example
 * ```typescript
 * const centered = centerNodesAround(nodes, { x: 500, y: 300 });
 * ```
 */
export function centerNodesAround<T = any>(
  nodes: Node<T>[],
  center: { x: number; y: number }
): Node<T>[] {
  const bounds = calculateBounds(nodes);
  const offsetX = center.x - bounds.width / 2 - bounds.minX;
  const offsetY = center.y - bounds.height / 2 - bounds.minY;

  return nodes.map((node) => ({
    ...node,
    position: {
      x: node.position.x + offsetX,
      y: node.position.y + offsetY,
    },
  }));
}
