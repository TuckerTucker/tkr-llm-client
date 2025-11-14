/**
 * ELK (Eclipse Layout Kernel) Layout Algorithm
 *
 * Advanced hierarchical layout engine with sophisticated edge routing.
 * Best for complex graphs with many edges and hierarchical structures.
 *
 * @module lib/layout/elkLayout
 * @version 1.0.0
 * @author Layout System Engineer (Agent 2+)
 */

import ELK, { type ElkNode, type ElkExtendedEdge } from 'elkjs/lib/elk.bundled.js';
import type { Node, Edge } from 'reactflow';

export interface ELKLayoutOptions {
  /** Layout algorithm */
  algorithm?: 'layered' | 'force' | 'mrtree' | 'radial' | 'disco';

  /** Layout direction */
  direction?: 'RIGHT' | 'LEFT' | 'DOWN' | 'UP';

  /** Node spacing */
  spacing?: number;

  /** Layer spacing (for layered algorithm) */
  layerSpacing?: number;

  /** Edge routing style */
  edgeRouting?: 'ORTHOGONAL' | 'POLYLINE' | 'SPLINES';

  /** Node width */
  nodeWidth?: number;

  /** Node height */
  nodeHeight?: number;
}

const DEFAULT_OPTIONS: Required<ELKLayoutOptions> = {
  algorithm: 'layered',
  direction: 'DOWN',
  spacing: 75,
  layerSpacing: 100,
  edgeRouting: 'ORTHOGONAL',
  nodeWidth: 250,
  nodeHeight: 120,
};

/**
 * Apply ELK layout to nodes
 *
 * Performance target: < 100ms for 50 nodes
 *
 * @param nodes - Input nodes
 * @param edges - Input edges
 * @param options - Layout options
 * @returns Positioned nodes
 */
export async function applyELKLayout(
  nodes: Node[],
  edges: Edge[],
  options: ELKLayoutOptions = {}
): Promise<Node[]> {
  const startTime = performance.now();
  const opts = { ...DEFAULT_OPTIONS, ...options };

  if (nodes.length === 0) return [];

  // Create ELK instance
  const elk = new ELK();

  // Convert nodes to ELK format
  const elkNodes: ElkNode[] = nodes.map((node) => ({
    id: node.id,
    width: node.width ?? opts.nodeWidth,
    height: node.height ?? opts.nodeHeight,
    // Store original node as property
    properties: {
      originalNode: node,
    },
  }));

  // Convert edges to ELK format
  const elkEdges: ElkExtendedEdge[] = edges.map((edge) => ({
    id: edge.id,
    sources: [edge.source],
    targets: [edge.target],
  }));

  // Create ELK graph
  const graph: ElkNode = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': opts.algorithm,
      'elk.direction': opts.direction,
      'elk.spacing.nodeNode': String(opts.spacing),
      'elk.layered.spacing.nodeNodeBetweenLayers': String(opts.layerSpacing),
      'elk.edgeRouting': opts.edgeRouting,
      'elk.padding': '[top=50,left=50,bottom=50,right=50]',
    },
    children: elkNodes,
    edges: elkEdges,
  };

  try {
    // Layout the graph
    const layoutedGraph = await elk.layout(graph);

    // Apply calculated positions to nodes
    const layoutedNodes = nodes.map((node) => {
      const elkNode = layoutedGraph.children?.find((n) => n.id === node.id);

      if (!elkNode) {
        // Node not found in layout, return as-is
        return node;
      }

      return {
        ...node,
        position: {
          x: elkNode.x ?? 0,
          y: elkNode.y ?? 0,
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
    if (duration > 100) {
      console.warn(`ELK layout took ${duration.toFixed(2)}ms (target: <100ms)`);
    }

    return layoutedNodes;
  } catch (error) {
    console.error('ELK layout failed:', error);
    // Return nodes with original positions on error
    return nodes;
  }
}

/**
 * Synchronous wrapper for ELK layout (for compatibility)
 *
 * Note: This starts the layout but doesn't wait for it to complete.
 * Use the async version when possible.
 *
 * @param nodes - Input nodes
 * @param edges - Input edges
 * @param options - Layout options
 * @returns Nodes (may not be positioned yet)
 */
export function applyELKLayoutSync(
  nodes: Node[],
  edges: Edge[],
  options: ELKLayoutOptions = {}
): Node[] {
  // Start async layout but return immediately
  applyELKLayout(nodes, edges, options).catch((error) => {
    console.error('ELK layout error:', error);
  });

  // Return nodes as-is for now
  return nodes;
}
