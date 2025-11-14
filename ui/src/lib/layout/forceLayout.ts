/**
 * Force-Directed Layout Algorithm
 *
 * Uses d3-force for physics-based force-directed graph layout.
 * Best for exploring relationships and natural clustering.
 *
 * @module lib/layout/forceLayout
 * @version 1.0.0
 * @author Layout System Engineer (Agent 2+)
 */

import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from 'd3-force';
import type { Node, Edge } from 'reactflow';

export interface ForceLayoutOptions {
  /** Number of simulation iterations */
  iterations?: number;

  /** Strength of the attractive force between connected nodes */
  linkStrength?: number;

  /** Distance between connected nodes */
  linkDistance?: number;

  /** Strength of the repulsive force between all nodes */
  chargeStrength?: number;

  /** Collision radius for nodes */
  collisionRadius?: number;

  /** Center X position */
  centerX?: number;

  /** Center Y position */
  centerY?: number;
}

const DEFAULT_OPTIONS: Required<ForceLayoutOptions> = {
  iterations: 300,
  linkStrength: 0.5,
  linkDistance: 150,
  chargeStrength: -500,
  collisionRadius: 100,
  centerX: 500,
  centerY: 400,
};

interface ForceNode extends SimulationNodeDatum {
  id: string;
  originalNode: Node;
}

interface ForceLink extends SimulationLinkDatum<ForceNode> {
  source: string;
  target: string;
}

/**
 * Apply force-directed layout to nodes
 *
 * Performance target: < 200ms for 50 nodes
 *
 * @param nodes - Input nodes
 * @param edges - Input edges
 * @param options - Layout options
 * @returns Positioned nodes
 */
export function applyForceLayout(
  nodes: Node[],
  edges: Edge[],
  options: ForceLayoutOptions = {}
): Node[] {
  const startTime = performance.now();
  const opts = { ...DEFAULT_OPTIONS, ...options };

  if (nodes.length === 0) return [];

  // Convert nodes to d3-force format
  const forceNodes: ForceNode[] = nodes.map((node) => ({
    id: node.id,
    originalNode: node,
    // Initialize with current position if available
    x: node.position?.x ?? opts.centerX + (Math.random() - 0.5) * 200,
    y: node.position?.y ?? opts.centerY + (Math.random() - 0.5) * 200,
  }));

  // Convert edges to d3-force format
  const forceLinks: ForceLink[] = edges.map((edge) => ({
    source: edge.source,
    target: edge.target,
  }));

  // Create simulation
  const simulation = forceSimulation(forceNodes)
    .force(
      'link',
      forceLink<ForceNode, ForceLink>(forceLinks)
        .id((d) => d.id)
        .strength(opts.linkStrength)
        .distance(opts.linkDistance)
    )
    .force('charge', forceManyBody().strength(opts.chargeStrength))
    .force('center', forceCenter(opts.centerX, opts.centerY))
    .force('collide', forceCollide(opts.collisionRadius))
    .stop();

  // Run simulation for specified iterations
  for (let i = 0; i < opts.iterations; i++) {
    simulation.tick();
  }

  // Apply calculated positions back to nodes
  const layoutedNodes = forceNodes.map((forceNode) => ({
    ...forceNode.originalNode,
    position: {
      x: forceNode.x ?? 0,
      y: forceNode.y ?? 0,
    },
    // Add transition style for smooth animation
    style: {
      ...forceNode.originalNode.style,
      transition: 'all 0.3s ease-in-out',
    },
  }));

  const duration = performance.now() - startTime;

  // Log performance warning if too slow
  if (duration > 200) {
    console.warn(`Force layout took ${duration.toFixed(2)}ms (target: <200ms)`);
  }

  return layoutedNodes;
}

/**
 * Apply force layout with custom forces
 *
 * Advanced version that allows custom force configurations.
 *
 * @param nodes - Input nodes
 * @param edges - Input edges
 * @param forces - Custom force configuration
 * @returns Positioned nodes
 */
export function applyCustomForceLayout(
  nodes: Node[],
  edges: Edge[],
  forces: {
    link?: ReturnType<typeof forceLink>;
    charge?: ReturnType<typeof forceManyBody>;
    center?: ReturnType<typeof forceCenter>;
    collide?: ReturnType<typeof forceCollide>;
  },
  iterations: number = 300
): Node[] {
  if (nodes.length === 0) return [];

  const forceNodes: ForceNode[] = nodes.map((node) => ({
    id: node.id,
    originalNode: node,
    x: node.position?.x ?? 500 + (Math.random() - 0.5) * 200,
    y: node.position?.y ?? 400 + (Math.random() - 0.5) * 200,
  }));

  const simulation = forceSimulation(forceNodes);

  // Apply custom forces
  if (forces.link) simulation.force('link', forces.link);
  if (forces.charge) simulation.force('charge', forces.charge);
  if (forces.center) simulation.force('center', forces.center);
  if (forces.collide) simulation.force('collide', forces.collide);

  simulation.stop();

  // Run simulation
  for (let i = 0; i < iterations; i++) {
    simulation.tick();
  }

  return forceNodes.map((forceNode) => ({
    ...forceNode.originalNode,
    position: {
      x: forceNode.x ?? 0,
      y: forceNode.y ?? 0,
    },
    style: {
      ...forceNode.originalNode.style,
      transition: 'all 0.3s ease-in-out',
    },
  }));
}
