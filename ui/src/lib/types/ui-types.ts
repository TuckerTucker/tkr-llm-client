/**
 * UI Type Definitions for ReactFlow Template System
 *
 * Full type definitions integrated with the backend template system.
 *
 * @module lib/types/ui-types
 * @version 1.0.0
 * @author UI Integration Engineer (Agent 2+)
 */

import type {
  AgentTemplate,
  PromptFragment,
  ToolConfig as BackendToolConfig,
} from '@/../../src/templates/types';

/**
 * Validation state for nodes
 */
export interface ValidationState {
  valid: boolean;
  errors: Array<{
    field: string;
    message: string;
    severity: 'error' | 'warning';
  }>;
  warnings: string[];
}

/**
 * Base node data structure for ReactFlow nodes
 */
export interface NodeData {
  id: string;
  type: 'template' | 'fragment' | 'variable' | 'toolConfig' | 'bundle' | 'resolved';
  name: string;
  metadata: Record<string, any>;
  validationState?: ValidationState;
}

/**
 * Template node data
 */
export interface TemplateNodeData extends NodeData {
  type: 'template';
  template?: AgentTemplate; // Full AgentTemplate from backend
  description: string;
  tags: string[];
  tools: string[];
  extends?: string;
  mixins?: string[];
  requiredVariables: string[];
  optionalVariables: string[];
  version?: string;
  cached?: boolean;
  loading?: boolean;
}

/**
 * Fragment node data
 */
export interface FragmentNodeData extends NodeData {
  type: 'fragment';
  fragment?: PromptFragment; // Full PromptFragment from backend
  instructions: string;
  fragmentType: string;
  usedBy: string[]; // template names
}

/**
 * Variable node data
 */
export interface VariableNodeData extends NodeData {
  type: 'variable';
  variableName: string;
  value: any;
  variableType: 'string' | 'number' | 'boolean' | 'enum' | 'array';
  required: boolean;
  defaultValue?: any;
  enumOptions?: string[];
}

/**
 * Tool permissions
 */
export interface ToolPermissions {
  allowed: string[];
  forbidden: string[];
  maxFileSize?: number;
}

/**
 * Tool validation rules
 */
export interface ToolValidation {
  rules: Array<{
    field: string;
    validator: string;
    message: string;
  }>;
}

/**
 * Tool error handling configuration
 */
export interface ToolErrorHandling {
  strategy: 'fail-fast' | 'continue' | 'retry';
  maxRetries?: number;
}

/**
 * Tool config node data
 */
export interface ToolConfigNodeData extends NodeData {
  type: 'toolConfig';
  config?: BackendToolConfig; // Full ToolConfig from backend
  toolName: string;
  permissions?: ToolPermissions;
  validation?: ToolValidation;
  errorHandling?: ToolErrorHandling;
  extends?: string;
}

/**
 * Bundle node data
 */
export interface BundleNodeData extends NodeData {
  type: 'bundle';
  bundleName: string;
  containedTools: string[];
  expanded: boolean;
}

/**
 * Resolved config node data
 */
export interface ResolvedNodeData extends NodeData {
  type: 'resolved';
  resolvedConfig: {
    prompt: string;
    tools: string[];
    settings: Record<string, any>;
    runtime: Record<string, any>;
  };
}

/**
 * Edge data for connections
 */
export interface EdgeData {
  id: string;
  type: 'extends' | 'mixin' | 'variable' | 'toolRef' | 'bundle';
  label?: string;
  animated?: boolean;
  metadata?: Record<string, any>;
  order?: number; // For mixin edges
}

/**
 * Base node props for all ReactFlow nodes
 */
export interface BaseNodeProps<T extends NodeData> {
  id: string;
  data: T;
  selected?: boolean;
  dragging?: boolean;
  zoomLevel?: number;
}

/**
 * Node state for styling
 */
export interface NodeStateStyles {
  default: string;
  hover: string;
  selected: string;
  focused: string;
  error: string;
  warning: string;
  valid: string;
  loading: string;
  disabled: string;
}
