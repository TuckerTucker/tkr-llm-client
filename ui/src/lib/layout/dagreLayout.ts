/**
 * Dagre Hierarchical Layout Algorithm
 *
 * Uses dagre for hierarchical graph layout with automatic edge routing.
 * Best for directed acyclic graphs (DAGs) and template inheritance hierarchies.
 *
 * @module lib/layout/dagreLayout
 * @version 1.0.0
 * @author Layout System Engineer (Agent 2+)
 */

import * as dagre from 'dagre';
import type { Node, Edge } from 'reactflow';

export interface DagreLayoutOptions {
  /** Layout direction: top-to-bottom, left-to-right, etc. */
  direction?: 'TB' | 'BT' | 'LR' | 'RL';

  /** Horizontal spacing between nodes */
  nodeSpacing?: number;

  /** Vertical spacing between ranks/levels */
  rankSpacing?: number;

  /** Edge separation */
  edgeSeparation?: number;

  /** Default node width */
  nodeWidth?: number;

  /** Default node height */
  nodeHeight?: number;
}

const DEFAULT_OPTIONS: Required<DagreLayoutOptions> = {
  direction: 'TB',
  nodeSpacing: 100,
  rankSpacing: 150,
  edgeSeparation: 20,
  nodeWidth: 250,
  nodeHeight: 120,
};

/**
 * Apply dagre hierarchical layout to nodes
 *
 * Performance target: < 50ms for 50 nodes
 *
 * @param nodes - Input nodes
 * @param edges - Input edges
 * @param options - Layout options
 * @returns Positioned nodes
 */
export function applyDagreLayout(
  nodes: Node[],
  edges: Edge[],
  options: DagreLayoutOptions = {}
): Node[] {
  const startTime = performance.now();
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Create a new directed graph
  const graph = new dagre.graphlib.Graph();

  // Set graph properties
  graph.setGraph({
    rankdir: opts.direction,
    nodesep: opts.nodeSpacing,
    ranksep: opts.rankSpacing,
    edgesep: opts.edgeSeparation,
    marginx: 50,
    marginy: 50,
  });

  // Default edge label
  graph.setDefaultEdgeLabel(() => ({}));

  // Add nodes to the graph
  nodes.forEach((node) => {
    // Use measured dimensions if available, otherwise use defaults
    const width = node.width ?? node.style?.width ?? opts.nodeWidth;
    const height = node.height ?? node.style?.height ?? opts.nodeHeight;

    graph.setNode(node.id, {
      width: typeof width === 'number' ? width : opts.nodeWidth,
      height: typeof height === 'number' ? height : opts.nodeHeight,
    });
  });

  // Add edges to the graph
  edges.forEach((edge) => {
    graph.setEdge(edge.source, edge.target);
  });

  // Calculate layout
  dagre.layout(graph);

  // Apply calculated positions to nodes with animation transition
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = graph.node(node.id);

    if (!nodeWithPosition) {
      // Node not in graph, return as-is
      return node;
    }

    // Dagre gives us the center position, but ReactFlow wants top-left
    const width = nodeWithPosition.width;
    const height = nodeWithPosition.height;

    return {
      ...node,
      position: {
        x: nodeWithPosition.x - width / 2,
        y: nodeWithPosition.y - height / 2,
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
  if (duration > 50) {
    console.warn(`Dagre layout took ${duration.toFixed(2)}ms (target: <50ms)`);
  }

  return layoutedNodes;
}

/**
 * Get layout metrics for debugging
 *
 * @param nodes - Layouted nodes
 * @returns Layout metrics
 */
export function getDagreLayoutMetrics(nodes: Node[]) {
  if (nodes.length === 0) {
    return { width: 0, height: 0, nodeCount: 0 };
  }

  const xs = nodes.map((n) => n.position.x);
  const ys = nodes.map((n) => n.position.y);

  return {
    width: Math.max(...xs) - Math.min(...xs),
    height: Math.max(...ys) - Math.min(...ys),
    nodeCount: nodes.length,
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
}
