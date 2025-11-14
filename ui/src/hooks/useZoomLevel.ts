/**
 * useZoomLevel Hook
 *
 * Tracks ReactFlow viewport zoom level and calculates appropriate detail level for nodes.
 * Enables semantic zoom where nodes show different levels of information based on zoom.
 *
 * @module ui/hooks/useZoomLevel
 * @version 1.0.0
 * @author Visual Enhancement Engineer (Agent 3, Wave 2)
 */

import { useReactFlow } from 'reactflow';
import { useMemo } from 'react';
import type { DetailLevel } from '../components/nodes/styles';

/**
 * Zoom level thresholds for detail level transitions
 */
const ZOOM_THRESHOLDS = {
  minimal: 0.5,
  compact: 1.0,
  standard: 1.5,
} as const;

/**
 * Calculate detail level based on zoom value
 *
 * @param zoom - Current zoom level (1.0 = 100%)
 * @returns Detail level for node rendering
 */
export function calculateDetailLevel(zoom: number): DetailLevel {
  if (zoom < ZOOM_THRESHOLDS.minimal) return 'minimal';
  if (zoom < ZOOM_THRESHOLDS.compact) return 'compact';
  if (zoom < ZOOM_THRESHOLDS.standard) return 'standard';
  return 'full';
}

/**
 * Hook to track zoom level and detail level
 *
 * Subscribes to ReactFlow viewport changes and provides:
 * - Current zoom level
 * - Calculated detail level for semantic zoom
 * - Helper functions for zoom operations
 *
 * @example
 * ```tsx
 * function MyNode() {
 *   const { zoom, detailLevel } = useZoomLevel();
 *
 *   return (
 *     <div>
 *       Zoom: {zoom.toFixed(2)}
 *       {detailLevel === 'full' && <DetailedContent />}
 *     </div>
 *   );
 * }
 * ```
 *
 * @returns Zoom state and helpers
 */
export function useZoomLevel() {
  const reactFlowInstance = useReactFlow();
  const viewport = reactFlowInstance.getViewport();

  // Calculate detail level based on current zoom
  const detailLevel = useMemo(
    () => calculateDetailLevel(viewport.zoom),
    [viewport.zoom]
  );

  // Calculate zoom percentage (100% = 1.0)
  const zoomPercentage = useMemo(
    () => Math.round(viewport.zoom * 100),
    [viewport.zoom]
  );

  return {
    /** Current zoom level (1.0 = 100%) */
    zoom: viewport.zoom,

    /** Current detail level for semantic zoom */
    detailLevel,

    /** Zoom as percentage (100% = 1.0 zoom) */
    zoomPercentage,

    /** Position of viewport */
    position: {
      x: viewport.x,
      y: viewport.y,
    },

    /** Whether currently at minimal detail level */
    isMinimal: detailLevel === 'minimal',

    /** Whether currently at compact detail level */
    isCompact: detailLevel === 'compact',

    /** Whether currently at standard detail level */
    isStandard: detailLevel === 'standard',

    /** Whether currently at full detail level */
    isFull: detailLevel === 'full',
  };
}

/**
 * Hook variant that provides just the detail level
 *
 * Optimized version when you only need the detail level, not the full zoom state.
 *
 * @example
 * ```tsx
 * function SimpleNode() {
 *   const detailLevel = useDetailLevel();
 *
 *   if (detailLevel === 'minimal') {
 *     return <MinimalView />;
 *   }
 *
 *   return <FullView />;
 * }
 * ```
 */
export function useDetailLevel(): DetailLevel {
  const { detailLevel } = useZoomLevel();
  return detailLevel;
}

export default useZoomLevel;
