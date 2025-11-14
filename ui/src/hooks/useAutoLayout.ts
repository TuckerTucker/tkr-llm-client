/**
 * Auto Layout Hook (FULL IMPLEMENTATION)
 *
 * Provides 7 layout algorithms with smooth animations and error recovery.
 * Replaces the stub implementation with full layout system integration.
 *
 * @module hooks/useAutoLayout
 * @version 1.0.0
 * @author Layout System Engineer (Agent 2+)
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Node, Edge } from 'reactflow';
import { logError } from '../lib/errors/logging';
import { toast } from '../lib/notifications/toast';
import { withFallback } from '../lib/errors/recovery';

// Import all layout algorithms
import {
  applyDagreLayout,
  applyGridLayout,
  applyForceLayout,
  applyCircularLayout,
  applyTreeLayout,
  applyELKLayoutSync,
  applyManualLayout,
  type LayoutAlgorithm,
} from '../lib/layout';

export type { LayoutAlgorithm };

export interface LayoutConfig {
  algorithm: LayoutAlgorithm;
  animated: boolean;
  duration?: number;
}

export interface UseAutoLayoutResult {
  layoutedNodes: Node[];
  layoutedEdges: Edge[];
  isLayouting: boolean;
  applyLayout: (algorithm?: LayoutAlgorithm) => void;
  currentAlgorithm: LayoutAlgorithm;
}

/**
 * Auto layout hook for positioning nodes
 *
 * Provides 7 layout algorithms:
 * - dagre: Hierarchical layout with edge routing (< 50ms)
 * - grid: Simple grid arrangement (< 10ms)
 * - force: Physics-based force-directed (< 200ms)
 * - circular: Circular/ellipse arrangement (< 20ms)
 * - tree: Strict tree hierarchy (< 30ms)
 * - elk: Advanced hierarchical layout (< 100ms)
 * - manual: Preserve user positions (< 1ms)
 *
 * @param nodes - Input nodes
 * @param edges - Input edges
 * @param config - Layout configuration
 * @returns Layout result with positioned nodes
 */
export function useAutoLayout(
  nodes: Node[],
  edges: Edge[],
  config: LayoutConfig = { algorithm: 'dagre', animated: true }
): UseAutoLayoutResult {
  const [isLayouting, setIsLayouting] = useState(false);
  const [layoutAlgorithm, setLayoutAlgorithm] = useState<LayoutAlgorithm>(config.algorithm);

  // Apply the selected layout algorithm
  const layoutedNodes = useMemo(() => {
    console.log(`📐 Layout recalculating with algorithm: ${layoutAlgorithm}, nodes: ${nodes.length}`);
    if (nodes.length === 0) return [];

    // Wrap layout calculation in error handling
    return withFallback(
      () => {
        const startTime = performance.now();

        let positioned: Node[];

        // Apply the selected layout algorithm
        switch (layoutAlgorithm) {
          case 'dagre':
            positioned = applyDagreLayout(nodes, edges, {
              direction: 'TB',
              nodeSpacing: 100,
              rankSpacing: 150,
            });
            break;

          case 'grid':
            positioned = applyGridLayout(nodes, edges, {
              columnSpacing: 300,
              rowSpacing: 200,
              sortByType: true,
            });
            break;

          case 'force':
            positioned = applyForceLayout(nodes, edges, {
              iterations: 300,
              linkStrength: 0.5,
              linkDistance: 150,
              chargeStrength: -500,
            });
            break;

          case 'circular':
            positioned = applyCircularLayout(nodes, edges, {
              radius: 300,
              sortBy: 'type',
            });
            break;

          case 'tree':
            positioned = applyTreeLayout(nodes, edges, {
              direction: 'TB',
              siblingSpacing: 150,
              levelSpacing: 200,
            });
            break;

          case 'elk':
            positioned = applyELKLayoutSync(nodes, edges, {
              algorithm: 'layered',
              direction: 'DOWN',
              spacing: 75,
            });
            break;

          case 'manual':
            positioned = applyManualLayout(nodes, edges, {
              snapToGrid: false,
              enforceMinSpacing: false,
            });
            break;

          default:
            console.warn(`Unknown layout algorithm: ${layoutAlgorithm}, falling back to dagre`);
            positioned = applyDagreLayout(nodes, edges);
        }

        const duration = performance.now() - startTime;

        // Log performance metrics
        if (duration > 100) {
          console.info(
            `Layout (${layoutAlgorithm}) took ${duration.toFixed(2)}ms for ${nodes.length} nodes`
          );
        }

        return positioned;
      },
      () => {
        // Fallback: Use grid layout on error
        toast.warning(`Layout failed, using grid layout`);
        return applyGridLayout(nodes, edges, {
          columnSpacing: 300,
          rowSpacing: 200,
          sortByType: true,
        });
      },
      (error) => {
        logError('useAutoLayout', error, undefined, {
          algorithm: layoutAlgorithm,
          nodeCount: nodes.length,
          edgeCount: edges.length,
        });
      }
    );
  }, [nodes, edges, layoutAlgorithm]);

  // Apply animation to edges if enabled
  const layoutedEdges = useMemo(() => {
    return edges.map((edge) => ({
      ...edge,
      animated: config.animated,
    }));
  }, [edges, config.animated]);

  // Apply layout algorithm
  const applyLayout = useCallback((algorithm?: LayoutAlgorithm) => {
    if (algorithm) {
      console.log(`🔄 Applying layout: ${algorithm}`);
      setIsLayouting(true);
      setLayoutAlgorithm(algorithm);

      // Simulate layout calculation time for smooth animation
      const duration = config.duration ?? 300;
      setTimeout(() => {
        setIsLayouting(false);
      }, duration);

      // Show toast notification
      toast.success(`Applied ${algorithm} layout`, { duration: 2000 });
    }
  }, [config.duration]);

  // Update algorithm when config changes
  useEffect(() => {
    if (config.algorithm !== layoutAlgorithm) {
      setLayoutAlgorithm(config.algorithm);
    }
  }, [config.algorithm, layoutAlgorithm]);

  return {
    layoutedNodes,
    layoutedEdges,
    isLayouting,
    applyLayout,
    currentAlgorithm: layoutAlgorithm,
  };
}

/**
 * Get layout algorithm display name
 *
 * @param algorithm - Layout algorithm
 * @returns Display name
 */
export function getLayoutName(algorithm: LayoutAlgorithm): string {
  const names: Record<LayoutAlgorithm, string> = {
    dagre: 'Dagre (Hierarchical)',
    grid: 'Grid',
    force: 'Force-Directed',
    circular: 'Circular',
    tree: 'Tree',
    elk: 'ELK (Advanced)',
    manual: 'Manual',
  };

  return names[algorithm] || algorithm;
}

/**
 * Get layout algorithm description
 *
 * @param algorithm - Layout algorithm
 * @returns Description
 */
export function getLayoutDescription(algorithm: LayoutAlgorithm): string {
  const descriptions: Record<LayoutAlgorithm, string> = {
    dagre: 'Hierarchical layout with automatic edge routing. Best for DAGs and inheritance.',
    grid: 'Simple grid arrangement. Fast and predictable.',
    force: 'Physics-based layout. Good for exploring relationships.',
    circular: 'Arranges nodes in a circle. Good for cyclical structures.',
    tree: 'Strict tree hierarchy. Best for parent-child relationships.',
    elk: 'Advanced hierarchical layout. Sophisticated edge routing.',
    manual: 'Preserve user-defined positions. No automatic layout.',
  };

  return descriptions[algorithm] || 'No description available';
}

/**
 * Get layout algorithm icon
 *
 * @param algorithm - Layout algorithm
 * @returns Icon character
 */
export function getLayoutIcon(algorithm: LayoutAlgorithm): string {
  const icons: Record<LayoutAlgorithm, string> = {
    dagre: '📊',
    grid: '⊞',
    force: '🔮',
    circular: '⭕',
    tree: '🌳',
    elk: '🦌',
    manual: '✋',
  };

  return icons[algorithm] || '📐';
}
