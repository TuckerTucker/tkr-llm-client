/**
 * ReactFlow Type Stubs
 *
 * Minimal type definitions for ReactFlow Node and Edge structures.
 * These match the ReactFlow API and will be compatible when ReactFlow is installed.
 *
 * @module lib/types/reactflow
 * @version 1.0.0
 * @author Data Bridge Engineer (Agent 1)
 */

/**
 * ReactFlow Node structure.
 *
 * Represents a node in the ReactFlow canvas with position and data.
 */
export interface Node<T = any> {
  /** Unique node identifier */
  id: string;

  /** Node type (for custom rendering) */
  type?: string;

  /** Node position on canvas */
  position: {
    x: number;
    y: number;
  };

  /** Node data (application-specific) */
  data: T;

  /** Whether node is draggable */
  draggable?: boolean;

  /** Whether node is selectable */
  selectable?: boolean;

  /** CSS class name */
  className?: string;

  /** Custom style */
  style?: Record<string, any>;

  /** Node dimensions */
  width?: number;
  height?: number;

  /** Whether node is selected */
  selected?: boolean;

  /** Parent node ID (for nested nodes) */
  parentNode?: string;
}

/**
 * ReactFlow Edge structure.
 *
 * Represents a connection between two nodes.
 */
export interface Edge<T = any> {
  /** Unique edge identifier */
  id: string;

  /** Source node ID */
  source: string;

  /** Target node ID */
  target: string;

  /** Edge type (for custom rendering) */
  type?: string;

  /** Source handle ID */
  sourceHandle?: string;

  /** Target handle ID */
  targetHandle?: string;

  /** Edge label */
  label?: string;

  /** Whether edge is animated */
  animated?: boolean;

  /** Edge data (application-specific) */
  data?: T;

  /** CSS class name */
  className?: string;

  /** Custom style */
  style?: Record<string, any>;

  /** Marker at edge end */
  markerEnd?: string;

  /** Marker at edge start */
  markerStart?: string;

  /** Whether edge is selected */
  selected?: boolean;
}
