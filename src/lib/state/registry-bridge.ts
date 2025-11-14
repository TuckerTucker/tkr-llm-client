/**
 * Registry Bridge
 *
 * Bridge between TemplateRegistry and ReactFlow canvas.
 * Handles loading, refreshing, and saving templates.
 *
 * @module lib/state/registry-bridge
 * @version 1.0.0
 * @author Data Bridge Engineer (Agent 1)
 */

import * as fs from 'fs/promises';
import * as yaml from 'js-yaml';
import type { TemplateRegistry } from '../../templates/registry';
import type { NodeData, TemplateNodeData, EdgeData } from '../types/ui-types';
import type { Node, Edge } from '../types/reactflow';
import { templateToNode, nodeToTemplate } from '../adapters/template-adapter';
import { createExtendsEdge, createMixinEdge } from '../adapters/edge-adapter';
import { syncRegistryToNodes } from './sync';
import { isTemplateNodeData } from '../types/ui-types';

/**
 * Loads templates from registry and converts to nodes/edges for canvas.
 *
 * Builds the complete graph including inheritance (extends) and
 * composition (mixins) relationships.
 *
 * @param registry - Template registry (scanned)
 * @returns Nodes and edges for canvas
 *
 * @example
 * ```typescript
 * const registry = new TemplateRegistry('./templates');
 * await registry.scan();
 *
 * const { nodes, edges } = await loadFromRegistry(registry);
 * // Pass to ReactFlow
 * ```
 */
export async function loadFromRegistry(
  registry: TemplateRegistry
): Promise<{
  nodes: Node<NodeData>[];
  edges: Edge<EdgeData>[];
}> {
  // Get all templates from catalog
  const catalog = registry.getCatalog();
  const nodes: Node<NodeData>[] = [];
  const edges: Edge<EdgeData>[] = [];

  // Convert templates to nodes
  for (const entry of catalog.templates) {
    const template = registry.getTemplate(entry.name);
    if (!template) {
      continue;
    }

    const node = templateToNode(template);
    nodes.push(node);
  }

  // Build edges for relationships
  for (const node of nodes) {
    if (!isTemplateNodeData(node.data)) {
      continue;
    }

    const templateData = node.data;

    // Create extends edges
    if (templateData.extends) {
      const parentNode = nodes.find((n) => n.id === templateData.extends);
      if (parentNode) {
        const edge = createExtendsEdge(templateData.extends, node.id);
        edges.push(edge);
      }
    }

    // Create mixin edges
    if (templateData.mixins) {
      for (let i = 0; i < templateData.mixins.length; i++) {
        const mixinPath = templateData.mixins[i];
        // Extract fragment name from path (e.g., './fragments/safety.yml' -> 'safety')
        const fragmentName = mixinPath
          .split('/')
          .pop()
          ?.replace(/\.(yml|yaml)$/, '');

        if (fragmentName) {
          // Note: Fragment nodes would need to be created separately
          // For now, we just track the edge
          const edge = createMixinEdge(fragmentName, node.id, i + 1);
          edges.push(edge);
        }
      }
    }
  }

  return { nodes, edges };
}

/**
 * Refreshes registry and updates canvas.
 *
 * Rescans the registry and updates nodes while preserving positions
 * and selections.
 *
 * @param registry - Template registry
 * @param currentNodes - Current canvas nodes
 * @returns Updated nodes (preserves positions)
 *
 * @example
 * ```typescript
 * // After file changes
 * const updatedNodes = await refreshRegistry(registry, nodes);
 * setNodes(updatedNodes);
 * ```
 */
export async function refreshRegistry(
  registry: TemplateRegistry,
  currentNodes: Node<NodeData>[]
): Promise<Node<NodeData>[]> {
  // Rescan registry
  await registry.refresh();

  // Sync to nodes (preserves positions)
  const updatedNodes = syncRegistryToNodes(registry, currentNodes);

  return updatedNodes;
}

/**
 * Saves template node back to YAML file.
 *
 * Converts node to template and writes to file with proper formatting.
 *
 * @param node - Template node
 * @param filePath - Output path
 *
 * @example
 * ```typescript
 * await saveNodeToYAML(templateNode, './templates/my-agent.yml');
 * ```
 */
export async function saveNodeToYAML(
  node: Node<TemplateNodeData>,
  filePath: string
): Promise<void> {
  // Convert node to template
  const template = nodeToTemplate(node);

  // Convert to YAML
  const yamlContent = yaml.dump(template, {
    indent: 2,
    lineWidth: 80,
    noRefs: true,
    sortKeys: false,
  });

  // Write to file
  await fs.writeFile(filePath, yamlContent, 'utf-8');
}

/**
 * Loads a template from file and creates a node.
 *
 * Useful for adding new templates to the canvas.
 *
 * @param filePath - Path to template YAML file
 * @param position - Optional position for the node
 * @returns Template node
 *
 * @example
 * ```typescript
 * const node = await loadTemplateFromFile('./templates/new-agent.yml');
 * setNodes([...nodes, node]);
 * ```
 */
export async function loadTemplateFromFile(
  filePath: string,
  position?: { x: number; y: number }
): Promise<Node<TemplateNodeData>> {
  // Read file
  const content = await fs.readFile(filePath, 'utf-8');

  // Parse YAML
  const template = yaml.load(content);

  // Validate and convert to node
  const node = templateToNode(template as any, position);

  return node;
}

/**
 * Watches registry directory for changes and triggers refresh callback.
 *
 * @param registry - Template registry
 * @param onRefresh - Callback when changes detected
 * @returns Cleanup function to stop watching
 *
 * @example
 * ```typescript
 * const stopWatching = await watchRegistry(registry, async (nodes) => {
 *   setNodes(nodes);
 * });
 *
 * // Later: stop watching
 * stopWatching();
 * ```
 */
export async function watchRegistry(
  registry: TemplateRegistry,
  onRefresh: (nodes: Node<NodeData>[]) => void | Promise<void>
): Promise<() => void> {
  // Get base directories from registry (private field, use reflection)
  const baseDirs = (registry as any).baseDirs as string[];

  if (!baseDirs || baseDirs.length === 0) {
    throw new Error('No base directories found in registry');
  }

  // Setup file watchers
  const watchers: any[] = [];

  for (const baseDir of baseDirs) {
    try {
      const { watch } = await import('fs');
      const watcher = watch(
        baseDir,
        { recursive: true },
        async (_eventType, filename) => {
          if (!filename) return;

          // Only process YAML files
          if (filename.endsWith('.yml') || filename.endsWith('.yaml')) {
            // Debounce: wait a bit before refreshing
            setTimeout(async () => {
              try {
                await registry.refresh();
                const currentNodes: Node<NodeData>[] = [];
                const updatedNodes = syncRegistryToNodes(registry, currentNodes);
                await onRefresh(updatedNodes);
              } catch (error) {
                console.error('Failed to refresh registry:', error);
              }
            }, 500);
          }
        }
      );

      watchers.push(watcher);
    } catch (error) {
      console.warn(`Failed to watch directory ${baseDir}:`, error);
    }
  }

  // Return cleanup function
  return () => {
    for (const watcher of watchers) {
      watcher.close();
    }
  };
}
