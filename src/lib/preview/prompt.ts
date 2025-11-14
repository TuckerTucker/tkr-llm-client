/**
 * Prompt Preview Generator
 *
 * Generates previews of fully composed prompts showing:
 * - Fragment composition in order
 * - Before/after variable interpolation
 * - Missing variables
 * - Token counting (estimated)
 *
 * @module lib/preview/prompt
 * @version 1.0.0
 * @author Validation & Preview Engineer (Agent 4)
 */

import type { AgentTemplate } from '../../templates/types';
import {
  interpolate,
  extractVariables,
  validateVariables as getRequiredVariables,
  hasVariables,
} from '../../templates/interpolation';
import { loadFragment } from '../../templates/loader';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Prompt preview showing before/after interpolation.
 */
export interface PromptPreview {
  /** Raw prompt before interpolation */
  before: string;

  /** Interpolated prompt (if variables provided) */
  after: string | null;

  /** All variables found in prompt */
  variables: string[];

  /** Missing required variables */
  missingVariables: string[];

  /** Fragment sources (if fragments used) */
  fragments: Array<{
    name: string;
    content: string;
    order: number;
  }>;

  /** Estimated token count (before and after) */
  tokenCount: {
    before: number;
    after: number | null;
  };

  /** Interpolation errors (if any) */
  errors: string[];
}

// ============================================================================
// PREVIEW GENERATION
// ============================================================================

/**
 * Generates a prompt preview showing composition and interpolation.
 *
 * This function:
 * 1. Collects fragments in order
 * 2. Concatenates with template prompt
 * 3. Identifies all variables
 * 4. Optionally interpolates if variables provided
 * 5. Estimates token counts
 *
 * @param template - Agent template to preview
 * @param variables - Optional variables for interpolation
 * @param baseDir - Base directory for resolving fragment paths
 * @returns Prompt preview with before/after states
 *
 * @example
 * ```typescript
 * const preview = await generatePromptPreview(template, {
 *   file: 'src/index.ts',
 *   concern: 'security'
 * });
 *
 * console.log('Before:', preview.before);
 * console.log('After:', preview.after);
 * console.log('Missing:', preview.missingVariables);
 * ```
 */
export async function generatePromptPreview(
  template: AgentTemplate,
  variables?: Record<string, any>,
  baseDir?: string
): Promise<PromptPreview> {
  const errors: string[] = [];

  // Step 1: Collect fragments
  const fragments = await collectFragments(template, baseDir, errors);

  // Step 2: Compose full prompt (fragments + template prompt)
  const composedPrompt = composePrompt(template, fragments);

  // Step 3: Extract variables
  const allVariables = extractVariables(composedPrompt);

  // Step 4: Identify missing variables
  const missingVariables = variables
    ? getRequiredVariables(composedPrompt, variables)
    : allVariables;

  // Step 5: Interpolate (if variables provided and complete)
  let interpolatedPrompt: string | null = null;
  if (variables && missingVariables.length === 0) {
    try {
      interpolatedPrompt = interpolate(composedPrompt, variables);
    } catch (error) {
      errors.push(
        `Interpolation failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // Step 6: Estimate token counts
  const beforeTokens = estimateTokens(composedPrompt);
  const afterTokens = interpolatedPrompt ? estimateTokens(interpolatedPrompt) : null;

  return {
    before: composedPrompt,
    after: interpolatedPrompt,
    variables: allVariables,
    missingVariables,
    fragments,
    tokenCount: {
      before: beforeTokens,
      after: afterTokens,
    },
    errors,
  };
}

/**
 * Collects and loads all fragments referenced by the template.
 *
 * @param template - Agent template
 * @param baseDir - Base directory for resolving paths
 * @param errors - Array to collect errors
 * @returns Array of loaded fragments with metadata
 */
async function collectFragments(
  template: AgentTemplate,
  _baseDir: string | undefined,
  errors: string[]
): Promise<Array<{ name: string; content: string; order: number }>> {
  const fragments: Array<{ name: string; content: string; order: number }> = [];

  if (!template.metadata.mixins || template.metadata.mixins.length === 0) {
    return fragments;
  }

  // Load each fragment
  for (let i = 0; i < template.metadata.mixins.length; i++) {
    const mixinPath = template.metadata.mixins[i];

    try {
      const fragment = await loadFragment(mixinPath);
      fragments.push({
        name: fragment.fragment.name,
        content: fragment.fragment.instructions,
        order: i,
      });
    } catch (error) {
      errors.push(
        `Failed to load fragment "${mixinPath}": ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  return fragments;
}

/**
 * Composes the full prompt from fragments and template prompt.
 *
 * Concatenates fragments in order, then appends the template's main prompt.
 *
 * @param template - Agent template
 * @param fragments - Loaded fragments
 * @returns Composed prompt string
 */
function composePrompt(
  template: AgentTemplate,
  fragments: Array<{ name: string; content: string; order: number }>
): string {
  const parts: string[] = [];

  // Add fragments in order
  const sortedFragments = [...fragments].sort((a, b) => a.order - b.order);
  for (const fragment of sortedFragments) {
    parts.push(`# Fragment: ${fragment.name}\n\n${fragment.content}`);
  }

  // Add main template prompt
  parts.push(`# Main Prompt\n\n${template.agent.prompt}`);

  return parts.join('\n\n---\n\n');
}

/**
 * Estimates token count for a text string.
 *
 * Uses a simple heuristic: ~0.75 tokens per word (typical for English text).
 * This is an approximation - actual token counts depend on the tokenizer.
 *
 * @param text - Text to estimate tokens for
 * @returns Estimated token count
 */
function estimateTokens(text: string): number {
  // Rough heuristic: split on whitespace and punctuation
  const words = text.split(/\s+/).filter(w => w.length > 0);

  // Claude models use ~0.75 tokens per word on average
  return Math.ceil(words.length * 0.75);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Checks if a template has variables in its prompt.
 *
 * @param template - Template to check
 * @returns True if prompt contains variables
 *
 * @example
 * ```typescript
 * if (hasPromptVariables(template)) {
 *   console.log('Template requires variable interpolation');
 * }
 * ```
 */
export function hasPromptVariables(template: AgentTemplate): boolean {
  return hasVariables(template.agent.prompt);
}

/**
 * Gets all variables used in a template's prompt.
 *
 * @param template - Template to analyze
 * @returns Array of variable names
 *
 * @example
 * ```typescript
 * const vars = getPromptVariables(template);
 * console.log('Required variables:', vars);
 * ```
 */
export function getPromptVariables(template: AgentTemplate): string[] {
  return extractVariables(template.agent.prompt);
}

/**
 * Validates that all required prompt variables are provided.
 *
 * @param template - Template to validate
 * @param variables - Provided variables
 * @returns Array of missing variable names (empty if all provided)
 *
 * @example
 * ```typescript
 * const missing = validatePromptVariables(template, { file: 'index.ts' });
 * if (missing.length > 0) {
 *   console.error('Missing:', missing);
 * }
 * ```
 */
export function validatePromptVariables(
  template: AgentTemplate,
  variables: Record<string, any>
): string[] {
  return getRequiredVariables(template.agent.prompt, variables);
}

/**
 * Generates a diff-style preview showing variable substitutions.
 *
 * Returns a formatted string showing what changed during interpolation.
 *
 * @param before - Prompt before interpolation
 * @param after - Prompt after interpolation
 * @returns Diff-style preview
 *
 * @example
 * ```typescript
 * const diff = generateDiffPreview(preview.before, preview.after);
 * console.log(diff);
 * // - Review {{ file }} for {{ concern }}
 * // + Review src/index.ts for security
 * ```
 */
export function generateDiffPreview(before: string, after: string | null): string {
  if (!after) {
    return before;
  }

  const lines: string[] = [];

  // Split into lines
  const beforeLines = before.split('\n');
  const afterLines = after.split('\n');

  const maxLines = Math.max(beforeLines.length, afterLines.length);

  for (let i = 0; i < maxLines; i++) {
    const beforeLine = beforeLines[i] || '';
    const afterLine = afterLines[i] || '';

    if (beforeLine !== afterLine) {
      if (beforeLine) {
        lines.push(`- ${beforeLine}`);
      }
      if (afterLine) {
        lines.push(`+ ${afterLine}`);
      }
    } else {
      lines.push(`  ${beforeLine}`);
    }
  }

  return lines.join('\n');
}

/**
 * Formats a prompt preview for display.
 *
 * Returns a human-readable formatted preview with sections.
 *
 * @param preview - Prompt preview to format
 * @returns Formatted preview string
 *
 * @example
 * ```typescript
 * const formatted = formatPromptPreview(preview);
 * console.log(formatted);
 * ```
 */
export function formatPromptPreview(preview: PromptPreview): string {
  const sections: string[] = [];

  // Header
  sections.push('=== Prompt Preview ===\n');

  // Fragments (if any)
  if (preview.fragments.length > 0) {
    sections.push('Fragments:');
    preview.fragments.forEach(f => {
      sections.push(`  ${f.order + 1}. ${f.name}`);
    });
    sections.push('');
  }

  // Variables
  sections.push('Variables:');
  if (preview.variables.length > 0) {
    preview.variables.forEach(v => {
      const status = preview.missingVariables.includes(v) ? '❌ Missing' : '✅ Provided';
      sections.push(`  - ${v} ${status}`);
    });
  } else {
    sections.push('  (none)');
  }
  sections.push('');

  // Token count
  sections.push(`Token count (estimated):`);
  sections.push(`  Before: ${preview.tokenCount.before} tokens`);
  if (preview.tokenCount.after !== null) {
    sections.push(`  After:  ${preview.tokenCount.after} tokens`);
  }
  sections.push('');

  // Errors (if any)
  if (preview.errors.length > 0) {
    sections.push('Errors:');
    preview.errors.forEach(err => {
      sections.push(`  ⚠️  ${err}`);
    });
    sections.push('');
  }

  // Before prompt
  sections.push('--- Before Interpolation ---');
  sections.push(preview.before);
  sections.push('');

  // After prompt (if available)
  if (preview.after) {
    sections.push('--- After Interpolation ---');
    sections.push(preview.after);
    sections.push('');
  }

  return sections.join('\n');
}

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * @public
 * @exports generatePromptPreview - Generate prompt preview
 * @exports hasPromptVariables - Check if template has variables
 * @exports getPromptVariables - Get all prompt variables
 * @exports validatePromptVariables - Validate required variables
 * @exports generateDiffPreview - Generate diff-style preview
 * @exports formatPromptPreview - Format preview for display
 */
