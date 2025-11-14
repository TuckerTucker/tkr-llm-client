/**
 * Mode Filter Utilities
 *
 * Provides filtering functions for nodes and edges based on the active view mode.
 * Each mode has specific visibility rules to highlight relevant information.
 *
 * @module lib/modes/filters
 * @version 1.0.0
 * @author Mode System Engineer (Agent 1) - Wave 2
 */

import type { Node, Edge } from 'reactflow';
import type { ViewMode } from '@backend/lib/modes/types';

// ============================================================================
// FILTER RESULT TYPE
// ============================================================================

/**
 * Result of applying mode filters.
 */
export interface FilterResult {
  /** Filtered nodes */
  nodes: Node[];

  /** Filtered edges */
  edges: Edge[];

  /** Statistics about filtering */
  stats: {
    totalNodes: number;
    visibleNodes: number;
    hiddenNodes: number;
    totalEdges: number;
    visibleEdges: number;
    hiddenEdges: number;
  };
}

// ============================================================================
// MODE FILTER FUNCTIONS
// ============================================================================

/**
 * Apply filters based on the current view mode.
 *
 * @param nodes - All nodes
 * @param edges - All edges
 * @param mode - Current view mode
 * @returns Filtered nodes and edges
 */
export function applyModeFilters(nodes: Node[], edges: Edge[], mode: ViewMode): FilterResult {
  let filteredNodes: Node[];
  let filteredEdges: Edge[];

  switch (mode) {
    case 'explorer':
      ({ nodes: filteredNodes, edges: filteredEdges } = filterExplorerMode(nodes, edges));
      break;

    case 'composition':
      ({ nodes: filteredNodes, edges: filteredEdges } = filterCompositionMode(nodes, edges));
      break;

    case 'dependency':
      ({ nodes: filteredNodes, edges: filteredEdges } = filterDependencyMode(nodes, edges));
      break;

    case 'execution':
      ({ nodes: filteredNodes, edges: filteredEdges } = filterExecutionMode(nodes, edges));
      break;

    case 'validation':
      ({ nodes: filteredNodes, edges: filteredEdges } = filterValidationMode(nodes, edges));
      break;

    default:
      filteredNodes = nodes;
      filteredEdges = edges;
  }

  return {
    nodes: filteredNodes,
    edges: filteredEdges,
    stats: {
      totalNodes: nodes.length,
      visibleNodes: filteredNodes.length,
      hiddenNodes: nodes.length - filteredNodes.length,
      totalEdges: edges.length,
      visibleEdges: filteredEdges.length,
      hiddenEdges: edges.length - filteredEdges.length,
    },
  };
}

// ============================================================================
// EXPLORER MODE
// ============================================================================

/**
 * Explorer mode: Show all nodes and relationships (default view).
 *
 * @param nodes - All nodes
 * @param edges - All edges
 * @returns All nodes and edges (no filtering)
 */
function filterExplorerMode(nodes: Node[], edges: Edge[]): { nodes: Node[]; edges: Edge[] } {
  // Show everything in Explorer mode
  return { nodes, edges };
}

// ============================================================================
// COMPOSITION MODE
// ============================================================================

/**
 * Composition mode: Focus on template structure and fragments.
 * - Show: Template nodes, fragment nodes, composition edges
 * - Hide: Variables, tool details (unless directly related to composition)
 *
 * @param nodes - All nodes
 * @param edges - All edges
 * @returns Filtered nodes and edges
 */
function filterCompositionMode(nodes: Node[], edges: Edge[]): { nodes: Node[]; edges: Edge[] } {
  // Show template, fragment, bundle, and resolved nodes
  const filteredNodes = nodes.filter((node) => {
    const nodeType = node.type || '';
    return (
      nodeType === 'template' ||
      nodeType === 'fragment' ||
      nodeType === 'bundle' ||
      nodeType === 'resolved'
    );
  });

  // Get visible node IDs
  const visibleNodeIds = new Set(filteredNodes.map((n) => n.id));

  // Show extends, mixin, and composition-related edges
  const filteredEdges = edges.filter((edge) => {
    const edgeType = edge.type || '';
    const sourceVisible = visibleNodeIds.has(edge.source);
    const targetVisible = visibleNodeIds.has(edge.target);

    return (
      (sourceVisible && targetVisible) &&
      (edgeType === 'extends' || edgeType === 'mixin' || edgeType === 'composition')
    );
  });

  return { nodes: filteredNodes, edges: filteredEdges };
}

// ============================================================================
// DEPENDENCY MODE
// ============================================================================

/**
 * Dependency mode: Show template dependencies.
 * - Show: Template nodes, extends edges, mixin edges
 * - Hide: Tools, variables, internal edges
 *
 * @param nodes - All nodes
 * @param edges - All edges
 * @returns Filtered nodes and edges
 */
function filterDependencyMode(nodes: Node[], edges: Edge[]): { nodes: Node[]; edges: Edge[] } {
  // Show only template and bundle nodes
  const filteredNodes = nodes.filter((node) => {
    const nodeType = node.type || '';
    return nodeType === 'template' || nodeType === 'bundle' || nodeType === 'fragment';
  });

  // Get visible node IDs
  const visibleNodeIds = new Set(filteredNodes.map((n) => n.id));

  // Show only dependency edges (extends, mixin)
  const filteredEdges = edges.filter((edge) => {
    const edgeType = edge.type || '';
    const sourceVisible = visibleNodeIds.has(edge.source);
    const targetVisible = visibleNodeIds.has(edge.target);

    return (
      (sourceVisible && targetVisible) &&
      (edgeType === 'extends' || edgeType === 'mixin')
    );
  });

  return { nodes: filteredNodes, edges: filteredEdges };
}

// ============================================================================
// EXECUTION MODE
// ============================================================================

/**
 * Execution mode: Show runtime flow with variables.
 * - Show: All nodes with emphasis on variables
 * - Highlight: Execution flow
 *
 * @param nodes - All nodes
 * @param edges - All edges
 * @returns All nodes and edges with execution emphasis
 */
function filterExecutionMode(nodes: Node[], edges: Edge[]): { nodes: Node[]; edges: Edge[] } {
  // Show all nodes (execution mode needs full context)
  const filteredNodes = nodes.map((node) => {
    // Enhance variable nodes for execution mode
    if (node.type === 'variable') {
      return {
        ...node,
        data: {
          ...node.data,
          // Add execution-specific styling or metadata
          executionMode: true,
        },
      };
    }
    return node;
  });

  // Show all edges, but prioritize variable and tool edges
  const filteredEdges = edges.map((edge) => {
    const edgeType = edge.type || '';
    if (edgeType === 'variable' || edgeType === 'toolRef') {
      return {
        ...edge,
        // Emphasize execution-related edges
        style: {
          ...edge.style,
          strokeWidth: 2,
        },
      };
    }
    return edge;
  });

  return { nodes: filteredNodes, edges: filteredEdges };
}

// ============================================================================
// VALIDATION MODE
// ============================================================================

/**
 * Validation mode: Show validation status and errors.
 * - Show: Nodes with validation states
 * - Highlight: Error/warning nodes
 * - Filter: Only nodes with issues (if any exist)
 *
 * @param nodes - All nodes
 * @param edges - All edges
 * @returns Filtered nodes and edges
 */
function filterValidationMode(nodes: Node[], edges: Edge[]): { nodes: Node[]; edges: Edge[] } {
  // Check if any nodes have validation errors
  const nodesWithIssues = nodes.filter((node) => {
    const data = node.data as any;
    return (
      data?.validationStatus === 'error' ||
      data?.validationStatus === 'warning' ||
      data?.hasErrors === true
    );
  });

  // If there are nodes with issues, show only those
  // Otherwise, show all nodes (to indicate everything is valid)
  const filteredNodes = nodesWithIssues.length > 0 ? nodesWithIssues : nodes;

  // Get visible node IDs
  const visibleNodeIds = new Set(filteredNodes.map((n) => n.id));

  // Show only edges between visible nodes
  const filteredEdges = edges.filter((edge) => {
    return visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target);
  });

  return { nodes: filteredNodes, edges: filteredEdges };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a node should be visible in a specific mode.
 *
 * @param node - Node to check
 * @param mode - View mode
 * @returns True if node should be visible
 */
export function isNodeVisibleInMode(node: Node, mode: ViewMode): boolean {
  const result = applyModeFilters([node], [], mode);
  return result.nodes.length > 0;
}

/**
 * Check if an edge should be visible in a specific mode.
 *
 * @param edge - Edge to check
 * @param mode - View mode
 * @param visibleNodes - Set of visible node IDs
 * @returns True if edge should be visible
 */
export function isEdgeVisibleInMode(
  edge: Edge,
  mode: ViewMode,
  visibleNodes: Set<string>
): boolean {
  // Edge is visible if both source and target are visible
  if (!visibleNodes.has(edge.source) || !visibleNodes.has(edge.target)) {
    return false;
  }

  // Apply mode-specific edge filtering
  switch (mode) {
    case 'composition':
      return (
        edge.type === 'extends' ||
        edge.type === 'mixin' ||
        edge.type === 'composition'
      );

    case 'dependency':
      return edge.type === 'extends' || edge.type === 'mixin';

    case 'explorer':
    case 'execution':
    case 'validation':
    default:
      return true;
  }
}

/**
 * Get node types visible in a specific mode.
 *
 * @param mode - View mode
 * @returns Array of visible node types
 */
export function getVisibleNodeTypes(mode: ViewMode): string[] {
  switch (mode) {
    case 'explorer':
      return ['template', 'fragment', 'variable', 'toolConfig', 'bundle', 'resolved'];

    case 'composition':
      return ['template', 'fragment', 'bundle', 'resolved'];

    case 'dependency':
      return ['template', 'bundle', 'fragment'];

    case 'execution':
      return ['template', 'fragment', 'variable', 'toolConfig', 'bundle', 'resolved'];

    case 'validation':
      return ['template', 'fragment', 'variable', 'toolConfig', 'bundle', 'resolved'];

    default:
      return ['template', 'fragment', 'variable', 'toolConfig', 'bundle', 'resolved'];
  }
}

/**
 * Get edge types visible in a specific mode.
 *
 * @param mode - View mode
 * @returns Array of visible edge types
 */
export function getVisibleEdgeTypes(mode: ViewMode): string[] {
  switch (mode) {
    case 'explorer':
      return ['extends', 'mixin', 'variable', 'toolRef', 'composition'];

    case 'composition':
      return ['extends', 'mixin', 'composition'];

    case 'dependency':
      return ['extends', 'mixin'];

    case 'execution':
      return ['extends', 'mixin', 'variable', 'toolRef', 'composition'];

    case 'validation':
      return ['extends', 'mixin', 'variable', 'toolRef', 'composition'];

    default:
      return ['extends', 'mixin', 'variable', 'toolRef', 'composition'];
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * @public
 * @exports applyModeFilters - Apply filters for a mode
 * @exports FilterResult - Filter result type
 * @exports isNodeVisibleInMode - Check node visibility
 * @exports isEdgeVisibleInMode - Check edge visibility
 * @exports getVisibleNodeTypes - Get visible node types
 * @exports getVisibleEdgeTypes - Get visible edge types
 */
