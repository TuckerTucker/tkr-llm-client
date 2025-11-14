/**
 * State Sync Utilities
 *
 * Synchronizes state between template registry and ReactFlow canvas.
 *
 * @module lib/state/sync
 * @version 1.0.0
 * @author Data Bridge Engineer (Agent 1)
 */

import type { AgentTemplate } from '../../templates/types';
import type { TemplateRegistry } from '../../templates/registry';
import type { NodeData, TemplateNodeData, VariableNodeData, EdgeData } from '../types/ui-types';
import type { Node, Edge } from '../types/reactflow';
import { templateToNode, nodeToTemplate } from '../adapters/template-adapter';
import { extractVariableValues } from '../adapters/variable-adapter';
import { isTemplateNodeData, isVariableNodeData } from '../types/ui-types';

/**
 * Syncs template registry to canvas nodes.
 *
 * Updates the canvas with templates from the registry while preserving
 * existing node positions and selections.
 *
 * @param registry - Template registry (scanned)
 * @param existingNodes - Current canvas nodes
 * @returns Updated nodes array
 *
 * @example
 * ```typescript
 * // After registry refresh
 * const updatedNodes = syncRegistryToNodes(registry, currentNodes);
 * setNodes(updatedNodes);
 * ```
 */
export function syncRegistryToNodes(
  registry: TemplateRegistry,
  existingNodes: Node<NodeData>[]
): Node<NodeData>[] {
  // Create a map of existing nodes by ID for fast lookup
  const existingMap = new Map<string, Node<NodeData>>();
  for (const node of existingNodes) {
    existingMap.set(node.id, node);
  }

  // Get all templates from registry
  const catalog = registry.getCatalog();
  const updatedNodes: Node<NodeData>[] = [];

  // Convert templates to nodes
  for (const entry of catalog.templates) {
    const template = registry.getTemplate(entry.name);
    if (!template) {
      continue;
    }

    // Check if node already exists
    const existing = existingMap.get(entry.name);
    if (existing && isTemplateNodeData(existing.data)) {
      // Preserve position and selection, update data
      const newNode = templateToNode(template, existing.position);
      updatedNodes.push({
        ...newNode,
        position: existing.position,
        selected: existing.selected,
      });
      existingMap.delete(entry.name);
    } else {
      // Create new node
      const newNode = templateToNode(template);
      updatedNodes.push(newNode);
    }
  }

  // Preserve non-template nodes (fragments, variables, configs)
  for (const [_id, node] of existingMap) {
    if (!isTemplateNodeData(node.data)) {
      updatedNodes.push(node);
    }
  }

  return updatedNodes;
}

/**
 * Syncs canvas nodes back to template data.
 *
 * Extracts template and variable data from the canvas for use with
 * the factory.create() method.
 *
 * @param nodes - Canvas nodes
 * @param edges - Canvas edges (for relationship validation)
 * @returns Template data and variables ready for factory.create()
 *
 * @example
 * ```typescript
 * const { template, variables } = syncNodesToTemplate(nodes, edges);
 * const resolved = await factory.create(template, variables);
 * await client.query(resolved.prompt);
 * ```
 */
export function syncNodesToTemplate(
  nodes: Node<NodeData>[],
  _edges: Edge<EdgeData>[]
): {
  template: AgentTemplate;
  variables: Record<string, any>;
} {
  // Find the primary template node (should be exactly one selected or first template)
  const templateNodes = nodes.filter((node) =>
    isTemplateNodeData(node.data)
  ) as Node<TemplateNodeData>[];

  if (templateNodes.length === 0) {
    throw new Error('No template node found on canvas');
  }

  // Use selected template or first template
  const selectedTemplate =
    templateNodes.find((node) => node.selected) || templateNodes[0];

  // Convert node to template
  const template = nodeToTemplate(selectedTemplate);

  // Extract variables from variable nodes
  const variableNodes = nodes.filter((node) =>
    isVariableNodeData(node.data)
  ) as Node<VariableNodeData>[];
  const variables = extractVariableValues(variableNodes);

  return {
    template,
    variables,
  };
}

/**
 * Validates edge connections on the canvas.
 *
 * Checks that edges follow the correct rules (e.g., extends only connects
 * templates, mixins connect fragments to templates).
 *
 * @param nodes - Canvas nodes
 * @param edges - Canvas edges
 * @returns Array of validation errors (empty if valid)
 *
 * @example
 * ```typescript
 * const errors = validateConnections(nodes, edges);
 * if (errors.length > 0) {
 *   console.error('Invalid connections:', errors);
 * }
 * ```
 */
export function validateConnections(
  nodes: Node<NodeData>[],
  edges: Edge<EdgeData>[]
): string[] {
  const errors: string[] = [];
  const nodeMap = new Map<string, Node<NodeData>>();

  // Build node map
  for (const node of nodes) {
    nodeMap.set(node.id, node);
  }

  // Validate each edge
  for (const edge of edges) {
    const source = nodeMap.get(edge.source);
    const target = nodeMap.get(edge.target);

    if (!source || !target) {
      errors.push(`Edge ${edge.id}: source or target node not found`);
      continue;
    }

    if (!edge.data?.type) {
      errors.push(`Edge ${edge.id}: missing type`);
      continue;
    }

    // Validate edge type rules
    switch (edge.data.type) {
      case 'extends':
        if (source.data.type !== 'template' || target.data.type !== 'template') {
          errors.push(
            `Edge ${edge.id}: 'extends' must connect template to template`
          );
        }
        break;

      case 'mixin':
        if (source.data.type !== 'fragment' || target.data.type !== 'template') {
          errors.push(
            `Edge ${edge.id}: 'mixin' must connect fragment to template`
          );
        }
        break;

      case 'variable':
        if (source.data.type !== 'variable' || target.data.type !== 'template') {
          errors.push(
            `Edge ${edge.id}: 'variable' must connect variable to template`
          );
        }
        break;

      case 'toolRef':
        if (
          source.data.type !== 'toolConfig' ||
          target.data.type !== 'template'
        ) {
          errors.push(
            `Edge ${edge.id}: 'toolRef' must connect toolConfig to template`
          );
        }
        break;

      case 'bundle':
        if (source.data.type !== 'bundle' || target.data.type !== 'template') {
          errors.push(
            `Edge ${edge.id}: 'bundle' must connect bundle to template`
          );
        }
        break;
    }
  }

  return errors;
}

/**
 * Detects circular inheritance in template extends relationships.
 *
 * @param nodes - Canvas nodes
 * @param edges - Canvas edges
 * @returns Array of circular dependency paths (empty if none)
 *
 * @example
 * ```typescript
 * const cycles = detectCircularInheritance(nodes, edges);
 * if (cycles.length > 0) {
 *   console.error('Circular inheritance detected:', cycles);
 * }
 * ```
 */
export function detectCircularInheritance(
  nodes: Node<NodeData>[],
  edges: Edge<EdgeData>[]
): string[][] {
  const extendsEdges = edges.filter(
    (edge) => edge.data?.type === 'extends'
  );

  // Build adjacency list
  const graph = new Map<string, string[]>();
  for (const edge of extendsEdges) {
    if (!graph.has(edge.target)) {
      graph.set(edge.target, []);
    }
    graph.get(edge.target)!.push(edge.source);
  }

  // DFS to detect cycles
  const cycles: string[][] = [];
  const visiting = new Set<string>();
  const visited = new Set<string>();

  function dfs(nodeId: string, path: string[]) {
    if (visiting.has(nodeId)) {
      // Cycle detected
      const cycleStart = path.indexOf(nodeId);
      cycles.push(path.slice(cycleStart));
      return;
    }

    if (visited.has(nodeId)) {
      return;
    }

    visiting.add(nodeId);
    path.push(nodeId);

    const parents = graph.get(nodeId) || [];
    for (const parent of parents) {
      dfs(parent, [...path]);
    }

    visiting.delete(nodeId);
    visited.add(nodeId);
  }

  // Check each node
  for (const node of nodes) {
    if (node.data.type === 'template' && !visited.has(node.id)) {
      dfs(node.id, []);
    }
  }

  return cycles;
}
