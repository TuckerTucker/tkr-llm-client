/**
 * Tree Layout Algorithm
 *
 * Arranges nodes in a strict tree hierarchy with parent-child relationships.
 * Best for templates with clear inheritance chains.
 *
 * @module lib/layout/treeLayout
 * @version 1.0.0
 * @author Layout System Engineer (Agent 2+)
 */

import type { Node, Edge } from 'reactflow';

export interface TreeLayoutOptions {
  /** Layout direction */
  direction?: 'TB' | 'BT' | 'LR' | 'RL';

  /** Horizontal spacing between sibling nodes */
  siblingSpacing?: number;

  /** Vertical spacing between levels */
  levelSpacing?: number;

  /** Starting X position */
  startX?: number;

  /** Starting Y position */
  startY?: number;

  /** Node width for collision detection */
  nodeWidth?: number;

  /** Node height for collision detection */
  nodeHeight?: number;
}

const DEFAULT_OPTIONS: Required<TreeLayoutOptions> = {
  direction: 'TB',
  siblingSpacing: 150,
  levelSpacing: 200,
  startX: 500,
  startY: 100,
  nodeWidth: 250,
  nodeHeight: 120,
};

interface TreeNode {
  id: string;
  originalNode: Node;
  children: TreeNode[];
  parent?: TreeNode;
  level: number;
  x: number;
  y: number;
  mod: number; // Modifier for positioning algorithm
}

/**
 * Apply tree layout to nodes
 *
 * Uses a modified Reingold-Tilford algorithm for tree layout.
 * Performance target: < 30ms
 *
 * @param nodes - Input nodes
 * @param edges - Input edges
 * @param options - Layout options
 * @returns Positioned nodes
 */
export function applyTreeLayout(
  nodes: Node[],
  edges: Edge[],
  options: TreeLayoutOptions = {}
): Node[] {
  const startTime = performance.now();
  const opts = { ...DEFAULT_OPTIONS, ...options };

  if (nodes.length === 0) return [];

  // Build tree structure
  const treeNodes = buildTree(nodes, edges);

  if (treeNodes.length === 0) {
    // No tree structure found, fall back to simple layout
    return layoutNodesWithoutTree(nodes, opts);
  }

  // Layout each tree (may have multiple roots)
  treeNodes.forEach((root) => {
    layoutTree(root, opts);
  });

  // Convert tree nodes back to ReactFlow nodes
  const layoutedNodes = nodes.map((node) => {
    const treeNode = findTreeNode(treeNodes, node.id);

    if (!treeNode) {
      // Node not in tree, keep original position
      return node;
    }

    let position: { x: number; y: number };

    // Apply direction transformation
    switch (opts.direction) {
      case 'TB': // Top to Bottom
        position = { x: treeNode.x, y: treeNode.y };
        break;
      case 'BT': // Bottom to Top
        position = { x: treeNode.x, y: -treeNode.y };
        break;
      case 'LR': // Left to Right
        position = { x: treeNode.y, y: treeNode.x };
        break;
      case 'RL': // Right to Left
        position = { x: -treeNode.y, y: treeNode.x };
        break;
      default:
        position = { x: treeNode.x, y: treeNode.y };
    }

    return {
      ...node,
      position,
      // Add transition style for smooth animation
      style: {
        ...node.style,
        transition: 'all 0.3s ease-in-out',
      },
    };
  });

  const duration = performance.now() - startTime;

  // Log performance warning if too slow
  if (duration > 30) {
    console.warn(`Tree layout took ${duration.toFixed(2)}ms (target: <30ms)`);
  }

  return layoutedNodes;
}

/**
 * Build tree structure from nodes and edges
 */
function buildTree(nodes: Node[], edges: Edge[]): TreeNode[] {
  // Create node map
  const nodeMap = new Map<string, TreeNode>();
  nodes.forEach((node) => {
    nodeMap.set(node.id, {
      id: node.id,
      originalNode: node,
      children: [],
      level: 0,
      x: 0,
      y: 0,
      mod: 0,
    });
  });

  // Build parent-child relationships
  const roots: TreeNode[] = [];
  const childSet = new Set<string>();

  edges.forEach((edge) => {
    const parent = nodeMap.get(edge.source);
    const child = nodeMap.get(edge.target);

    if (parent && child) {
      parent.children.push(child);
      child.parent = parent;
      childSet.add(child.id);
    }
  });

  // Find root nodes (nodes with no parents)
  nodes.forEach((node) => {
    if (!childSet.has(node.id)) {
      const treeNode = nodeMap.get(node.id);
      if (treeNode) {
        roots.push(treeNode);
      }
    }
  });

  // Calculate levels
  roots.forEach((root) => {
    calculateLevels(root, 0);
  });

  return roots;
}

/**
 * Calculate level for each node in tree
 */
function calculateLevels(node: TreeNode, level: number): void {
  node.level = level;
  node.children.forEach((child) => {
    calculateLevels(child, level + 1);
  });
}

/**
 * Layout tree using modified Reingold-Tilford algorithm
 */
function layoutTree(root: TreeNode, opts: Required<TreeLayoutOptions>): void {
  // First pass: Calculate initial positions
  firstWalk(root, opts);

  // Second pass: Apply modifiers and set final positions
  secondWalk(root, 0, opts);
}

/**
 * First walk: Calculate initial x positions and modifiers
 */
function firstWalk(node: TreeNode, opts: Required<TreeLayoutOptions>): void {
  if (node.children.length === 0) {
    // Leaf node
    if (node.parent && node.parent.children[0] === node) {
      // First child
      node.x = 0;
    } else {
      // Not first child, place after previous sibling
      const prevSibling = getPreviousSibling(node);
      if (prevSibling) {
        node.x = prevSibling.x + opts.siblingSpacing;
      }
    }
  } else {
    // Internal node
    node.children.forEach((child) => firstWalk(child, opts));

    // Center node above children
    const firstChild = node.children[0];
    const lastChild = node.children[node.children.length - 1];
    const midPoint = (firstChild.x + lastChild.x) / 2;

    if (node.parent && node.parent.children[0] === node) {
      node.x = midPoint;
    } else {
      const prevSibling = getPreviousSibling(node);
      if (prevSibling) {
        node.x = prevSibling.x + opts.siblingSpacing;
        node.mod = node.x - midPoint;
      } else {
        node.x = midPoint;
      }
    }
  }
}

/**
 * Second walk: Apply modifiers and set final positions
 */
function secondWalk(
  node: TreeNode,
  modSum: number,
  opts: Required<TreeLayoutOptions>
): void {
  node.x = opts.startX + node.x + modSum;
  node.y = opts.startY + node.level * opts.levelSpacing;

  node.children.forEach((child) => {
    secondWalk(child, modSum + node.mod, opts);
  });
}

/**
 * Get previous sibling of a node
 */
function getPreviousSibling(node: TreeNode): TreeNode | undefined {
  if (!node.parent) return undefined;

  const siblings = node.parent.children;
  const index = siblings.indexOf(node);

  return index > 0 ? siblings[index - 1] : undefined;
}

/**
 * Find tree node by ID
 */
function findTreeNode(roots: TreeNode[], id: string): TreeNode | undefined {
  for (const root of roots) {
    const found = findTreeNodeRecursive(root, id);
    if (found) return found;
  }
  return undefined;
}

function findTreeNodeRecursive(node: TreeNode, id: string): TreeNode | undefined {
  if (node.id === id) return node;

  for (const child of node.children) {
    const found = findTreeNodeRecursive(child, id);
    if (found) return found;
  }

  return undefined;
}

/**
 * Fallback layout for nodes without tree structure
 */
function layoutNodesWithoutTree(
  nodes: Node[],
  opts: Required<TreeLayoutOptions>
): Node[] {
  return nodes.map((node, index) => ({
    ...node,
    position: {
      x: opts.startX + (index % 3) * opts.siblingSpacing,
      y: opts.startY + Math.floor(index / 3) * opts.levelSpacing,
    },
    style: {
      ...node.style,
      transition: 'all 0.3s ease-in-out',
    },
  }));
}
