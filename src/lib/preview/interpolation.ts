/**
 * Interpolation Preview
 *
 * Provides previews of variable interpolation showing:
 * - Variable substitution before/after
 * - Default value handling
 * - Missing variables detection
 * - Token counting
 *
 * @module lib/preview/interpolation
 * @version 1.0.0
 * @author Validation & Preview Engineer (Agent 4)
 */

import {
  interpolate,
  extractVariables,
  validateVariables,
  InterpolationError,
} from '../../templates/interpolation';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Interpolation preview showing variable substitution.
 */
export interface InterpolationPreview {
  /** Original template before interpolation */
  template: string;

  /** Interpolated result (null if errors) */
  result: string | null;

  /** All variables found in template */
  variables: VariableInfo[];

  /** Missing required variables */
  missingVariables: string[];

  /** Token counts before and after */
  tokenCount: {
    before: number;
    after: number | null;
  };

  /** Interpolation errors (if any) */
  errors: string[];
}

/**
 * Information about a variable.
 */
export interface VariableInfo {
  /** Variable name */
  name: string;

  /** Whether variable is provided */
  provided: boolean;

  /** Provided value (if any) */
  value: any;

  /** Has default value in template */
  hasDefault: boolean;

  /** Occurrences in template */
  occurrences: number;

  /** Example usage from template */
  exampleUsage: string;
}

/**
 * Variable substitution detail.
 */
export interface VariableSubstitution {
  /** Variable name */
  variable: string;

  /** Original placeholder (e.g., "{{ file }}") */
  placeholder: string;

  /** Substituted value */
  value: string;

  /** Position in template */
  position: number;
}

// ============================================================================
// PREVIEW GENERATION
// ============================================================================

/**
 * Generates an interpolation preview showing variable substitution.
 *
 * This function:
 * 1. Identifies all variables
 * 2. Checks which are provided
 * 3. Attempts interpolation
 * 4. Shows before/after states
 * 5. Counts tokens
 *
 * @param template - Template string to interpolate
 * @param variables - Variable values to substitute
 * @returns Interpolation preview with detailed information
 *
 * @example
 * ```typescript
 * const preview = interpolatePreview(
 *   'Review {{ file }} for {{ concern | default: quality }}',
 *   { file: 'src/index.ts' }
 * );
 *
 * console.log('Result:', preview.result);
 * console.log('Missing:', preview.missingVariables);
 * console.log('Variables:', preview.variables);
 * ```
 */
export function interpolatePreview(
  template: string,
  variables: Record<string, any> = {}
): InterpolationPreview {
  const errors: string[] = [];

  // Step 1: Extract all variables
  const allVariables = extractVariables(template);

  // Step 2: Gather variable information
  const variableInfo = gatherVariableInfo(template, allVariables, variables);

  // Step 3: Identify missing variables
  const missingVariables = validateVariables(template, variables);

  // Step 4: Attempt interpolation
  let result: string | null = null;
  if (missingVariables.length === 0) {
    try {
      result = interpolate(template, variables);
    } catch (error) {
      if (error instanceof InterpolationError) {
        errors.push(`Interpolation failed: ${error.message}`);
      } else {
        errors.push(
          `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  } else {
    errors.push(
      `Cannot interpolate: missing required variables: ${missingVariables.join(', ')}`
    );
  }

  // Step 5: Count tokens
  const beforeTokens = estimateTokens(template);
  const afterTokens = result ? estimateTokens(result) : null;

  return {
    template,
    result,
    variables: variableInfo,
    missingVariables,
    tokenCount: {
      before: beforeTokens,
      after: afterTokens,
    },
    errors,
  };
}

/**
 * Gets detailed substitution information for each variable occurrence.
 *
 * @param template - Template string
 * @param variables - Variable values
 * @returns Array of substitution details
 *
 * @example
 * ```typescript
 * const subs = getSubstitutions('Review {{ file }} and {{ file }}', { file: 'index.ts' });
 * // Returns 2 substitutions for 'file' at different positions
 * ```
 */
export function getSubstitutions(
  template: string,
  variables: Record<string, any>
): VariableSubstitution[] {
  const substitutions: VariableSubstitution[] = [];
  const pattern = /\{\{\s*([^}]+)\s*\}\}/g;

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(template)) !== null) {
    const fullMatch = match[0];
    const expression = match[1].trim();

    // Skip conditionals
    if (expression.startsWith('if ') || expression === 'endif') {
      continue;
    }

    // Extract variable name (handle defaults)
    const defaultMatch = expression.match(/^(.+?)\s*\|\s*default:\s*(.+)$/);
    const varName = defaultMatch ? defaultMatch[1].trim() : expression;
    const defaultValue = defaultMatch ? defaultMatch[2].trim() : undefined;

    // Get value
    let value: string;
    if (varName in variables) {
      value = String(variables[varName]);
    } else if (defaultValue !== undefined) {
      value = defaultValue;
    } else {
      value = `[MISSING: ${varName}]`;
    }

    substitutions.push({
      variable: varName,
      placeholder: fullMatch,
      value,
      position: match.index,
    });
  }

  return substitutions;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Gathers detailed information about variables.
 *
 * @param template - Template string
 * @param variableNames - Variable names to gather info for
 * @param providedVariables - Provided variable values
 * @returns Array of variable information
 */
function gatherVariableInfo(
  template: string,
  variableNames: string[],
  providedVariables: Record<string, any>
): VariableInfo[] {
  return variableNames.map(varName => {
    const provided = varName in providedVariables;
    const value = provided ? providedVariables[varName] : undefined;
    const hasDefault = checkHasDefault(template, varName);
    const occurrences = countOccurrences(template, varName);
    const exampleUsage = getExampleUsage(template, varName);

    return {
      name: varName,
      provided,
      value,
      hasDefault,
      occurrences,
      exampleUsage,
    };
  });
}

/**
 * Checks if a variable has a default value.
 *
 * @param template - Template string
 * @param varName - Variable name
 * @returns True if variable has default
 */
function checkHasDefault(template: string, varName: string): boolean {
  const escapedVar = escapeRegex(varName);
  const pattern = new RegExp(`\\{\\{\\s*${escapedVar}\\s*\\|\\s*default:`);
  return pattern.test(template);
}

/**
 * Counts occurrences of a variable in template.
 *
 * @param template - Template string
 * @param varName - Variable name
 * @returns Number of occurrences
 */
function countOccurrences(template: string, varName: string): number {
  const escapedVar = escapeRegex(varName);
  const pattern = new RegExp(`\\{\\{\\s*${escapedVar}(?:\\s*\\|[^}]+)?\\s*\\}\\}`, 'g');
  const matches = template.match(pattern);
  return matches ? matches.length : 0;
}

/**
 * Gets an example usage of a variable from template.
 *
 * @param template - Template string
 * @param varName - Variable name
 * @returns Example usage string
 */
function getExampleUsage(template: string, varName: string): string {
  const escapedVar = escapeRegex(varName);
  const pattern = new RegExp(`\\{\\{\\s*${escapedVar}(?:\\s*\\|[^}]+)?\\s*\\}\\}`);
  const match = template.match(pattern);
  return match ? match[0] : `{{ ${varName} }}`;
}

/**
 * Escapes regex special characters.
 *
 * @param str - String to escape
 * @returns Escaped string
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Estimates token count for text.
 *
 * @param text - Text to count tokens for
 * @returns Estimated token count
 */
function estimateTokens(text: string): number {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  return Math.ceil(words.length * 0.75);
}

// ============================================================================
// FORMATTING
// ============================================================================

/**
 * Formats interpolation preview for display.
 *
 * @param preview - Interpolation preview
 * @returns Formatted string
 *
 * @example
 * ```typescript
 * const formatted = formatInterpolationPreview(preview);
 * console.log(formatted);
 * ```
 */
export function formatInterpolationPreview(preview: InterpolationPreview): string {
  const sections: string[] = [];

  sections.push('=== Interpolation Preview ===\n');

  // Variables
  sections.push('Variables:');
  if (preview.variables.length > 0) {
    preview.variables.forEach(v => {
      const status = v.provided
        ? `✅ ${JSON.stringify(v.value)}`
        : v.hasDefault
        ? '⚙️  (has default)'
        : '❌ Missing';
      sections.push(`  - ${v.name}: ${status}`);
      sections.push(`    Usage: ${v.exampleUsage} (${v.occurrences}x)`);
    });
  } else {
    sections.push('  (none)');
  }
  sections.push('');

  // Token count
  sections.push('Token count (estimated):');
  sections.push(`  Before: ${preview.tokenCount.before} tokens`);
  if (preview.tokenCount.after !== null) {
    const diff = preview.tokenCount.after - preview.tokenCount.before;
    const diffStr = diff >= 0 ? `+${diff}` : `${diff}`;
    sections.push(`  After:  ${preview.tokenCount.after} tokens (${diffStr})`);
  }
  sections.push('');

  // Errors
  if (preview.errors.length > 0) {
    sections.push('Errors:');
    preview.errors.forEach(err => {
      sections.push(`  ⚠️  ${err}`);
    });
    sections.push('');
  }

  // Before
  sections.push('--- Before ---');
  sections.push(preview.template);
  sections.push('');

  // After
  if (preview.result) {
    sections.push('--- After ---');
    sections.push(preview.result);
    sections.push('');
  }

  return sections.join('\n');
}

/**
 * Generates a side-by-side diff of interpolation.
 *
 * @param preview - Interpolation preview
 * @param maxWidth - Maximum width per column (default: 60)
 * @returns Side-by-side diff string
 *
 * @example
 * ```typescript
 * const diff = generateSideBySideDiff(preview);
 * console.log(diff);
 * ```
 */
export function generateSideBySideDiff(
  preview: InterpolationPreview,
  maxWidth: number = 60
): string {
  if (!preview.result) {
    return preview.template;
  }

  const beforeLines = preview.template.split('\n');
  const afterLines = preview.result.split('\n');
  const maxLines = Math.max(beforeLines.length, afterLines.length);

  const lines: string[] = [];
  lines.push('Before'.padEnd(maxWidth) + ' | After');
  lines.push('-'.repeat(maxWidth) + '-+-' + '-'.repeat(maxWidth));

  for (let i = 0; i < maxLines; i++) {
    const before = (beforeLines[i] || '').slice(0, maxWidth).padEnd(maxWidth);
    const after = (afterLines[i] || '').slice(0, maxWidth);
    lines.push(`${before} | ${after}`);
  }

  return lines.join('\n');
}

/**
 * Generates a unified diff showing changes.
 *
 * @param preview - Interpolation preview
 * @returns Unified diff string
 *
 * @example
 * ```typescript
 * const diff = generateUnifiedDiff(preview);
 * console.log(diff);
 * ```
 */
export function generateUnifiedDiff(preview: InterpolationPreview): string {
  if (!preview.result) {
    return preview.template;
  }

  const beforeLines = preview.template.split('\n');
  const afterLines = preview.result.split('\n');
  const maxLines = Math.max(beforeLines.length, afterLines.length);

  const lines: string[] = [];

  for (let i = 0; i < maxLines; i++) {
    const before = beforeLines[i] || '';
    const after = afterLines[i] || '';

    if (before !== after) {
      if (before) {
        lines.push(`- ${before}`);
      }
      if (after) {
        lines.push(`+ ${after}`);
      }
    } else {
      lines.push(`  ${before}`);
    }
  }

  return lines.join('\n');
}

/**
 * Highlights variable placeholders in template.
 *
 * @param template - Template string
 * @param style - Highlight style ('brackets', 'color', 'markdown')
 * @returns Highlighted template
 *
 * @example
 * ```typescript
 * const highlighted = highlightVariables('Review {{ file }}', 'markdown');
 * // Returns: 'Review **{{ file }}**'
 * ```
 */
export function highlightVariables(
  template: string,
  style: 'brackets' | 'color' | 'markdown' = 'markdown'
): string {
  const pattern = /(\{\{\s*[^}]+\s*\}\})/g;

  switch (style) {
    case 'brackets':
      return template.replace(pattern, '[$1]');
    case 'markdown':
      return template.replace(pattern, '**$1**');
    case 'color':
      // ANSI color codes (yellow)
      return template.replace(pattern, '\x1b[33m$1\x1b[0m');
    default:
      return template;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * @public
 * @exports interpolatePreview - Generate interpolation preview
 * @exports getSubstitutions - Get detailed substitution info
 * @exports formatInterpolationPreview - Format preview for display
 * @exports generateSideBySideDiff - Generate side-by-side diff
 * @exports generateUnifiedDiff - Generate unified diff
 * @exports highlightVariables - Highlight variable placeholders
 */
