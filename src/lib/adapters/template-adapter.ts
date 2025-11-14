/**
 * Template Adapter
 *
 * Converts AgentTemplate to/from TemplateNodeData for ReactFlow.
 *
 * @module lib/adapters/template-adapter
 * @version 1.0.0
 * @author Data Bridge Engineer (Agent 1)
 */

import type { AgentTemplate } from '../../templates/types';
import type { TemplateNodeData } from '../types/ui-types';
import type { Node } from '../types/reactflow';
import { AdapterError } from './errors';

/**
 * Default grid layout settings.
 */
const GRID_SETTINGS = {
  COLUMN_WIDTH: 400,
  ROW_HEIGHT: 200,
  COLUMNS: 3,
};

/**
 * Converts AgentTemplate to ReactFlow Node with TemplateNodeData.
 *
 * @param template - Template from registry
 * @param position - Optional ReactFlow position { x, y }
 * @returns ReactFlow Node with TemplateNodeData
 * @throws {AdapterError} If template is invalid
 *
 * @example
 * ```typescript
 * const template = registry.getTemplate('code-reviewer');
 * const node = templateToNode(template, { x: 100, y: 100 });
 * console.log(node.data.name); // 'code-reviewer'
 * ```
 */
export function templateToNode(
  template: AgentTemplate,
  position?: { x: number; y: number }
): Node<TemplateNodeData> {
  try {
    // Validate required fields
    if (!template?.metadata?.name) {
      throw new Error('Template missing metadata.name');
    }
    if (!template?.agent?.prompt) {
      throw new Error('Template missing agent.prompt');
    }

    // Extract tool names from ToolReference[]
    const tools = template.agent.tools.map((tool) =>
      typeof tool === 'string' ? tool : tool.name
    );

    // Extract required/optional variables
    const requiredVariables = template.validation?.required || [];
    const optionalVariables = template.validation?.optional || [];

    // Build node data
    const nodeData: TemplateNodeData = {
      id: template.metadata.name,
      type: 'template',
      name: template.metadata.name,
      template,
      description: template.metadata.description,
      tags: template.metadata.tags || [],
      tools,
      extends: template.metadata.extends,
      mixins: template.metadata.mixins,
      requiredVariables,
      optionalVariables,
      metadata: {
        version: template.metadata.version,
        author: template.metadata.author,
        base: template.metadata.base || false,
      },
    };

    // Build ReactFlow node
    const node: Node<TemplateNodeData> = {
      id: template.metadata.name,
      type: 'template',
      position: position || { x: 0, y: 0 },
      data: nodeData,
      draggable: true,
      selectable: true,
    };

    return node;
  } catch (error) {
    throw new AdapterError(
      `Failed to convert template to node: ${(error as Error).message}`,
      template,
      'template'
    );
  }
}

/**
 * Converts ReactFlow Node with TemplateNodeData back to AgentTemplate.
 *
 * @param node - ReactFlow node with TemplateNodeData
 * @returns AgentTemplate
 * @throws {AdapterError} If node is invalid
 *
 * @example
 * ```typescript
 * const template = nodeToTemplate(node);
 * await factory.create(template, variables);
 * ```
 */
export function nodeToTemplate(node: Node<TemplateNodeData>): AgentTemplate {
  try {
    // Validate node structure
    if (!node?.data?.template) {
      throw new Error('Node missing template data');
    }

    // Return the stored template (it's the source of truth)
    return node.data.template;
  } catch (error) {
    throw new AdapterError(
      `Failed to convert node to template: ${(error as Error).message}`,
      node,
      'template'
    );
  }
}

/**
 * Layout strategy type.
 */
export type LayoutStrategy = 'grid' | 'tree' | 'force';

/**
 * Batch converts templates to nodes with layout.
 *
 * @param templates - Array of templates
 * @param layout - Optional layout strategy (default: 'grid')
 * @returns Array of positioned nodes
 * @throws {AdapterError} If any template conversion fails
 *
 * @example
 * ```typescript
 * const templates = registry.getCatalog().templates;
 * const nodes = templatesToNodes(templates, 'grid');
 * ```
 */
export function templatesToNodes(
  templates: AgentTemplate[],
  layout: LayoutStrategy = 'grid'
): Node<TemplateNodeData>[] {
  try {
    switch (layout) {
      case 'grid':
        return layoutGrid(templates);
      case 'tree':
        return layoutTree(templates);
      case 'force':
        return layoutForce(templates);
      default:
        return layoutGrid(templates);
    }
  } catch (error) {
    throw new AdapterError(
      `Failed to batch convert templates: ${(error as Error).message}`,
      templates,
      'template'
    );
  }
}

/**
 * Lays out templates in a grid pattern.
 *
 * @param templates - Array of templates
 * @returns Array of positioned nodes
 */
function layoutGrid(templates: AgentTemplate[]): Node<TemplateNodeData>[] {
  return templates.map((template, index) => {
    const row = Math.floor(index / GRID_SETTINGS.COLUMNS);
    const col = index % GRID_SETTINGS.COLUMNS;

    const position = {
      x: col * GRID_SETTINGS.COLUMN_WIDTH,
      y: row * GRID_SETTINGS.ROW_HEIGHT,
    };

    return templateToNode(template, position);
  });
}

/**
 * Lays out templates in a tree pattern based on inheritance.
 *
 * @param templates - Array of templates
 * @returns Array of positioned nodes
 */
function layoutTree(templates: AgentTemplate[]): Node<TemplateNodeData>[] {
  // Build inheritance tree
  const roots: AgentTemplate[] = [];
  const childrenMap = new Map<string, AgentTemplate[]>();

  for (const template of templates) {
    if (template.metadata.extends) {
      const parent = template.metadata.extends;
      if (!childrenMap.has(parent)) {
        childrenMap.set(parent, []);
      }
      childrenMap.get(parent)!.push(template);
    } else {
      roots.push(template);
    }
  }

  // Position nodes level by level
  const nodes: Node<TemplateNodeData>[] = [];
  let level = 0;

  function positionLevel(parents: AgentTemplate[], currentLevel: number) {
    const levelNodes = parents.map((template, index) => {
      const position = {
        x: index * GRID_SETTINGS.COLUMN_WIDTH,
        y: currentLevel * GRID_SETTINGS.ROW_HEIGHT,
      };
      return templateToNode(template, position);
    });

    nodes.push(...levelNodes);

    // Position children
    for (const parent of parents) {
      const children = childrenMap.get(parent.metadata.name) || [];
      if (children.length > 0) {
        positionLevel(children, currentLevel + 1);
      }
    }
  }

  positionLevel(roots, level);
  return nodes;
}

/**
 * Lays out templates using force-directed algorithm (simple version).
 *
 * @param templates - Array of templates
 * @returns Array of positioned nodes
 */
function layoutForce(templates: AgentTemplate[]): Node<TemplateNodeData>[] {
  // Simple circular layout as placeholder for force-directed
  const radius = Math.max(300, templates.length * 30);
  const angleStep = (2 * Math.PI) / templates.length;

  return templates.map((template, index) => {
    const angle = index * angleStep;
    const position = {
      x: Math.cos(angle) * radius + radius,
      y: Math.sin(angle) * radius + radius,
    };

    return templateToNode(template, position);
  });
}
