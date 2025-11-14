/**
 * Validation Pipeline
 *
 * Unified validation interface that integrates with the template system validators.
 * Provides validation for templates, tool configs, fragments, and variables.
 *
 * @module lib/validation/pipeline
 * @version 1.0.0
 * @author Validation & Preview Engineer (Agent 4)
 */

import type {
  AgentTemplate,
  ToolConfig,
  PromptFragment,
  ValidationResult,
  ValidationError,
} from '../../templates/types';
import {
  validateTemplate as validateTemplateCore,
  validateToolConfig as validateToolConfigCore,
  validateFragment as validateFragmentCore,
  validateVariables as validateVariablesCore,
} from '../../templates/validator';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Generic node type for validation (extensible for different use cases).
 */
export type ValidatableNode =
  | { type: 'template'; data: AgentTemplate }
  | { type: 'tool-config'; data: ToolConfig }
  | { type: 'fragment'; data: PromptFragment }
  | { type: 'variable'; data: { template: AgentTemplate; variables: Record<string, any> } }
  | { type: 'unknown'; data: unknown };

/**
 * Validation context for additional information.
 */
export interface ValidationContext {
  /** Node identifier (for caching and error reporting) */
  nodeId?: string;

  /** Path to the node in a graph structure */
  path?: string[];

  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Enhanced validation result with context.
 */
export interface EnhancedValidationResult extends ValidationResult {
  /** Node identifier */
  nodeId?: string;

  /** Validation timestamp */
  timestamp: number;

  /** Validation duration in milliseconds */
  duration: number;
}

// ============================================================================
// VALIDATION PIPELINE
// ============================================================================

/**
 * Validates any node type by routing to the appropriate validator.
 *
 * This is the main entry point for validation. It automatically
 * determines the node type and applies the correct validation logic.
 *
 * @param node - Node to validate
 * @param context - Optional validation context
 * @returns Enhanced validation result with timing information
 *
 * @example
 * ```typescript
 * const result = await validateNode({
 *   type: 'template',
 *   data: template
 * }, { nodeId: 'template-1' });
 *
 * if (!result.valid) {
 *   console.error('Validation failed:', result.errors);
 * }
 * ```
 */
export async function validateNode(
  node: ValidatableNode,
  context?: ValidationContext
): Promise<EnhancedValidationResult> {
  const startTime = performance.now();

  let result: ValidationResult;

  try {
    switch (node.type) {
      case 'template':
        result = validateTemplateCore(node.data);
        break;

      case 'tool-config':
        result = validateToolConfigCore(node.data);
        break;

      case 'fragment':
        result = validateFragmentCore(node.data);
        break;

      case 'variable':
        result = validateVariablesCore(node.data.template, node.data.variables);
        break;

      case 'unknown':
      default:
        result = {
          valid: false,
          errors: [
            {
              field: 'type',
              message: `Unknown node type: ${(node as any).type}`,
              severity: 'error',
            },
          ],
        };
    }
  } catch (error) {
    result = {
      valid: false,
      errors: [
        {
          field: 'validation',
          message: error instanceof Error ? error.message : String(error),
          severity: 'error',
        },
      ],
    };
  }

  const duration = performance.now() - startTime;

  return {
    ...result,
    nodeId: context?.nodeId,
    timestamp: Date.now(),
    duration,
  };
}

/**
 * Validates a template specifically.
 *
 * Convenience wrapper around validateNode for template validation.
 *
 * @param template - Template to validate
 * @param context - Optional validation context
 * @returns Enhanced validation result
 *
 * @example
 * ```typescript
 * const result = await validateTemplate(template, { nodeId: 'my-template' });
 * ```
 */
export async function validateTemplate(
  template: AgentTemplate,
  context?: ValidationContext
): Promise<EnhancedValidationResult> {
  return validateNode({ type: 'template', data: template }, context);
}

/**
 * Validates a tool configuration specifically.
 *
 * Convenience wrapper around validateNode for tool config validation.
 *
 * @param config - Tool configuration to validate
 * @param context - Optional validation context
 * @returns Enhanced validation result
 *
 * @example
 * ```typescript
 * const result = await validateToolConfig(config, { nodeId: 'read-config' });
 * ```
 */
export async function validateToolConfig(
  config: ToolConfig,
  context?: ValidationContext
): Promise<EnhancedValidationResult> {
  return validateNode({ type: 'tool-config', data: config }, context);
}

/**
 * Validates a prompt fragment specifically.
 *
 * Convenience wrapper around validateNode for fragment validation.
 *
 * @param fragment - Prompt fragment to validate
 * @param context - Optional validation context
 * @returns Enhanced validation result
 *
 * @example
 * ```typescript
 * const result = await validateFragment(fragment, { nodeId: 'safety-fragment' });
 * ```
 */
export async function validateFragment(
  fragment: PromptFragment,
  context?: ValidationContext
): Promise<EnhancedValidationResult> {
  return validateNode({ type: 'fragment', data: fragment }, context);
}

/**
 * Validates provided variables against template requirements.
 *
 * Convenience wrapper around validateNode for variable validation.
 *
 * @param template - Template with validation rules
 * @param variables - Provided variable values
 * @param context - Optional validation context
 * @returns Enhanced validation result
 *
 * @example
 * ```typescript
 * const result = await validateVariable(
 *   template,
 *   { file: 'src/index.ts', concern: 'security' },
 *   { nodeId: 'vars-check' }
 * );
 * ```
 */
export async function validateVariable(
  template: AgentTemplate,
  variables: Record<string, any>,
  context?: ValidationContext
): Promise<EnhancedValidationResult> {
  return validateNode(
    { type: 'variable', data: { template, variables } },
    context
  );
}

/**
 * Validates multiple nodes in parallel.
 *
 * Efficiently validates multiple nodes at once, returning results
 * in the same order as input.
 *
 * @param nodes - Array of nodes to validate
 * @param contexts - Optional array of validation contexts (matched by index)
 * @returns Array of enhanced validation results
 *
 * @example
 * ```typescript
 * const results = await validateNodes([
 *   { type: 'template', data: template1 },
 *   { type: 'template', data: template2 }
 * ]);
 *
 * const allValid = results.every(r => r.valid);
 * ```
 */
export async function validateNodes(
  nodes: ValidatableNode[],
  contexts?: ValidationContext[]
): Promise<EnhancedValidationResult[]> {
  return Promise.all(
    nodes.map((node, index) =>
      validateNode(node, contexts?.[index])
    )
  );
}

/**
 * Checks if validation result has errors (not just warnings).
 *
 * @param result - Validation result to check
 * @returns True if result has error-severity issues
 *
 * @example
 * ```typescript
 * if (hasErrors(result)) {
 *   throw new Error('Validation failed with errors');
 * }
 * ```
 */
export function hasErrors(result: ValidationResult): boolean {
  return result.errors.some(error => error.severity === 'error');
}

/**
 * Checks if validation result has warnings.
 *
 * @param result - Validation result to check
 * @returns True if result has warning-severity issues
 *
 * @example
 * ```typescript
 * if (hasWarnings(result)) {
 *   console.warn('Validation passed with warnings:', result.errors);
 * }
 * ```
 */
export function hasWarnings(result: ValidationResult): boolean {
  return result.errors.some(error => error.severity === 'warning');
}

/**
 * Filters validation errors by severity.
 *
 * @param result - Validation result
 * @param severity - Severity to filter by
 * @returns Filtered validation errors
 *
 * @example
 * ```typescript
 * const errors = getErrorsBySeverity(result, 'error');
 * const warnings = getErrorsBySeverity(result, 'warning');
 * ```
 */
export function getErrorsBySeverity(
  result: ValidationResult,
  severity: 'error' | 'warning'
): ValidationError[] {
  return result.errors.filter(error => error.severity === severity);
}

/**
 * Formats validation errors into human-readable messages.
 *
 * @param result - Validation result
 * @param includeWarnings - Whether to include warnings (default: true)
 * @returns Array of formatted error messages
 *
 * @example
 * ```typescript
 * const messages = formatValidationErrors(result);
 * messages.forEach(msg => console.error(msg));
 * ```
 */
export function formatValidationErrors(
  result: ValidationResult,
  includeWarnings = true
): string[] {
  const errors = includeWarnings
    ? result.errors
    : result.errors.filter(e => e.severity === 'error');

  return errors.map(error => {
    const prefix = error.severity === 'error' ? 'Error' : 'Warning';
    return `${prefix} in ${error.field}: ${error.message}`;
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * @public
 * @exports validateNode - Validate any node type
 * @exports validateTemplate - Validate template specifically
 * @exports validateToolConfig - Validate tool config specifically
 * @exports validateFragment - Validate fragment specifically
 * @exports validateVariable - Validate variables specifically
 * @exports validateNodes - Validate multiple nodes in parallel
 * @exports hasErrors - Check if result has errors
 * @exports hasWarnings - Check if result has warnings
 * @exports getErrorsBySeverity - Filter errors by severity
 * @exports formatValidationErrors - Format errors as readable messages
 */
