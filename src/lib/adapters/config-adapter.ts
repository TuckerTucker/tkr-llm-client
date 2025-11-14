/**
 * Tool Config Adapter
 *
 * Converts ToolConfig to/from ToolConfigNodeData for ReactFlow.
 *
 * @module lib/adapters/config-adapter
 * @version 1.0.0
 * @author Data Bridge Engineer (Agent 1)
 */

import type { ToolConfig } from '../../templates/types';
import type { ToolConfigNodeData } from '../types/ui-types';
import type { Node } from '../types/reactflow';
import { AdapterError } from './errors';

/**
 * Converts ToolConfig to ReactFlow Node with ToolConfigNodeData.
 *
 * @param config - Tool config from file
 * @param position - Optional position
 * @returns ReactFlow Node with ToolConfigNodeData
 * @throws {AdapterError} If config is invalid
 *
 * @example
 * ```typescript
 * const config = await loader.loadToolConfig('safe-write.yml');
 * const node = toolConfigToNode(config, { x: 100, y: 100 });
 * console.log(node.data.toolName); // 'Write'
 * ```
 */
export function toolConfigToNode(
  config: ToolConfig,
  position?: { x: number; y: number }
): Node<ToolConfigNodeData> {
  try {
    // Validate required fields
    if (!config?.tool?.name) {
      throw new Error('ToolConfig missing tool.name');
    }

    const toolName = config.tool.name;

    // Build node data
    const nodeData: ToolConfigNodeData = {
      id: `config-${toolName}`,
      type: 'toolConfig',
      name: `${toolName} Config`,
      config,
      toolName,
      permissions: config.tool.permissions,
      validation: config.tool.validation,
      errorHandling: config.tool.errorHandling,
      extends: config.tool.extends,
      metadata: {
        hasDefaultSettings: !!config.tool.defaultSettings,
        hasPermissions: !!config.tool.permissions,
        hasValidation: !!config.tool.validation,
        hasErrorHandling: !!config.tool.errorHandling,
      },
    };

    // Build ReactFlow node
    const node: Node<ToolConfigNodeData> = {
      id: `config-${toolName}`,
      type: 'toolConfig',
      position: position || { x: 0, y: 0 },
      data: nodeData,
      draggable: true,
      selectable: true,
    };

    return node;
  } catch (error) {
    throw new AdapterError(
      `Failed to convert tool config to node: ${(error as Error).message}`,
      config,
      'config'
    );
  }
}

/**
 * Converts ReactFlow Node with ToolConfigNodeData back to ToolConfig.
 *
 * @param node - ReactFlow node with ToolConfigNodeData
 * @returns ToolConfig
 * @throws {AdapterError} If node is invalid
 *
 * @example
 * ```typescript
 * const config = nodeToToolConfig(node);
 * await fs.writeFile('tool-config.yml', yaml.dump(config));
 * ```
 */
export function nodeToToolConfig(node: Node<ToolConfigNodeData>): ToolConfig {
  try {
    // Validate node structure
    if (!node?.data?.config) {
      throw new Error('Node missing config data');
    }

    // Return the stored config (it's the source of truth)
    return node.data.config;
  } catch (error) {
    throw new AdapterError(
      `Failed to convert node to tool config: ${(error as Error).message}`,
      node,
      'config'
    );
  }
}
