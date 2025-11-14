/**
 * Enhanced Edge Styles for ReactFlow
 *
 * Provides comprehensive styling configuration for different edge types
 * with colors, animations, arrows, and labels.
 *
 * @module lib/styles/edgeStyles
 * @version 1.0.0
 * @author Visual Enhancement Engineer (Agent 3, Wave 2)
 */

import React from 'react';
import type { EdgeData } from '../types/ui-types';

/**
 * Edge type identifier
 */
export type EdgeType = EdgeData['type'] | 'error';

/**
 * Arrow marker types supported by ReactFlow
 */
export type ArrowType = 'arrow' | 'arrowclosed' | 'circle';

/**
 * Comprehensive edge style configuration
 */
export interface EdgeStyleConfig {
  /** Edge type identifier */
  type: EdgeType;

  /** Stroke color (hex) */
  color: string;

  /** Stroke width in pixels */
  width: number;

  /** Whether edge should animate */
  animated: boolean;

  /** Label text (optional) */
  label?: string;

  /** Arrow marker type */
  arrow: ArrowType;

  /** Stroke dash array for dashed/dotted lines */
  strokeDasharray?: string;

  /** Description of relationship */
  description: string;

  /** Z-index for layering */
  zIndex?: number;
}

/**
 * Edge style configurations by type
 *
 * Specification:
 * | Type     | Color   | Style  | Animated | Arrow        |
 * |----------|---------|--------|----------|--------------|
 * | extends  | #8B5CF6 | solid  | false    | arrowclosed  |
 * | mixin    | #3B82F6 | dashed | false    | arrow        |
 * | toolRef  | #10B981 | solid  | true     | arrow        |
 * | variable | #F59E0B | dotted | false    | circle       |
 * | bundle   | #8B5CF6 | solid  | false    | arrowclosed  |
 * | error    | #EF4444 | solid  | true     | arrowclosed  |
 */
export const edgeStyleConfigs: Record<EdgeType, EdgeStyleConfig> = {
  /**
   * Extends relationship - Template inheritance
   * Purple, solid, thick line with closed arrow
   */
  extends: {
    type: 'extends',
    color: '#8B5CF6', // Purple-500
    width: 3,
    animated: false,
    arrow: 'arrowclosed',
    description: 'Template extends another template',
    zIndex: 10,
  },

  /**
   * Mixin relationship - Fragment composition
   * Blue, dashed line with arrow
   */
  mixin: {
    type: 'mixin',
    color: '#3B82F6', // Blue-500
    width: 2,
    animated: false,
    arrow: 'arrow',
    strokeDasharray: '5,5',
    description: 'Template includes fragment as mixin',
    zIndex: 5,
  },

  /**
   * Tool reference - Tool usage
   * Green, solid line with animation and arrow
   */
  toolRef: {
    type: 'toolRef',
    color: '#10B981', // Green-500
    width: 2,
    animated: true,
    arrow: 'arrow',
    description: 'Template uses tool',
    zIndex: 3,
  },

  /**
   * Variable binding - Variable reference
   * Orange, dotted line with circle marker
   */
  variable: {
    type: 'variable',
    color: '#F59E0B', // Orange-500
    width: 1.5,
    animated: false,
    arrow: 'circle',
    strokeDasharray: '2,4',
    description: 'Template references variable',
    zIndex: 2,
  },

  /**
   * Bundle relationship - Tool bundle
   * Purple, solid line with closed arrow
   */
  bundle: {
    type: 'bundle',
    color: '#8B5CF6', // Purple-500
    width: 2,
    animated: false,
    arrow: 'arrowclosed',
    description: 'Bundle contains tool',
    zIndex: 8,
  },

  /**
   * Error relationship - Validation error
   * Red, solid, thick line with animation and closed arrow
   */
  error: {
    type: 'error',
    color: '#EF4444', // Red-500
    width: 3,
    animated: true,
    arrow: 'arrowclosed',
    description: 'Invalid or broken relationship',
    zIndex: 15,
  },
};

/**
 * Get edge style configuration by type
 *
 * @param type - Edge type identifier
 * @returns Edge style configuration
 *
 * @example
 * ```tsx
 * const style = getEdgeStyle('extends');
 * console.log(style.color); // '#8B5CF6'
 * console.log(style.width); // 3
 * ```
 */
export function getEdgeStyle(type: EdgeType): EdgeStyleConfig {
  return edgeStyleConfigs[type] || edgeStyleConfigs.toolRef;
}

/**
 * Convert edge style config to ReactFlow style object
 *
 * @param config - Edge style configuration
 * @returns ReactFlow-compatible style object
 */
export function toReactFlowStyle(config: EdgeStyleConfig): React.CSSProperties {
  return {
    stroke: config.color,
    strokeWidth: config.width,
    strokeDasharray: config.strokeDasharray,
    zIndex: config.zIndex,
  };
}

/**
 * Get marker end definition for ReactFlow
 *
 * @param type - Edge type
 * @param color - Arrow color (optional, uses edge color if not provided)
 * @returns Marker end ID for ReactFlow
 */
export function getMarkerEnd(type: EdgeType, color?: string): string {
  const config = getEdgeStyle(type);
  const markerColor = color || config.color;
  const colorId = markerColor.replace('#', '');

  return `url(#${config.arrow}-${colorId})`;
}

/**
 * Generate SVG marker definitions for edges
 *
 * These markers are used by ReactFlow for edge arrows.
 * Should be included once in the SVG defs section.
 *
 * @returns SVG marker definitions as JSX
 */
export function EdgeMarkerDefs(): JSX.Element {
  const markers: Array<{ id: string; type: ArrowType; color: string }> = [];

  // Generate marker for each unique color/type combination
  Object.values(edgeStyleConfigs).forEach((config) => {
    const colorId = config.color.replace('#', '');
    const markerId = `${config.arrow}-${colorId}`;

    // Check if we already have this marker
    if (!markers.find((m) => m.id === markerId)) {
      markers.push({
        id: markerId,
        type: config.arrow,
        color: config.color,
      });
    }
  });

  return (
    <defs>
      {markers.map(({ id, type, color }) => {
        switch (type) {
          case 'arrow':
            return (
              <marker
                key={id}
                id={id}
                markerWidth="12"
                markerHeight="12"
                viewBox="-10 -10 20 20"
                orient="auto"
                refX="0"
                refY="0"
              >
                <polyline
                  stroke={color}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1"
                  fill="none"
                  points="-5,-4 0,0 -5,4"
                />
              </marker>
            );

          case 'arrowclosed':
            return (
              <marker
                key={id}
                id={id}
                markerWidth="12"
                markerHeight="12"
                viewBox="-10 -10 20 20"
                orient="auto"
                refX="0"
                refY="0"
              >
                <polygon
                  fill={color}
                  points="-5,-4 0,0 -5,4"
                />
              </marker>
            );

          case 'circle':
            return (
              <marker
                key={id}
                id={id}
                markerWidth="8"
                markerHeight="8"
                viewBox="-10 -10 20 20"
                orient="auto"
                refX="0"
                refY="0"
              >
                <circle
                  cx="0"
                  cy="0"
                  r="3"
                  fill={color}
                />
              </marker>
            );

          default:
            return null;
        }
      })}
    </defs>
  );
}

/**
 * Get edge label configuration
 *
 * @param type - Edge type
 * @param customLabel - Custom label text (optional)
 * @returns Label configuration
 */
export function getEdgeLabel(
  type: EdgeType,
  customLabel?: string
): { text: string; style: React.CSSProperties } | null {
  const config = getEdgeStyle(type);

  // Use custom label if provided, otherwise use type-specific label
  let labelText = customLabel;

  if (!labelText) {
    switch (type) {
      case 'extends':
        labelText = 'extends';
        break;
      case 'mixin':
        labelText = 'mixin';
        break;
      case 'bundle':
        labelText = 'bundle';
        break;
      case 'error':
        labelText = 'error';
        break;
      // toolRef and variable don't have default labels
      default:
        return null;
    }
  }

  return {
    text: labelText,
    style: {
      fill: config.color,
      fontSize: '12px',
      fontWeight: 600,
    },
  };
}

/**
 * Helper to check if edge should show animation
 *
 * @param type - Edge type
 * @returns Whether edge should animate
 */
export function shouldAnimate(type: EdgeType): boolean {
  return getEdgeStyle(type).animated;
}

export default edgeStyleConfigs;
