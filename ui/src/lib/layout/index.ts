/**
 * Layout System Exports
 *
 * Provides 7 layout algorithms for ReactFlow node positioning:
 * - dagre: Hierarchical layout with edge routing
 * - grid: Simple grid arrangement
 * - force: Physics-based force-directed layout
 * - circular: Circular/ellipse arrangement
 * - tree: Strict tree hierarchy
 * - elk: Advanced hierarchical layout (ELK)
 * - manual: Preserve user positions
 *
 * @module lib/layout
 * @version 1.0.0
 * @author Layout System Engineer (Agent 2+)
 */

// Dagre Layout
export {
  applyDagreLayout,
  getDagreLayoutMetrics,
  type DagreLayoutOptions,
} from './dagreLayout';

// Grid Layout
export {
  applyGridLayout,
  calculateGridDimensions,
  type GridLayoutOptions,
} from './gridLayout';

// Force Layout
export {
  applyForceLayout,
  applyCustomForceLayout,
  type ForceLayoutOptions,
} from './forceLayout';

// Circular Layout
export {
  applyCircularLayout,
  calculateOptimalRadius,
  type CircularLayoutOptions,
} from './circularLayout';

// Tree Layout
export {
  applyTreeLayout,
  type TreeLayoutOptions,
} from './treeLayout';

// ELK Layout
export {
  applyELKLayout,
  applyELKLayoutSync,
  type ELKLayoutOptions,
} from './elkLayout';

// Manual Layout
export {
  applyManualLayout,
  snapNodesToGrid,
  hasCustomPositions,
  type ManualLayoutOptions,
} from './manualLayout';

// Layout type union for useAutoLayout
export type LayoutAlgorithm =
  | 'dagre'
  | 'grid'
  | 'force'
  | 'circular'
  | 'tree'
  | 'elk'
  | 'manual';

// Layout options union type
export type LayoutOptions =
  | import('./dagreLayout').DagreLayoutOptions
  | import('./gridLayout').GridLayoutOptions
  | import('./forceLayout').ForceLayoutOptions
  | import('./circularLayout').CircularLayoutOptions
  | import('./treeLayout').TreeLayoutOptions
  | import('./elkLayout').ELKLayoutOptions
  | import('./manualLayout').ManualLayoutOptions;
