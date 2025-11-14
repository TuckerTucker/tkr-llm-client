/**
 * Variable Adapter
 *
 * Creates variable nodes and extracts variable values from ReactFlow nodes.
 *
 * @module lib/adapters/variable-adapter
 * @version 1.0.0
 * @author Data Bridge Engineer (Agent 1)
 */

import type { ValidationTypeRule } from '../../templates/types';
import type { VariableNodeData } from '../types/ui-types';
import type { Node } from '../types/reactflow';
import { AdapterError } from './errors';

/**
 * Creates a variable node from validation rules.
 *
 * @param variableName - Variable name (e.g., "file", "concern")
 * @param rule - Validation type rule
 * @param position - Optional position
 * @returns ReactFlow Node with VariableNodeData
 * @throws {AdapterError} If variable data is invalid
 *
 * @example
 * ```typescript
 * const rule = {
 *   type: 'enum',
 *   enum: ['security', 'performance', 'style'],
 *   default: 'security'
 * };
 * const node = variableToNode('concern', rule, { x: 100, y: 100 });
 * ```
 */
export function variableToNode(
  variableName: string,
  rule: ValidationTypeRule,
  position?: { x: number; y: number }
): Node<VariableNodeData> {
  try {
    // Validate inputs
    if (!variableName || typeof variableName !== 'string') {
      throw new Error('Invalid variable name');
    }
    if (!rule || typeof rule.type !== 'string') {
      throw new Error('Invalid validation rule');
    }

    // Build node data
    const nodeData: VariableNodeData = {
      id: `var-${variableName}`,
      type: 'variable',
      name: variableName,
      variableName,
      value: rule.default,
      variableType: rule.type,
      required: !rule.default, // If no default, it's required
      defaultValue: rule.default,
      enumOptions: rule.enum,
      metadata: {
        hasMin: rule.min !== undefined,
        hasMax: rule.max !== undefined,
        hasEnum: !!rule.enum,
      },
    };

    // Build ReactFlow node
    const node: Node<VariableNodeData> = {
      id: `var-${variableName}`,
      type: 'variable',
      position: position || { x: 0, y: 0 },
      data: nodeData,
      draggable: true,
      selectable: true,
    };

    return node;
  } catch (error) {
    throw new AdapterError(
      `Failed to create variable node: ${(error as Error).message}`,
      { variableName, rule },
      'variable'
    );
  }
}

/**
 * Extracts variable values from variable nodes.
 *
 * @param nodes - Array of variable nodes
 * @returns Record of variable name → value
 * @throws {AdapterError} If nodes are invalid
 *
 * @example
 * ```typescript
 * const variables = extractVariableValues(variableNodes);
 * console.log(variables); // { file: 'src/index.ts', concern: 'security' }
 *
 * // Use with factory
 * await factory.create(template, variables);
 * ```
 */
export function extractVariableValues(
  nodes: Node<VariableNodeData>[]
): Record<string, any> {
  try {
    const variables: Record<string, any> = {};

    for (const node of nodes) {
      if (!node?.data?.variableName) {
        throw new Error(`Invalid variable node: missing variableName`);
      }

      const { variableName, value, defaultValue, required } = node.data;

      // Use value if set, otherwise use default
      const finalValue = value !== undefined ? value : defaultValue;

      // Check required variables
      if (required && finalValue === undefined) {
        throw new Error(`Required variable '${variableName}' has no value`);
      }

      // Only include variables with values
      if (finalValue !== undefined) {
        variables[variableName] = finalValue;
      }
    }

    return variables;
  } catch (error) {
    throw new AdapterError(
      `Failed to extract variable values: ${(error as Error).message}`,
      nodes,
      'variable'
    );
  }
}

/**
 * Creates variable nodes from template validation rules.
 *
 * @param validationRules - Validation rules from template
 * @returns Array of variable nodes
 * @throws {AdapterError} If validation rules are invalid
 *
 * @example
 * ```typescript
 * const template = registry.getTemplate('code-reviewer');
 * const varNodes = createVariableNodesFromTemplate(template.validation);
 * ```
 */
export function createVariableNodesFromTemplate(
  validationRules?: {
    required?: string[];
    optional?: string[];
    types?: Record<string, ValidationTypeRule>;
  }
): Node<VariableNodeData>[] {
  if (!validationRules?.types) {
    return [];
  }

  const nodes: Node<VariableNodeData>[] = [];
  const required = new Set(validationRules.required || []);
  const optional = new Set(validationRules.optional || []);

  for (const [variableName, rule] of Object.entries(validationRules.types)) {
    // Determine if required
    const isRequired = required.has(variableName) || !optional.has(variableName);

    // Create rule with required flag
    const enhancedRule: ValidationTypeRule = {
      ...rule,
      default: isRequired ? rule.default : rule.default ?? undefined,
    };

    const node = variableToNode(variableName, enhancedRule);
    nodes.push(node);
  }

  return nodes;
}
