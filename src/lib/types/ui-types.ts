/**
 * UI Type Definitions for ReactFlow Template UI
 *
 * Defines all node data interfaces, edge data, and validation state
 * for the ReactFlow-based template visualization system.
 *
 * @module lib/types/ui-types
 * @version 1.0.0
 * @author Data Bridge Engineer (Agent 1)
 */

import type {
  AgentTemplate,
  PromptFragment,
  ToolConfig,
  ToolPermissions,
  ToolValidation,
  ToolErrorHandling,
} from '../../templates/types';

// ============================================================================
// BASE NODE DATA
// ============================================================================

/**
 * Base node data structure for ReactFlow nodes.
 *
 * All specific node types extend this base interface.
 */
export interface NodeData {
  /** Unique identifier for the node */
  id: string;

  /** Node type discriminator */
  type: 'template' | 'fragment' | 'variable' | 'toolConfig' | 'bundle' | 'resolved';

  /** Display name for the node */
  name: string;

  /** Additional metadata */
  metadata: Record<string, any>;

  /** Validation state (if applicable) */
  validationState?: ValidationState;
}

// ============================================================================
// TEMPLATE NODE
// ============================================================================

/**
 * Template node data for ReactFlow.
 *
 * Represents an AgentTemplate in the visual canvas with all
 * necessary metadata for display and editing.
 */
export interface TemplateNodeData extends NodeData {
  type: 'template';

  /** Complete agent template from template system */
  template: AgentTemplate;

  /** Human-readable description */
  description: string;

  /** Template tags for filtering/grouping */
  tags: string[];

  /** Tool names used by this template */
  tools: string[];

  /** Parent template name (if extends) */
  extends?: string;

  /** Fragment names mixed into this template */
  mixins?: string[];

  /** Required variable names */
  requiredVariables: string[];

  /** Optional variable names */
  optionalVariables: string[];
}

// ============================================================================
// FRAGMENT NODE
// ============================================================================

/**
 * Fragment node data for ReactFlow.
 *
 * Represents a PromptFragment that can be mixed into templates.
 */
export interface FragmentNodeData extends NodeData {
  type: 'fragment';

  /** Complete prompt fragment from template system */
  fragment: PromptFragment;

  /** Fragment instructions content */
  instructions: string;

  /** Template names that use this fragment */
  usedBy: string[];
}

// ============================================================================
// VARIABLE NODE
// ============================================================================

/**
 * Variable node data for ReactFlow.
 *
 * Represents a template variable with type information and value.
 */
export interface VariableNodeData extends NodeData {
  type: 'variable';

  /** Variable name (e.g., "file", "concern") */
  variableName: string;

  /** Current value of the variable */
  value: any;

  /** Variable type */
  variableType: 'string' | 'number' | 'boolean' | 'enum' | 'array';

  /** Whether this variable is required */
  required: boolean;

  /** Default value (if optional) */
  defaultValue?: any;

  /** Enum options (if variableType === 'enum') */
  enumOptions?: string[];
}

// ============================================================================
// TOOL CONFIG NODE
// ============================================================================

/**
 * Tool config node data for ReactFlow.
 *
 * Represents a ToolConfig with permissions, validation, and error handling.
 */
export interface ToolConfigNodeData extends NodeData {
  type: 'toolConfig';

  /** Complete tool configuration from template system */
  config: ToolConfig;

  /** Tool name this config applies to */
  toolName: string;

  /** Access control rules */
  permissions?: ToolPermissions;

  /** Input validation rules */
  validation?: ToolValidation;

  /** Error handling behavior */
  errorHandling?: ToolErrorHandling;

  /** Parent config name (if extends) */
  extends?: string;
}

// ============================================================================
// VALIDATION STATE
// ============================================================================

/**
 * Validation state for nodes.
 *
 * Indicates whether a node's data is valid and provides
 * detailed error/warning information.
 */
export interface ValidationState {
  /** True if validation passed */
  valid: boolean;

  /** Validation errors */
  errors: Array<{
    /** Field that failed validation */
    field: string;

    /** Error description */
    message: string;

    /** Error severity */
    severity: 'error' | 'warning';
  }>;

  /** Validation warnings */
  warnings: string[];
}

// ============================================================================
// EDGE DATA
// ============================================================================

/**
 * Edge data for ReactFlow.
 *
 * Defines relationships between nodes (extends, mixin, variable, toolRef).
 */
export interface EdgeData {
  /** Unique edge identifier */
  id: string;

  /** Edge type discriminator */
  type: 'extends' | 'mixin' | 'variable' | 'toolRef' | 'bundle';

  /** Optional label text */
  label?: string;

  /** Whether edge should be animated */
  animated?: boolean;

  /** Additional metadata */
  metadata?: Record<string, any>;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard for TemplateNodeData.
 *
 * @param data - Node data to check
 * @returns True if data is TemplateNodeData
 */
export function isTemplateNodeData(data: NodeData): data is TemplateNodeData {
  return data.type === 'template' && 'template' in data;
}

/**
 * Type guard for FragmentNodeData.
 *
 * @param data - Node data to check
 * @returns True if data is FragmentNodeData
 */
export function isFragmentNodeData(data: NodeData): data is FragmentNodeData {
  return data.type === 'fragment' && 'fragment' in data;
}

/**
 * Type guard for VariableNodeData.
 *
 * @param data - Node data to check
 * @returns True if data is VariableNodeData
 */
export function isVariableNodeData(data: NodeData): data is VariableNodeData {
  return data.type === 'variable' && 'variableName' in data;
}

/**
 * Type guard for ToolConfigNodeData.
 *
 * @param data - Node data to check
 * @returns True if data is ToolConfigNodeData
 */
export function isToolConfigNodeData(data: NodeData): data is ToolConfigNodeData {
  return data.type === 'toolConfig' && 'config' in data;
}

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * @public
 * @exports NodeData - Base node data structure
 * @exports TemplateNodeData - Template node data
 * @exports FragmentNodeData - Fragment node data
 * @exports VariableNodeData - Variable node data
 * @exports ToolConfigNodeData - Tool config node data
 * @exports ValidationState - Validation state
 * @exports EdgeData - Edge data
 * @exports isTemplateNodeData - Type guard for TemplateNodeData
 * @exports isFragmentNodeData - Type guard for FragmentNodeData
 * @exports isVariableNodeData - Type guard for VariableNodeData
 * @exports isToolConfigNodeData - Type guard for ToolConfigNodeData
 */
