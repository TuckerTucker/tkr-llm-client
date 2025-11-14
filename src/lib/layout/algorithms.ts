/**
 * Layout Algorithms
 *
 * Implementation of various graph layout algorithms including Dagre, Force-Directed,
 * ELK, Grid, Circular, and Tree layouts for automatic node positioning.
 *
 * @module lib/layout/algorithms
 * @version 1.0.0
 * @author Layout Engineer (Agent 6) - Wave 2
 */

import dagre from '@dagrejs/dagre';
import * as d3Force from 'd3-force';
import ELK from 'elkjs/lib/elk.bundled.js';
import { Node, Edge } from '../types/reactflow';
import { NodeData, EdgeData } from '../types/ui-types';
import {
  LayoutConfig,
  LayoutAlgorithm,
  DagreConfig,
  ForceConfig,
  ElkConfig,
  GridConfig,
  CircularConfig,
  TreeConfig,
  getNodeDimensions,
  LayoutDirection,
} from './config';

/**
 * Layout result containing positioned nodes
 */
export interface LayoutResult {
  nodes: Node<NodeData>[];
  bounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    width: number;
    height: number;
  };
}

/**
 * Apply layout algorithm to nodes and edges
 */
export async function applyLayout(
  nodes: Node<NodeData>[],
  edges: Edge<EdgeData>[],
  config: LayoutConfig
): Promise<LayoutResult> {
  switch (config.algorithm) {
    case LayoutAlgorithm.DAGRE:
      return applyDagreLayout(nodes, edges, config.dagre, config);
    case LayoutAlgorithm.FORCE_DIRECTED:
      return applyForceDirectedLayout(nodes, edges, config.force, config);
    case LayoutAlgorithm.ELK:
      return applyElkLayout(nodes, edges, config.elk, config);
    case LayoutAlgorithm.GRID:
      return applyGridLayout(nodes, config.grid, config);
    case LayoutAlgorithm.CIRCULAR:
      return applyCircularLayout(nodes, config.circular, config);
    case LayoutAlgorithm.TREE:
      return applyTreeLayout(nodes, edges, config.tree, config);
    case LayoutAlgorithm.MANUAL:
      // Return nodes as-is
      return {
        nodes,
        bounds: calculateBounds(nodes),
      };
    default:
      throw new Error(`Unknown layout algorithm: ${config.algorithm}`);
  }
}

/**
 * Calculate bounding box for nodes
 */
export function calculateBounds(nodes: Node<NodeData>[]): LayoutResult['bounds'] {
  if (nodes.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const node of nodes) {
    const dims = getNodeDimensions(node);
    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x + dims.width);
    maxY = Math.max(maxY, node.position.y + dims.height);
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
 * Apply Dagre hierarchical layout
 */
export function applyDagreLayout(
  nodes: Node<NodeData>[],
  edges: Edge<EdgeData>[],
  dagreConfig: DagreConfig,
  layoutConfig: LayoutConfig
): LayoutResult {
  const graph = new dagre.graphlib.Graph();

  // Set graph configuration
  graph.setGraph({
    rankdir: dagreConfig.direction,
    nodesep: dagreConfig.nodeSep,
    ranksep: dagreConfig.rankSep,
    edgesep: dagreConfig.edgeSep,
    ranker: dagreConfig.ranker,
    align: dagreConfig.align,
  });

  // Default edge config
  graph.setDefaultEdgeLabel(() => ({}));

  // Add nodes to graph
  for (const node of nodes) {
    const dims = getNodeDimensions(node, layoutConfig.nodeSizing);
    graph.setNode(node.id, {
      width: dims.width,
      height: dims.height,
    });
  }

  // Add edges to graph
  for (const edge of edges) {
    graph.setEdge(edge.source, edge.target);
  }

  // Run layout
  dagre.layout(graph);

  // Extract positioned nodes
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = graph.node(node.id);
    const dims = getNodeDimensions(node, layoutConfig.nodeSizing);

    return {
      ...node,
      position: {
        // Dagre returns center position, convert to top-left
        x: nodeWithPosition.x - dims.width / 2,
        y: nodeWithPosition.y - dims.height / 2,
      },
    };
  });

  return {
    nodes: layoutedNodes,
    bounds: calculateBounds(layoutedNodes),
  };
}

/**
 * Apply Force-Directed layout
 */
export function applyForceDirectedLayout(
  nodes: Node<NodeData>[],
  edges: Edge<EdgeData>[],
  forceConfig: ForceConfig,
  layoutConfig: LayoutConfig
): LayoutResult {
  // Create simulation nodes with initial positions
  const simNodes = nodes.map((node) => ({
    id: node.id,
    x: node.position.x,
    y: node.position.y,
    ...getNodeDimensions(node, layoutConfig.nodeSizing),
  }));

  // Create simulation links
  const simLinks = edges.map((edge) => ({
    source: edge.source,
    target: edge.target,
  }));

  // Create force simulation
  const simulation = d3Force
    .forceSimulation(simNodes)
    .force(
      'link',
      d3Force
        .forceLink(simLinks)
        .id((d: any) => d.id)
        .distance(forceConfig.linkDistance)
        .strength(forceConfig.linkStrength)
    )
    .force('charge', d3Force.forceManyBody().strength(forceConfig.chargeStrength))
    .force('center', d3Force.forceCenter(0, 0).strength(forceConfig.centerStrength))
    .force(
      'collision',
      d3Force
        .forceCollide()
        .radius((_d: any) => forceConfig.collisionRadius)
        .strength(1)
    )
    .alpha(forceConfig.alpha)
    .alphaDecay(forceConfig.alphaDecay);

  // Run simulation synchronously
  for (let i = 0; i < forceConfig.iterations; i++) {
    simulation.tick();
  }

  // Extract positioned nodes
  const layoutedNodes = nodes.map((node, i) => ({
    ...node,
    position: {
      x: simNodes[i].x || 0,
      y: simNodes[i].y || 0,
    },
  }));

  return {
    nodes: layoutedNodes,
    bounds: calculateBounds(layoutedNodes),
  };
}

/**
 * Apply ELK layout (Eclipse Layout Kernel)
 */
export async function applyElkLayout(
  nodes: Node<NodeData>[],
  edges: Edge<EdgeData>[],
  elkConfig: ElkConfig,
  layoutConfig: LayoutConfig
): Promise<LayoutResult> {
  const elk = new ELK();

  // Build ELK graph
  const elkGraph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': elkConfig.algorithm,
      'elk.direction': elkConfig.direction,
      'elk.spacing.nodeNode': String(elkConfig.spacing),
      'elk.layered.spacing.nodeNodeBetweenLayers': String(elkConfig.layerSpacing),
      ...(elkConfig.aspectRatio && {
        'elk.aspectRatio': String(elkConfig.aspectRatio),
      }),
    },
    children: nodes.map((node) => {
      const dims = getNodeDimensions(node, layoutConfig.nodeSizing);
      return {
        id: node.id,
        width: dims.width,
        height: dims.height,
      };
    }),
    edges: edges.map((edge) => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    })),
  };

  // Run layout
  const layouted = await elk.layout(elkGraph);

  // Extract positioned nodes
  const layoutedNodes = nodes.map((node) => {
    const elkNode = layouted.children?.find((n) => n.id === node.id);
    return {
      ...node,
      position: {
        x: elkNode?.x || 0,
        y: elkNode?.y || 0,
      },
    };
  });

  return {
    nodes: layoutedNodes,
    bounds: calculateBounds(layoutedNodes),
  };
}

/**
 * Apply Grid layout
 */
export function applyGridLayout(
  nodes: Node<NodeData>[],
  gridConfig: GridConfig,
  _layoutConfig: LayoutConfig
): LayoutResult {
  const { columns, cellWidth, cellHeight, spacingX, spacingY, startX, startY } = gridConfig;

  // Calculate columns if auto
  const numColumns = columns > 0 ? columns : Math.ceil(Math.sqrt(nodes.length));

  const layoutedNodes = nodes.map((node, index) => {
    const col = index % numColumns;
    const row = Math.floor(index / numColumns);

    return {
      ...node,
      position: {
        x: startX + col * (cellWidth + spacingX),
        y: startY + row * (cellHeight + spacingY),
      },
    };
  });

  return {
    nodes: layoutedNodes,
    bounds: calculateBounds(layoutedNodes),
  };
}

/**
 * Apply Circular layout
 */
export function applyCircularLayout(
  nodes: Node<NodeData>[],
  circularConfig: CircularConfig,
  layoutConfig: LayoutConfig
): LayoutResult {
  const { radius, startAngle, sweepAngle, centerX, centerY } = circularConfig;

  const angleStep = sweepAngle / Math.max(nodes.length, 1);

  const layoutedNodes = nodes.map((node, index) => {
    const angle = startAngle + index * angleStep;
    const dims = getNodeDimensions(node, layoutConfig.nodeSizing);

    return {
      ...node,
      position: {
        x: centerX + radius * Math.cos(angle) - dims.width / 2,
        y: centerY + radius * Math.sin(angle) - dims.height / 2,
      },
    };
  });

  return {
    nodes: layoutedNodes,
    bounds: calculateBounds(layoutedNodes),
  };
}

/**
 * Apply Tree layout
 */
export function applyTreeLayout(
  nodes: Node<NodeData>[],
  edges: Edge<EdgeData>[],
  treeConfig: TreeConfig,
  layoutConfig: LayoutConfig
): LayoutResult {
  // Build adjacency map
  const childrenMap = new Map<string, string[]>();
  const parentMap = new Map<string, string>();

  for (const edge of edges) {
    // Add to children map
    if (!childrenMap.has(edge.source)) {
      childrenMap.set(edge.source, []);
    }
    childrenMap.get(edge.source)!.push(edge.target);

    // Add to parent map
    parentMap.set(edge.target, edge.source);
  }

  // Find root nodes (nodes without parents)
  const rootNodes = nodes.filter((node) => !parentMap.has(node.id));

  // If specific root requested, use that
  let roots = treeConfig.rootId
    ? nodes.filter((node) => node.id === treeConfig.rootId)
    : rootNodes;

  // If no roots found, use first node
  if (roots.length === 0 && nodes.length > 0) {
    roots = [nodes[0]];
  }

  // Position nodes level by level
  const positioned = new Map<string, { x: number; y: number }>();
  const levelWidths = new Map<number, number>();

  function positionSubtree(
    nodeId: string,
    level: number,
    offsetX: number
  ): number {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return 0;

    const dims = getNodeDimensions(node, layoutConfig.nodeSizing);
    const children = childrenMap.get(nodeId) || [];

    let currentOffset = offsetX;
    let subtreeWidth = 0;

    // Position children recursively
    if (children.length > 0) {
      for (const childId of children) {
        const childWidth = positionSubtree(childId, level + 1, currentOffset);
        currentOffset += childWidth + treeConfig.siblingSpacing;
        subtreeWidth += childWidth + treeConfig.siblingSpacing;
      }
      subtreeWidth -= treeConfig.siblingSpacing; // Remove last spacing
    } else {
      subtreeWidth = dims.width;
    }

    // Position this node centered over children
    const nodeX = offsetX + subtreeWidth / 2 - dims.width / 2;
    const nodeY = level * (dims.height + treeConfig.levelSpacing);

    positioned.set(nodeId, { x: nodeX, y: nodeY });

    // Track level width
    const currentWidth = levelWidths.get(level) || 0;
    levelWidths.set(level, Math.max(currentWidth, nodeX + dims.width));

    return subtreeWidth;
  }

  // Position all root trees
  let currentX = 0;
  for (const root of roots) {
    const treeWidth = positionSubtree(root.id, 0, currentX);
    currentX += treeWidth + treeConfig.siblingSpacing;
  }

  // Apply positions and handle direction
  const layoutedNodes = nodes.map((node) => {
    const pos = positioned.get(node.id) || { x: 0, y: 0 };

    // Transform based on direction
    let x = pos.x;
    let y = pos.y;

    switch (treeConfig.direction) {
      case LayoutDirection.TB: // Top to bottom (default)
        break;
      case LayoutDirection.BT: // Bottom to top
        y = -pos.y;
        break;
      case LayoutDirection.LR: // Left to right
        x = pos.y;
        y = pos.x;
        break;
      case LayoutDirection.RL: // Right to left
        x = -pos.y;
        y = pos.x;
        break;
    }

    return {
      ...node,
      position: { x, y },
    };
  });

  return {
    nodes: layoutedNodes,
    bounds: calculateBounds(layoutedNodes),
  };
}

/**
 * Center layout in viewport
 */
export function centerLayout(
  result: LayoutResult,
  viewportWidth: number,
  viewportHeight: number
): LayoutResult {
  const { bounds } = result;

  const offsetX = (viewportWidth - bounds.width) / 2 - bounds.minX;
  const offsetY = (viewportHeight - bounds.height) / 2 - bounds.minY;

  const centeredNodes = result.nodes.map((node) => ({
    ...node,
    position: {
      x: node.position.x + offsetX,
      y: node.position.y + offsetY,
    },
  }));

  return {
    nodes: centeredNodes,
    bounds: calculateBounds(centeredNodes),
  };
}

/**
 * Scale layout to fit viewport
 */
export function scaleLayoutToFit(
  result: LayoutResult,
  viewportWidth: number,
  viewportHeight: number,
  padding: number = 50
): LayoutResult {
  const { bounds } = result;

  if (bounds.width === 0 || bounds.height === 0) {
    return result;
  }

  const availableWidth = viewportWidth - 2 * padding;
  const availableHeight = viewportHeight - 2 * padding;

  const scaleX = availableWidth / bounds.width;
  const scaleY = availableHeight / bounds.height;
  const scale = Math.min(scaleX, scaleY, 1); // Don't scale up

  const scaledNodes = result.nodes.map((node) => ({
    ...node,
    position: {
      x: (node.position.x - bounds.minX) * scale + padding,
      y: (node.position.y - bounds.minY) * scale + padding,
    },
  }));

  return {
    nodes: scaledNodes,
    bounds: calculateBounds(scaledNodes),
  };
}
