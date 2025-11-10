/**
 * Variable Interpolation and Template Substitution Engine
 *
 * Provides template variable interpolation with support for:
 * - Simple variables: {{ variable }}
 * - Nested properties: {{ base.prompt }}
 * - Default values: {{ var | default: value }}
 * - Conditionals: {{ if condition }}text{{ endif }}
 * - Built-in variables: {{ cwd }}, {{ timestamp }}, etc.
 *
 * @module templates/interpolation
 * @version 1.0.0
 * @author Interpolation Engine Developer (Agent 5)
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/** Regex for matching variable placeholders: {{ variable }} */
const VARIABLE_PATTERN = /\{\{\s*([^}]+)\s*\}\}/g;

/** Regex for matching conditional blocks: {{ if condition }}...{{ endif }} */
const CONDITIONAL_PATTERN = /\{\{\s*if\s+([^}]+)\s*\}\}([\s\S]*?)\{\{\s*endif\s*\}\}/g;

/** Regex for extracting default value: {{ var | default: value }} */
const DEFAULT_VALUE_PATTERN = /^(.+?)\s*\|\s*default:\s*(.+)$/;

/** Built-in variables available in all templates */
const BUILT_IN_VARIABLES: Record<string, () => string> = {
  cwd: () => process.cwd(),
  timestamp: () => new Date().toISOString(),
  date: () => new Date().toISOString().split('T')[0], // YYYY-MM-DD
  time: () => new Date().toISOString().split('T')[1].split('.')[0], // HH:MM:SS
};

// ============================================================================
// TYPES
// ============================================================================

/**
 * Error thrown when variable interpolation fails.
 */
export class InterpolationError extends Error {
  constructor(
    message: string,
    public readonly variable?: string,
    public readonly path?: string,
    public readonly context?: string
  ) {
    super(message);
    this.name = 'InterpolationError';
  }
}

// ============================================================================
// MAIN INTERPOLATION FUNCTION
// ============================================================================

/**
 * Interpolate variables in a template string.
 *
 * Supports:
 * - Simple variables: {{ variable }}
 * - Nested properties: {{ base.prompt }}
 * - Default values: {{ var | default: value }}
 * - Conditionals: {{ if condition }}text{{ endif }}
 * - Built-in variables: {{ cwd }}, {{ timestamp }}, etc.
 *
 * @param template - Template string with {{ variable }} placeholders
 * @param variables - Variable values to substitute
 * @returns Interpolated string with all variables replaced
 * @throws {InterpolationError} If variable is missing or path is invalid
 *
 * @example
 * ```typescript
 * const result = interpolate(
 *   'Review {{ targetFile }} and save to {{ outputPath | default: ./review.md }}',
 *   { targetFile: 'src/index.ts', outputPath: './custom.md' }
 * );
 * // Result: 'Review src/index.ts and save to ./custom.md'
 * ```
 */
export function interpolate(template: string, variables: Record<string, any>): string {
  // First, check for circular references in the template
  detectCircularReferences(template, variables);

  // Merge built-in variables with provided variables (provided variables take precedence)
  const allVariables = {
    ...evaluateBuiltInVariables(),
    ...variables,
  };

  // Process conditionals first (before variable substitution)
  let result = processConditionals(template, allVariables);

  // Then process variable substitutions
  result = result.replace(VARIABLE_PATTERN, (_match, expression) => {
    const trimmedExpression = expression.trim();

    // Check for default value syntax: {{ var | default: value }}
    const defaultMatch = trimmedExpression.match(DEFAULT_VALUE_PATTERN);

    if (defaultMatch) {
      const varName = defaultMatch[1].trim();
      const defaultValue = defaultMatch[2].trim();

      try {
        const value = resolveVariable(varName, allVariables);
        return String(value);
      } catch (error) {
        // Variable not found, use default
        return defaultValue;
      }
    }

    // Simple or nested variable
    try {
      const value = resolveVariable(trimmedExpression, allVariables);
      return String(value);
    } catch (error) {
      if (error instanceof InterpolationError) {
        throw error;
      }
      throw new InterpolationError(
        `Failed to interpolate variable: ${trimmedExpression}`,
        trimmedExpression,
        undefined,
        _match
      );
    }
  });

  return result;
}

// ============================================================================
// VARIABLE RESOLUTION
// ============================================================================

/**
 * Resolve a variable name or nested path to its value.
 *
 * @param path - Variable name or dot-separated path (e.g., "base.prompt")
 * @param variables - Variable values
 * @returns Resolved value
 * @throws {InterpolationError} If variable or path not found
 */
function resolveVariable(path: string, variables: Record<string, any>): any {
  // Handle simple variable (no dots)
  if (!path.includes('.')) {
    if (!(path in variables)) {
      throw new InterpolationError(
        `Variable not found: ${path}`,
        path
      );
    }
    return variables[path];
  }

  // Handle nested property access (e.g., "project.name")
  const parts = path.split('.');
  let current: any = variables;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    if (current === null || current === undefined) {
      throw new InterpolationError(
        `Cannot access property "${part}" of ${current}`,
        path,
        parts.slice(0, i).join('.')
      );
    }

    if (typeof current !== 'object') {
      throw new InterpolationError(
        `Cannot access property "${part}" of non-object type`,
        path,
        parts.slice(0, i).join('.')
      );
    }

    if (!(part in current)) {
      throw new InterpolationError(
        `Property not found: ${part} in path ${path}`,
        path,
        parts.slice(0, i + 1).join('.')
      );
    }

    current = current[part];
  }

  return current;
}

/**
 * Evaluate all built-in variables.
 *
 * @returns Record of built-in variable values
 */
function evaluateBuiltInVariables(): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, fn] of Object.entries(BUILT_IN_VARIABLES)) {
    result[key] = fn();
  }

  return result;
}

// ============================================================================
// CONDITIONAL PROCESSING
// ============================================================================

/**
 * Process conditional blocks in template.
 *
 * Supports: {{ if condition }}text{{ endif }}
 * Supports nested conditionals by processing recursively.
 *
 * @param template - Template string with conditionals
 * @param variables - Variable values
 * @returns Template with conditionals processed
 */
function processConditionals(template: string, variables: Record<string, any>): string {
  let result = template;
  let hasConditionals = true;

  // Process conditionals iteratively to handle nesting
  // Start from innermost conditionals and work outward
  while (hasConditionals) {
    const before = result;
    result = result.replace(CONDITIONAL_PATTERN, (_, condition, content) => {
      const trimmedCondition = condition.trim();

      // Evaluate condition
      const conditionValue = evaluateCondition(trimmedCondition, variables);

      // If condition is truthy, include content; otherwise, remove block
      return conditionValue ? content : '';
    });

    // If no changes were made, we're done
    hasConditionals = before !== result;
  }

  return result;
}

/**
 * Evaluate a conditional expression.
 *
 * @param condition - Condition expression (variable name)
 * @param variables - Variable values
 * @returns True if condition is truthy
 */
function evaluateCondition(condition: string, variables: Record<string, any>): boolean {
  try {
    const value = resolveVariable(condition, variables);
    return Boolean(value);
  } catch (error) {
    // Variable not found or invalid path = falsy condition
    return false;
  }
}

// ============================================================================
// CIRCULAR REFERENCE DETECTION
// ============================================================================

/**
 * Detect circular references in template variables.
 *
 * Checks if any variable value contains a reference to itself.
 *
 * @param template - Template string
 * @param variables - Variable values
 * @throws {InterpolationError} If circular reference detected
 */
function detectCircularReferences(template: string, variables: Record<string, any>): void {
  const variableNames = extractVariables(template);

  for (const varName of variableNames) {
    if (hasCircularReference(varName, variables, new Set())) {
      throw new InterpolationError(
        `Circular reference detected for variable: ${varName}`,
        varName
      );
    }
  }
}

/**
 * Recursively check for circular references.
 *
 * @param varName - Variable name to check
 * @param variables - All variables
 * @param visited - Set of visited variable names
 * @returns True if circular reference exists
 */
function hasCircularReference(
  varName: string,
  variables: Record<string, any>,
  visited: Set<string>
): boolean {
  // If already visited, we have a cycle
  if (visited.has(varName)) {
    return true;
  }

  // Get variable value
  let value: any;
  try {
    value = resolveVariable(varName, variables);
  } catch (error) {
    // Variable doesn't exist, no circular ref
    return false;
  }

  // Only check string values (which might contain variable references)
  if (typeof value !== 'string') {
    return false;
  }

  // Mark as visited
  visited.add(varName);

  // Check if value contains variable references
  const referencedVars = extractVariables(value);

  for (const referencedVar of referencedVars) {
    if (hasCircularReference(referencedVar, variables, new Set(visited))) {
      return true;
    }
  }

  return false;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if template contains any variables.
 *
 * @param template - Template string
 * @returns True if template has {{ variable }} placeholders
 *
 * @example
 * ```typescript
 * hasVariables('Review {{ file }}');  // true
 * hasVariables('No variables here');   // false
 * ```
 */
export function hasVariables(template: string): boolean {
  // Use new RegExp to avoid global regex lastIndex issues
  const varPattern = /\{\{\s*([^}]+)\s*\}\}/;
  const condPattern = /\{\{\s*if\s+([^}]+)\s*\}\}[\s\S]*?\{\{\s*endif\s*\}\}/;

  return varPattern.test(template) || condPattern.test(template);
}

/**
 * Extract all variable names from template.
 *
 * Returns unique variable names (without duplicates).
 * Handles nested properties (returns "base.prompt" as single variable).
 * Handles default values (extracts variable name before "|").
 *
 * @param template - Template string
 * @returns Array of unique variable names
 *
 * @example
 * ```typescript
 * extractVariables('Review {{ file }} and {{ base.prompt }}');
 * // Returns: ['file', 'base.prompt']
 *
 * extractVariables('Model {{ model | default: sonnet }}');
 * // Returns: ['model']
 * ```
 */
export function extractVariables(template: string): string[] {
  const variables = new Set<string>();

  // First, extract conditions from {{ if condition }} patterns
  const conditionalMatches = template.matchAll(CONDITIONAL_PATTERN);

  for (const match of conditionalMatches) {
    const condition = match[1].trim();
    variables.add(condition);
  }

  // Extract variables from {{ variable }} patterns
  const variableMatches = template.matchAll(VARIABLE_PATTERN);

  for (const match of variableMatches) {
    const expression = match[1].trim();

    // Skip conditional keywords (if, endif)
    if (expression.startsWith('if ') || expression === 'endif') {
      continue;
    }

    // Check for default value syntax
    const defaultMatch = expression.match(DEFAULT_VALUE_PATTERN);

    if (defaultMatch) {
      // Extract variable name (before "|")
      const varName = defaultMatch[1].trim();
      variables.add(varName);
    } else {
      // Simple or nested variable
      variables.add(expression);
    }
  }

  return Array.from(variables);
}

/**
 * Validate that all required variables are provided.
 *
 * Returns array of missing variable names. Empty array means all required
 * variables are present.
 *
 * @param template - Template string
 * @param provided - Provided variable values
 * @returns Array of missing variable names (empty if all present)
 *
 * @example
 * ```typescript
 * const template = 'Review {{ file }} and {{ concern }}';
 * const missing = validateVariables(template, { file: 'index.ts' });
 * // Returns: ['concern']
 * ```
 */
export function validateVariables(template: string, provided: Record<string, any>): string[] {
  const required = extractVariables(template);
  const missing: string[] = [];

  // Merge built-in variables with provided
  const allVariables = {
    ...evaluateBuiltInVariables(),
    ...provided,
  };

  for (const varName of required) {
    // Skip variables with default values (they're optional)
    if (hasDefaultValue(template, varName)) {
      continue;
    }

    // Skip variables that are only used in conditionals (they're optional)
    if (isOnlyInConditionals(template, varName)) {
      continue;
    }

    // Check if variable exists
    try {
      resolveVariable(varName, allVariables);
    } catch (error) {
      missing.push(varName);
    }
  }

  return missing;
}

/**
 * Check if a variable has a default value in the template.
 *
 * @param template - Template string
 * @param varName - Variable name to check
 * @returns True if variable has default value syntax
 */
function hasDefaultValue(template: string, varName: string): boolean {
  const pattern = new RegExp(`\\{\\{\\s*${escapeRegex(varName)}\\s*\\|\\s*default:`);
  return pattern.test(template);
}

/**
 * Check if a variable is only used in conditional statements.
 *
 * Variables used exclusively in {{ if varName }} blocks are optional
 * since conditionals evaluate to false when the variable is undefined.
 *
 * @param template - Template string
 * @param varName - Variable name to check
 * @returns True if variable is only used in conditionals
 */
function isOnlyInConditionals(template: string, varName: string): boolean {
  const escapedVar = escapeRegex(varName);

  // Check if variable appears in conditionals: {{ if varName }}
  const inConditional = new RegExp(`\\{\\{\\s*if\\s+${escapedVar}\\s*\\}\\}`);
  const hasConditional = inConditional.test(template);

  if (!hasConditional) {
    return false;
  }

  // Check if variable appears in direct interpolation: {{ varName }}
  // Must NOT be part of "if varName" or have default syntax
  const directPattern = new RegExp(
    `\\{\\{\\s*(?!if\\s)${escapedVar}(?:\\s*\\|[^}]+)?\\s*\\}\\}`,
    'g'
  );
  const hasDirectUsage = directPattern.test(template);

  // If it's only in conditionals and not in direct usage, it's optional
  return !hasDirectUsage;
}

/**
 * Escape special regex characters.
 *
 * @param str - String to escape
 * @returns Escaped string safe for regex
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * @public
 * @exports interpolate - Main interpolation function
 * @exports hasVariables - Check if template contains variables
 * @exports extractVariables - Extract all variable names from template
 * @exports validateVariables - Validate required variables are provided
 * @exports InterpolationError - Error class for interpolation failures
 */
