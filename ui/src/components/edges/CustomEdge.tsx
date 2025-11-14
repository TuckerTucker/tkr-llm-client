/**
 * CustomEdge Component
 *
 * Type-based edge styling for ReactFlow connections with animations and labels.
 *
 * Features:
 * - Type-based styling (extends, mixin, variable, toolRef, bundle)
 * - Animated flow (for toolRef and error edges)
 * - Labels with tooltips
 * - Hover highlighting
 * - Enhanced visual styling per Wave 2 specifications
 *
 * Edge Styles:
 * - extends: Solid purple (3px) - inheritance with arrowclosed
 * - mixin: Dashed blue (2px) - fragment mixing with arrow
 * - variable: Dotted orange (1.5px) - variable binding with circle
 * - toolRef: Solid green (2px) - tool reference with animation
 * - bundle: Solid purple (2px) - tool bundle with arrowclosed
 * - error: Solid red (3px) - validation error with animation
 *
 * @see .context-kit/orchestration/reactflow-template-ui/integration-contracts/02-node-component-contracts.md
 * @version 2.0.0
 * @author Visual Enhancement Engineer (Agent 3, Wave 2)
 */

import React from 'react';
import {
  EdgeProps,
  getBezierPath,
  EdgeLabelRenderer,
  BaseEdge,
} from 'reactflow';
import type { EdgeData } from '../../lib/types/ui-types';
import {
  getEdgeStyle,
  toReactFlowStyle,
  getEdgeLabel,
  type EdgeType,
} from '../../lib/styles/edgeStyles';
import { cn } from '../nodes/styles';

export interface CustomEdgeProps extends EdgeProps {
  data?: EdgeData;
}

/**
 * Custom Edge Component
 *
 * Usage:
 * ```tsx
 * const edgeTypes = {
 *   custom: CustomEdge,
 * };
 * ```
 */
export const CustomEdge: React.FC<CustomEdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
  selected,
}) => {
  const edgeType: EdgeType = (data?.type || 'toolRef') as EdgeType;
  const edgeConfig = getEdgeStyle(edgeType);

  // Calculate path
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Combine styles using the new edge style system
  const pathStyle = {
    ...style,
    ...toReactFlowStyle(edgeConfig),
  };

  // Enhanced class names for animations and states
  const pathClassName = cn(
    'transition-all duration-300 ease-in-out',
    // Animated edges (toolRef and error)
    edgeConfig.animated && 'animate-flow',
    // Selected state
    selected && 'drop-shadow-lg brightness-110',
    // Hover enhancement
    'hover:brightness-125 hover:drop-shadow-md'
  );

  // Get label configuration
  const labelConfig = getEdgeLabel(
    edgeType,
    data?.label || (data?.order ? `${edgeType} ${data.order}` : undefined)
  );

  return (
    <>
      {/* Base edge path */}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={pathStyle}
        className={pathClassName}
      />

      {/* Animated flow marker for animated edges (toolRef, error) */}
      {edgeConfig.animated && (
        <g>
          {/* Primary animated dot */}
          <circle r="4" fill={edgeConfig.color} opacity="0.8">
            <animateMotion dur="2s" repeatCount="indefinite" path={edgePath} />
          </circle>
          {/* Secondary animated dot (offset) for enhanced effect */}
          <circle r="3" fill={edgeConfig.color} opacity="0.5">
            <animateMotion
              dur="2s"
              repeatCount="indefinite"
              path={edgePath}
              begin="1s"
            />
          </circle>
        </g>
      )}

      {/* Edge label */}
      {labelConfig && (
        <EdgeLabelRenderer>
          <div
            className={cn(
              'absolute px-2 py-1 text-xs font-semibold rounded-md pointer-events-auto',
              'bg-white border-2 shadow-md backdrop-blur-sm',
              'transition-all duration-200',
              selected && 'ring-2 ring-offset-1 scale-110',
              'hover:shadow-lg hover:scale-105'
            )}
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              borderColor: edgeConfig.color,
              color: edgeConfig.color,
              backgroundColor: selected ? `${edgeConfig.color}10` : 'white',
            }}
            title={
              data?.metadata
                ? JSON.stringify(data.metadata, null, 2)
                : edgeConfig.description
            }
          >
            {labelConfig.text}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export default CustomEdge;
