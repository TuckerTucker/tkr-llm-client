/**
 * Layout Configuration
 *
 * Configuration types and defaults for layout algorithms including spacing,
 * padding, direction, node sizing, edge routing, and layout constraints.
 *
 * @module lib/layout/config
 * @version 1.0.0
 * @author Layout Engineer (Agent 6) - Wave 2
 */

import type { Node } from '../types/reactflow';
import type { NodeData } from '../types/ui-types';

/**
 * Layout algorithm types
 */
export enum LayoutAlgorithm {
  /** Hierarchical layout using Dagre (extends chains) */
  DAGRE = 'dagre',
  /** Physics-based force-directed layout */
  FORCE_DIRECTED = 'force',
  /** Advanced hierarchical layout using ELK */
  ELK = 'elk',
  /** Simple grid layout */
  GRID = 'grid',
  /** Circular arrangement */
  CIRCULAR = 'circular',
  /** Tree structure (parent-child) */
  TREE = 'tree',
  /** Manual positioning (no auto-layout) */
  MANUAL = 'manual',
}

/**
 * Layout direction for hierarchical layouts
 */
export enum LayoutDirection {
  /** Top to bottom */
  TB = 'TB',
  /** Bottom to top */
  BT = 'BT',
  /** Left to right */
  LR = 'LR',
  /** Right to left */
  RL = 'RL',
}

/**
 * Edge routing strategies
 */
export enum EdgeRouting {
  /** Straight lines */
  STRAIGHT = 'straight',
  /** Bezier curves */
  BEZIER = 'bezier',
  /** Step edges */
  STEP = 'step',
  /** Smoothstep edges */
  SMOOTHSTEP = 'smoothstep',
  /** Orthogonal routing */
  ORTHOGONAL = 'orthogonal',
}

/**
 * Node sizing behavior
 */
export enum NodeSizing {
  /** Use fixed node dimensions */
  FIXED = 'fixed',
  /** Measure actual node dimensions */
  MEASURED = 'measured',
  /** Auto-size based on content */
  AUTO = 'auto',
}

/**
 * Dagre-specific configuration
 */
export interface DagreConfig {
  /** Rank direction */
  direction: LayoutDirection;
  /** Node separation (horizontal spacing) */
  nodeSep: number;
  /** Rank separation (vertical spacing) */
  rankSep: number;
  /** Edge separation */
  edgeSep: number;
  /** Ranking algorithm: 'network-simplex', 'tight-tree', 'longest-path' */
  ranker: 'network-simplex' | 'tight-tree' | 'longest-path';
  /** Alignment: 'UL', 'UR', 'DL', 'DR' */
  align?: 'UL' | 'UR' | 'DL' | 'DR';
}

/**
 * Force-directed layout configuration
 */
export interface ForceConfig {
  /** Link distance */
  linkDistance: number;
  /** Link strength (0-1) */
  linkStrength: number;
  /** Charge force (negative = repulsion) */
  chargeStrength: number;
  /** Center force strength */
  centerStrength: number;
  /** Collision radius */
  collisionRadius: number;
  /** Number of iterations */
  iterations: number;
  /** Alpha (initial velocity) */
  alpha: number;
  /** Alpha decay rate */
  alphaDecay: number;
}

/**
 * ELK (Eclipse Layout Kernel) configuration
 */
export interface ElkConfig {
  /** Layout algorithm: 'layered', 'force', 'stress', 'mrtree', 'radial' */
  algorithm: 'layered' | 'force' | 'stress' | 'mrtree' | 'radial';
  /** Direction */
  direction: LayoutDirection;
  /** Node spacing */
  spacing: number;
  /** Layer spacing */
  layerSpacing: number;
  /** Aspect ratio (for some algorithms) */
  aspectRatio?: number;
}

/**
 * Grid layout configuration
 */
export interface GridConfig {
  /** Number of columns (0 = auto) */
  columns: number;
  /** Cell width */
  cellWidth: number;
  /** Cell height */
  cellHeight: number;
  /** Horizontal spacing */
  spacingX: number;
  /** Vertical spacing */
  spacingY: number;
  /** Starting position */
  startX: number;
  startY: number;
}

/**
 * Circular layout configuration
 */
export interface CircularConfig {
  /** Radius of circle */
  radius: number;
  /** Starting angle (radians) */
  startAngle: number;
  /** Sweep angle (radians, 2*PI = full circle) */
  sweepAngle: number;
  /** Center position */
  centerX: number;
  centerY: number;
}

/**
 * Tree layout configuration
 */
export interface TreeConfig {
  /** Direction */
  direction: LayoutDirection;
  /** Horizontal spacing between siblings */
  siblingSpacing: number;
  /** Vertical spacing between levels */
  levelSpacing: number;
  /** Root node ID (if not specified, uses nodes without parents) */
  rootId?: string;
}

/**
 * Layout constraints
 */
export interface LayoutConstraints {
  /** Minimum node spacing */
  minNodeSpacing?: number;
  /** Maximum node spacing */
  maxNodeSpacing?: number;
  /** Preserve aspect ratio */
  preserveAspectRatio?: boolean;
  /** Fit to viewport */
  fitToViewport?: boolean;
  /** Padding around layout */
  padding?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

/**
 * Complete layout configuration
 */
export interface LayoutConfig {
  /** Selected algorithm */
  algorithm: LayoutAlgorithm;
  /** Node sizing behavior */
  nodeSizing: NodeSizing;
  /** Edge routing strategy */
  edgeRouting: EdgeRouting;
  /** Animation duration (ms) */
  animationDuration: number;
  /** Animation easing function */
  animationEasing: string;
  /** Layout constraints */
  constraints: LayoutConstraints;
  /** Algorithm-specific configs */
  dagre: DagreConfig;
  force: ForceConfig;
  elk: ElkConfig;
  grid: GridConfig;
  circular: CircularConfig;
  tree: TreeConfig;
}

/**
 * Default Dagre configuration
 */
export const DEFAULT_DAGRE_CONFIG: DagreConfig = {
  direction: LayoutDirection.TB,
  nodeSep: 50,
  rankSep: 100,
  edgeSep: 10,
  ranker: 'network-simplex',
  align: undefined,
};

/**
 * Default Force-Directed configuration
 */
export const DEFAULT_FORCE_CONFIG: ForceConfig = {
  linkDistance: 150,
  linkStrength: 1,
  chargeStrength: -1000,
  centerStrength: 0.3,
  collisionRadius: 50,
  iterations: 300,
  alpha: 1,
  alphaDecay: 0.0228,
};

/**
 * Default ELK configuration
 */
export const DEFAULT_ELK_CONFIG: ElkConfig = {
  algorithm: 'layered',
  direction: LayoutDirection.TB,
  spacing: 50,
  layerSpacing: 100,
  aspectRatio: undefined,
};

/**
 * Default Grid configuration
 */
export const DEFAULT_GRID_CONFIG: GridConfig = {
  columns: 0, // Auto-calculate
  cellWidth: 200,
  cellHeight: 100,
  spacingX: 50,
  spacingY: 50,
  startX: 50,
  startY: 50,
};

/**
 * Default Circular configuration
 */
export const DEFAULT_CIRCULAR_CONFIG: CircularConfig = {
  radius: 300,
  startAngle: 0,
  sweepAngle: 2 * Math.PI,
  centerX: 0,
  centerY: 0,
};

/**
 * Default Tree configuration
 */
export const DEFAULT_TREE_CONFIG: TreeConfig = {
  direction: LayoutDirection.TB,
  siblingSpacing: 50,
  levelSpacing: 100,
  rootId: undefined,
};

/**
 * Default layout constraints
 */
export const DEFAULT_CONSTRAINTS: LayoutConstraints = {
  minNodeSpacing: 20,
  maxNodeSpacing: 500,
  preserveAspectRatio: false,
  fitToViewport: true,
  padding: {
    top: 50,
    right: 50,
    bottom: 50,
    left: 50,
  },
};

/**
 * Default layout configuration
 */
export const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  algorithm: LayoutAlgorithm.DAGRE,
  nodeSizing: NodeSizing.MEASURED,
  edgeRouting: EdgeRouting.BEZIER,
  animationDuration: 300,
  animationEasing: 'easeInOut',
  constraints: DEFAULT_CONSTRAINTS,
  dagre: DEFAULT_DAGRE_CONFIG,
  force: DEFAULT_FORCE_CONFIG,
  elk: DEFAULT_ELK_CONFIG,
  grid: DEFAULT_GRID_CONFIG,
  circular: DEFAULT_CIRCULAR_CONFIG,
  tree: DEFAULT_TREE_CONFIG,
};

/**
 * Node dimensions (used for layout calculations)
 */
export interface NodeDimensions {
  width: number;
  height: number;
}

/**
 * Default node dimensions
 */
export const DEFAULT_NODE_DIMENSIONS: NodeDimensions = {
  width: 150,
  height: 50,
};

/**
 * Get node dimensions from node or use defaults
 */
export function getNodeDimensions(
  node: Node<NodeData>,
  nodeSizing: NodeSizing = NodeSizing.MEASURED
): NodeDimensions {
  if (nodeSizing === NodeSizing.FIXED) {
    return DEFAULT_NODE_DIMENSIONS;
  }

  // Use measured dimensions if available
  if (node.width !== undefined && node.height !== undefined) {
    return {
      width: node.width,
      height: node.height,
    };
  }

  // Fall back to defaults
  return DEFAULT_NODE_DIMENSIONS;
}

/**
 * Merge partial config with defaults
 */
export function mergeLayoutConfig(
  partial: Partial<LayoutConfig>
): LayoutConfig {
  return {
    ...DEFAULT_LAYOUT_CONFIG,
    ...partial,
    constraints: {
      ...DEFAULT_LAYOUT_CONFIG.constraints,
      ...(partial.constraints || {}),
    },
    dagre: {
      ...DEFAULT_LAYOUT_CONFIG.dagre,
      ...(partial.dagre || {}),
    },
    force: {
      ...DEFAULT_LAYOUT_CONFIG.force,
      ...(partial.force || {}),
    },
    elk: {
      ...DEFAULT_LAYOUT_CONFIG.elk,
      ...(partial.elk || {}),
    },
    grid: {
      ...DEFAULT_LAYOUT_CONFIG.grid,
      ...(partial.grid || {}),
    },
    circular: {
      ...DEFAULT_LAYOUT_CONFIG.circular,
      ...(partial.circular || {}),
    },
    tree: {
      ...DEFAULT_LAYOUT_CONFIG.tree,
      ...(partial.tree || {}),
    },
  };
}
