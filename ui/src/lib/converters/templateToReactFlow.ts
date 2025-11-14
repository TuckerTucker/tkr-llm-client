/**
 * Template to ReactFlow Converter
 *
 * Converts AgentTemplate data structures from the backend template system
 * into ReactFlow nodes and edges for visualization.
 *
 * @module lib/converters/templateToReactFlow
 * @version 1.0.0
 * @author Adapter Integration Engineer (Agent 1)
 */

import type { AgentTemplate, ValidationTypeRule } from '@backend/templates/types';
import type { Node, Edge } from '@backend/lib/types/reactflow';
import type { ToolConfigNodeData, VariableNodeData, EdgeData } from '@backend/lib/types/ui-types';
import { templateToNode } from '@backend/lib/adapters/template-adapter';
import { variableToNode } from '@backend/lib/adapters/variable-adapter';
import { createExtendsEdge, createMixinEdge, createVariableEdge } from '@backend/lib/adapters/edge-adapter';
import { calculateGridPosition, DEFAULT_GRID_SETTINGS, type GridSettings } from '../utils/nodePositioning';

// ============================================================================
// RESULT TYPES
// ============================================================================

/**
 * Result of template to ReactFlow conversion.
 *
 * Contains nodes, edges, variables, and metadata about the conversion process.
 */
export interface TemplateConversionResult {
  /** ReactFlow nodes generated from template */
  nodes: Node[];

  /** ReactFlow edges representing relationships */
  edges: Edge[];

  /** Variable definitions extracted from template */
  variables: VariableDefinition[];

  /** Conversion metadata and errors */
  metadata: ConversionMetadata;
}

/**
 * Metadata about the conversion process.
 */
export interface ConversionMetadata {
  /** Total number of nodes generated */
  nodeCount: number;

  /** Total number of edges generated */
  edgeCount: number;

  /** Total number of variables extracted */
  variableCount: number;

  /** Whether any errors occurred during conversion */
  hasErrors: boolean;

  /** Conversion errors (if any) */
  errors?: ConversionError[];

  /** Conversion warnings (if any) */
  warnings?: string[];

  /** Time taken for conversion (milliseconds) */
  conversionTime?: number;
}

/**
 * Conversion error details.
 */
export interface ConversionError {
  /** Error type classification */
  type: 'adapter' | 'validation' | 'unknown';

  /** Error message */
  message: string;

  /** Additional error context */
  context?: any;

  /** Whether the error is recoverable */
  recoverable: boolean;
}

/**
 * Variable definition extracted from template.
 */
export interface VariableDefinition {
  /** Variable name */
  name: string;

  /** Variable type */
  type: 'string' | 'number' | 'boolean' | 'enum' | 'array';

  /** Whether variable is required */
  required: boolean;

  /** Default value (if optional) */
  defaultValue?: any;

  /** Enum options (if type === 'enum') */
  enumOptions?: string[];
}

/**
 * Conversion options.
 */
export interface ConversionOptions {
  /**
   * Whether to include tool config nodes.
   * @default true
   */
  includeTools?: boolean;

  /**
   * Whether to include variable nodes.
   * @default true
   */
  includeVariables?: boolean;

  /**
   * Whether to include fragment nodes.
   * @default true
   */
  includeFragments?: boolean;

  /**
   * Initial node spacing (used by layout).
   * @default 200
   */
  nodeSpacing?: number;

  /**
   * Whether to validate during conversion.
   * @default true
   */
  validate?: boolean;

  /**
   * Grid layout settings for positioning.
   */
  gridSettings?: Partial<GridSettings>;
}

// ============================================================================
// MAIN CONVERSION FUNCTION
// ============================================================================

/**
 * Converts an AgentTemplate into ReactFlow nodes and edges.
 *
 * This is the main entry point for the template-to-UI conversion process.
 * It transforms backend AgentTemplate data into ReactFlow-compatible
 * structures with comprehensive error handling and validation.
 *
 * @param template - The agent template to convert
 * @param options - Optional conversion settings
 * @returns Conversion result with nodes, edges, and metadata
 * @throws {Error} If conversion fails unrecoverably
 *
 * @example
 * ```typescript
 * const template = await registry.getTemplate('code-reviewer');
 * const result = convertTemplateToReactFlow(template);
 *
 * // Use the result
 * setNodes(result.nodes);
 * setEdges(result.edges);
 *
 * // Check for errors
 * if (result.metadata.hasErrors) {
 *   console.error('Conversion errors:', result.metadata.errors);
 * }
 * ```
 */
export function convertTemplateToReactFlow(
  template: AgentTemplate,
  options: ConversionOptions = {}
): TemplateConversionResult {
  const startTime = performance.now();

  // Apply default options
  const opts: Required<ConversionOptions> = {
    includeTools: options.includeTools ?? true,
    includeVariables: options.includeVariables ?? true,
    includeFragments: options.includeFragments ?? true,
    nodeSpacing: options.nodeSpacing ?? 200,
    validate: options.validate ?? true,
    gridSettings: { ...DEFAULT_GRID_SETTINGS, ...options.gridSettings },
  };

  const errors: ConversionError[] = [];
  const warnings: string[] = [];

  try {
    // Validate template
    if (opts.validate) {
      const validationErrors = validateTemplate(template);
      if (validationErrors.length > 0) {
        for (const error of validationErrors) {
          errors.push({
            type: 'validation',
            message: error,
            recoverable: false,
          });
        }
        // If validation fails, throw immediately
        throw new Error(`Template validation failed: ${validationErrors.join(', ')}`);
      }
    }

    // Convert template to nodes and edges
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const variables: VariableDefinition[] = [];

    // 1. Create main template node
    try {
      const gridSettings = opts.gridSettings as GridSettings;
      const templateNode = templateToNode(template, calculateGridPosition(0, gridSettings));
      nodes.push(templateNode);
    } catch (error) {
      const err: ConversionError = {
        type: 'adapter',
        message: `Failed to convert template to node: ${(error as Error).message}`,
        context: { template: template.metadata.name },
        recoverable: false,
      };
      errors.push(err);
      throw error; // Unrecoverable
    }

    // 2. Create variable nodes (if enabled)
    if (opts.includeVariables && template.validation?.types) {
      try {
        const gridSettings = opts.gridSettings as GridSettings;
        const variableNodes = createVariableNodes(template, gridSettings);
        nodes.push(...variableNodes);

        // Create edges from variables to template
        for (const varNode of variableNodes) {
          const edge = createVariableEdge(varNode.id, template.metadata.name);
          edges.push(edge);
        }

        // Extract variable definitions
        variables.push(...extractVariableDefinitions(template));
      } catch (error) {
        const err: ConversionError = {
          type: 'adapter',
          message: `Failed to create variable nodes: ${(error as Error).message}`,
          context: { template: template.metadata.name },
          recoverable: true,
        };
        errors.push(err);
        warnings.push('Some variable nodes may be missing');
        // Continue despite error (recoverable)
      }
    }

    // 3. Create tool nodes (if enabled)
    if (opts.includeTools && template.agent.tools.length > 0) {
      try {
        const gridSettings = opts.gridSettings as GridSettings;
        const toolNodes = createToolNodes(template, gridSettings, nodes.length);
        nodes.push(...toolNodes);

        // Create edges from tools to template
        for (const toolNode of toolNodes) {
          // Create a simple edge for tool reference
          const edge: Edge<EdgeData> = {
            id: `tool-${toolNode.id}-${template.metadata.name}`,
            source: toolNode.id,
            target: template.metadata.name,
            type: 'toolRef',
            label: 'uses',
            animated: false,
            data: {
              id: `tool-${toolNode.id}-${template.metadata.name}`,
              type: 'toolRef',
              label: 'uses',
              animated: false,
              metadata: {
                relationship: 'tool-reference',
              },
            },
            markerEnd: 'arrow',
            style: {
              stroke: '#8b5cf6',
              strokeWidth: 1.5,
            },
          };
          edges.push(edge);
        }
      } catch (error) {
        const err: ConversionError = {
          type: 'adapter',
          message: `Failed to create tool nodes: ${(error as Error).message}`,
          context: { template: template.metadata.name },
          recoverable: true,
        };
        errors.push(err);
        warnings.push('Some tool nodes may be missing');
        // Continue despite error (recoverable)
      }
    }

    // 4. Create inheritance edges (if template extends another)
    if (template.metadata.extends) {
      try {
        const edge = createExtendsEdge(template.metadata.extends, template.metadata.name);
        edges.push(edge);
      } catch (error) {
        const err: ConversionError = {
          type: 'adapter',
          message: `Failed to create extends edge: ${(error as Error).message}`,
          context: { parent: template.metadata.extends, child: template.metadata.name },
          recoverable: true,
        };
        errors.push(err);
        warnings.push('Inheritance relationship may not be visible');
        // Continue despite error (recoverable)
      }
    }

    // 5. Create mixin edges (if template has mixins)
    if (opts.includeFragments && template.metadata.mixins) {
      for (let i = 0; i < template.metadata.mixins.length; i++) {
        try {
          const mixinName = template.metadata.mixins[i];
          const edge = createMixinEdge(mixinName, template.metadata.name, i + 1);
          edges.push(edge);
        } catch (error) {
          const err: ConversionError = {
            type: 'adapter',
            message: `Failed to create mixin edge: ${(error as Error).message}`,
            context: { mixin: template.metadata.mixins[i], template: template.metadata.name },
            recoverable: true,
          };
          errors.push(err);
          warnings.push(`Mixin relationship for ${template.metadata.mixins[i]} may not be visible`);
          // Continue despite error (recoverable)
        }
      }
    }

    // Calculate conversion time
    const conversionTime = performance.now() - startTime;

    // Build metadata
    const metadata: ConversionMetadata = {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      variableCount: variables.length,
      hasErrors: errors.length > 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
      conversionTime,
    };

    // Post-conversion validation
    if (opts.validate) {
      const postValidationErrors = validateConversionResult({ nodes, edges, variables, metadata });
      if (postValidationErrors.length > 0) {
        for (const error of postValidationErrors) {
          errors.push({
            type: 'validation',
            message: error,
            recoverable: false,
          });
        }
        metadata.hasErrors = true;
        metadata.errors = errors;
      }
    }

    return {
      nodes,
      edges,
      variables,
      metadata,
    };
  } catch (error) {
    // Unrecoverable error occurred
    const conversionTime = performance.now() - startTime;

    return {
      nodes: [],
      edges: [],
      variables: [],
      metadata: {
        nodeCount: 0,
        edgeCount: 0,
        variableCount: 0,
        hasErrors: true,
        errors: [
          {
            type: 'unknown',
            message: `Conversion failed: ${(error as Error).message}`,
            context: { template: template?.metadata?.name },
            recoverable: false,
          },
          ...errors,
        ],
        warnings,
        conversionTime,
      },
    };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validates a template before conversion.
 *
 * @param template - Template to validate
 * @returns Array of validation error messages (empty if valid)
 */
function validateTemplate(template: AgentTemplate): string[] {
  const errors: string[] = [];

  // Check required fields
  if (!template) {
    errors.push('Template is null or undefined');
    return errors;
  }

  if (!template.metadata?.name) {
    errors.push('Template missing metadata.name');
  }

  if (!template.agent?.prompt) {
    errors.push('Template missing agent.prompt');
  }

  if (!Array.isArray(template.agent?.tools)) {
    errors.push('Template missing agent.tools array');
  }

  // Check extends/mixins are strings
  if (template.metadata?.extends && typeof template.metadata.extends !== 'string') {
    errors.push('Template metadata.extends must be a string');
  }

  if (template.metadata?.mixins && !Array.isArray(template.metadata.mixins)) {
    errors.push('Template metadata.mixins must be an array');
  }

  return errors;
}

/**
 * Validates conversion result after conversion.
 *
 * @param result - Conversion result to validate
 * @returns Array of validation error messages (empty if valid)
 */
function validateConversionResult(result: TemplateConversionResult): string[] {
  const errors: string[] = [];

  // Check for duplicate node IDs
  const nodeIds = new Set<string>();
  for (const node of result.nodes) {
    if (nodeIds.has(node.id)) {
      errors.push(`Duplicate node ID: ${node.id}`);
    }
    nodeIds.add(node.id);
  }

  // Check edges reference existing nodes
  for (const edge of result.edges) {
    if (!nodeIds.has(edge.source)) {
      errors.push(`Edge ${edge.id} references non-existent source node: ${edge.source}`);
    }
    if (!nodeIds.has(edge.target)) {
      errors.push(`Edge ${edge.id} references non-existent target node: ${edge.target}`);
    }
  }

  // Check for circular dependencies (basic check)
  // This is a simple check; more sophisticated cycle detection could be added
  const extendsEdges = result.edges.filter((e) => e.type === 'extends');
  if (extendsEdges.length > 0) {
    // Build adjacency list
    const graph = new Map<string, string[]>();
    for (const edge of extendsEdges) {
      if (!graph.has(edge.source)) {
        graph.set(edge.source, []);
      }
      graph.get(edge.source)!.push(edge.target);
    }

    // Check for simple cycles (node pointing to itself through chain)
    for (const [node, children] of graph.entries()) {
      const visited = new Set<string>();
      const stack = [...children];

      while (stack.length > 0) {
        const current = stack.pop()!;
        if (current === node) {
          errors.push(`Circular dependency detected involving: ${node}`);
          break;
        }
        if (visited.has(current)) continue;
        visited.add(current);

        const neighbors = graph.get(current) || [];
        stack.push(...neighbors);
      }
    }
  }

  return errors;
}

/**
 * Creates variable nodes from template validation rules.
 *
 * @param template - Template with validation rules
 * @param gridSettings - Grid layout settings
 * @returns Array of variable nodes
 */
function createVariableNodes(template: AgentTemplate, gridSettings: GridSettings): Node<VariableNodeData>[] {
  const nodes: Node<VariableNodeData>[] = [];

  if (!template.validation?.types) {
    return nodes;
  }

  const required = new Set(template.validation.required || []);
  const optional = new Set(template.validation.optional || []);

  let index = 0;
  for (const [variableName, rule] of Object.entries(template.validation.types)) {
    try {
      // Create enhanced rule
      const enhancedRule: ValidationTypeRule = {
        ...rule,
        default: rule.default,
      };

      // Use adapter to create node, then position it
      const varNode = variableToNode(variableName, enhancedRule);

      // Position in grid (offset to the right of template node)
      const position = calculateGridPosition(index, {
        ...gridSettings,
        startX: (gridSettings.startX || 0) + gridSettings.columnWidth,
      });
      varNode.position = position;

      nodes.push(varNode);
      index++;
    } catch (error) {
      // Skip this variable and continue
      console.warn(`Failed to create variable node for ${variableName}:`, error);
    }
  }

  return nodes;
}

/**
 * Creates tool nodes from template tools.
 *
 * @param template - Template with tools
 * @param gridSettings - Grid layout settings
 * @param startIndex - Starting index for positioning
 * @returns Array of tool nodes
 */
function createToolNodes(
  template: AgentTemplate,
  gridSettings: GridSettings,
  startIndex: number
): Node<ToolConfigNodeData>[] {
  const nodes: Node<ToolConfigNodeData>[] = [];

  for (let i = 0; i < template.agent.tools.length; i++) {
    try {
      const tool = template.agent.tools[i];
      const toolName = typeof tool === 'string' ? tool : tool.name;

      // Create a simplified tool config node
      const toolNode: Node<ToolConfigNodeData> = {
        id: `tool-${toolName}`,
        type: 'toolConfig',
        position: calculateGridPosition(startIndex + i, {
          ...gridSettings,
          startY: (gridSettings.startY || 0) + gridSettings.rowHeight,
        }),
        data: {
          id: `tool-${toolName}`,
          type: 'toolConfig',
          name: `${toolName} Tool`,
          config: {
            tool: {
              name: toolName,
            },
          },
          toolName,
          metadata: {
            hasDefaultSettings: false,
            hasPermissions: false,
            hasValidation: false,
            hasErrorHandling: false,
          },
        },
        draggable: true,
        selectable: true,
      };

      nodes.push(toolNode);
    } catch (error) {
      // Skip this tool and continue
      console.warn(`Failed to create tool node for tool ${i}:`, error);
    }
  }

  return nodes;
}

/**
 * Extracts variable definitions from template.
 *
 * @param template - Template with validation rules
 * @returns Array of variable definitions
 */
function extractVariableDefinitions(template: AgentTemplate): VariableDefinition[] {
  const variables: VariableDefinition[] = [];

  if (!template.validation?.types) {
    return variables;
  }

  const required = new Set(template.validation.required || []);

  for (const [name, rule] of Object.entries(template.validation.types)) {
    variables.push({
      name,
      type: rule.type,
      required: required.has(name),
      defaultValue: rule.default,
      enumOptions: rule.enum,
    });
  }

  return variables;
}

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * @public
 * @exports convertTemplateToReactFlow - Main conversion function
 * @exports TemplateConversionResult - Conversion result type
 * @exports ConversionMetadata - Metadata about conversion
 * @exports ConversionError - Error details
 * @exports VariableDefinition - Variable definition
 * @exports ConversionOptions - Conversion options
 */
