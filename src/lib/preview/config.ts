/**
 * Config Preview Generator
 *
 * Generates previews of resolved tool configurations showing:
 * - Merged configurations (inheritance + overrides)
 * - Highlighted overridden fields
 * - JSON/YAML output formats
 * - Configuration hierarchy
 *
 * @module lib/preview/config
 * @version 1.0.0
 * @author Validation & Preview Engineer (Agent 4)
 */

import type { AgentTemplate, ToolConfig, ToolReference } from '../../templates/types';
import { loadToolConfig } from '../../templates/loader';
import * as yaml from 'js-yaml';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Config preview showing resolved configuration.
 */
export interface ConfigPreview {
  /** Tool name */
  toolName: string;

  /** Resolved configuration */
  resolved: ToolConfig;

  /** Configuration hierarchy (from base to final) */
  hierarchy: Array<{
    source: string;
    config: ToolConfig;
    level: number;
  }>;

  /** Overridden fields with before/after values */
  overrides: Array<{
    field: string;
    before: any;
    after: any;
    source: string;
  }>;

  /** JSON representation */
  json: string;

  /** YAML representation */
  yaml: string;

  /** Errors encountered during resolution */
  errors: string[];
}

/**
 * Format options for config output.
 */
export interface ConfigFormatOptions {
  /** Output format (default: 'json') */
  format?: 'json' | 'yaml';

  /** Pretty print (default: true) */
  pretty?: boolean;

  /** Indent size (default: 2) */
  indent?: number;

  /** Show overrides inline (default: false) */
  showOverrides?: boolean;
}

// ============================================================================
// PREVIEW GENERATION
// ============================================================================

/**
 * Generates a config preview for a specific tool.
 *
 * This function:
 * 1. Resolves tool configuration with inheritance
 * 2. Merges overrides
 * 3. Highlights overridden fields
 * 4. Generates JSON/YAML outputs
 *
 * @param template - Agent template containing tool reference
 * @param toolName - Name of tool to preview config for
 * @param baseDir - Base directory for resolving config paths
 * @returns Config preview with hierarchy and overrides
 *
 * @example
 * ```typescript
 * const preview = await generateConfigPreview(template, 'Read', '/templates');
 *
 * console.log('Resolved config:', preview.yaml);
 * console.log('Overrides:', preview.overrides);
 * ```
 */
export async function generateConfigPreview(
  template: AgentTemplate,
  toolName: string,
  baseDir?: string
): Promise<ConfigPreview> {
  const errors: string[] = [];

  // Step 1: Find tool reference in template
  const toolRef = findToolReference(template, toolName);

  if (!toolRef) {
    errors.push(`Tool "${toolName}" not found in template`);
    return createEmptyPreview(toolName, errors);
  }

  // Step 2: Build config hierarchy
  const hierarchy = await buildConfigHierarchy(template, toolRef, baseDir, errors);

  // Step 3: Merge configs
  const resolved = mergeConfigs(hierarchy);

  // Step 4: Identify overrides
  const overrides = identifyOverrides(hierarchy);

  // Step 5: Generate output formats
  const jsonOutput = formatAsJson(resolved, { pretty: true, indent: 2 });
  const yamlOutput = formatAsYaml(resolved);

  return {
    toolName,
    resolved,
    hierarchy,
    overrides,
    json: jsonOutput,
    yaml: yamlOutput,
    errors,
  };
}

/**
 * Generates config previews for all tools in a template.
 *
 * @param template - Agent template
 * @param baseDir - Base directory for resolving config paths
 * @returns Map of tool names to config previews
 *
 * @example
 * ```typescript
 * const previews = await generateAllConfigPreviews(template);
 *
 * for (const [toolName, preview] of previews) {
 *   console.log(`${toolName}:`, preview.yaml);
 * }
 * ```
 */
export async function generateAllConfigPreviews(
  template: AgentTemplate,
  baseDir?: string
): Promise<Map<string, ConfigPreview>> {
  const previews = new Map<string, ConfigPreview>();

  // Extract tool names
  const toolNames = extractToolNames(template);

  // Generate preview for each tool
  for (const toolName of toolNames) {
    const preview = await generateConfigPreview(template, toolName, baseDir);
    previews.set(toolName, preview);
  }

  return previews;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Finds tool reference in template.
 *
 * @param template - Agent template
 * @param toolName - Tool name to find
 * @returns Tool reference or null if not found
 */
function findToolReference(
  template: AgentTemplate,
  toolName: string
): ToolReference | null {
  for (const tool of template.agent.tools) {
    if (typeof tool === 'string') {
      if (tool === toolName) {
        return tool;
      }
    } else if (tool.name === toolName) {
      return tool;
    }
  }

  return null;
}

/**
 * Extracts all tool names from template.
 *
 * @param template - Agent template
 * @returns Array of unique tool names
 */
function extractToolNames(template: AgentTemplate): string[] {
  const names = new Set<string>();

  for (const tool of template.agent.tools) {
    const name = typeof tool === 'string' ? tool : tool.name;
    names.add(name);
  }

  return Array.from(names);
}

/**
 * Builds configuration hierarchy for a tool.
 *
 * @param template - Agent template
 * @param toolRef - Tool reference
 * @param baseDir - Base directory for resolving paths
 * @param errors - Array to collect errors
 * @returns Hierarchy of configurations from base to final
 */
async function buildConfigHierarchy(
  template: AgentTemplate,
  toolRef: ToolReference,
  _baseDir: string | undefined,
  errors: string[]
): Promise<Array<{ source: string; config: ToolConfig; level: number }>> {
  const hierarchy: Array<{ source: string; config: ToolConfig; level: number }> = [];

  // Level 0: Global tool configs from template
  if (template.agent.toolConfigs) {
    for (const configPath of template.agent.toolConfigs) {
      try {
        const config = await loadToolConfig(configPath);
        const toolName = typeof toolRef === 'string' ? toolRef : toolRef.name;

        if (config.tool.name === toolName) {
          hierarchy.push({
            source: configPath,
            config,
            level: 0,
          });
        }
      } catch (error) {
        errors.push(
          `Failed to load global config "${configPath}": ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }
  }

  // Level 1: Tool-specific config (if object reference)
  if (typeof toolRef !== 'string' && toolRef.config) {
    try {
      const config = await loadToolConfig(toolRef.config);
      hierarchy.push({
        source: toolRef.config,
        config,
        level: 1,
      });
    } catch (error) {
      errors.push(
        `Failed to load tool config "${toolRef.config}": ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  // Level 2: Inline overrides (if object reference)
  if (typeof toolRef !== 'string' && toolRef.overrides) {
    const toolName = toolRef.name;
    const overrideConfig: ToolConfig = {
      tool: {
        name: toolName,
        ...toolRef.overrides.tool,
      },
    };

    hierarchy.push({
      source: 'inline-overrides',
      config: overrideConfig,
      level: 2,
    });
  }

  return hierarchy;
}

/**
 * Merges configuration hierarchy into final config.
 *
 * @param hierarchy - Configuration hierarchy
 * @returns Merged configuration
 */
function mergeConfigs(
  hierarchy: Array<{ source: string; config: ToolConfig; level: number }>
): ToolConfig {
  if (hierarchy.length === 0) {
    // No config found, return minimal config
    return {
      tool: {
        name: 'Unknown',
      },
    };
  }

  // Start with first config
  let merged = deepClone(hierarchy[0].config);

  // Merge subsequent configs
  for (let i = 1; i < hierarchy.length; i++) {
    merged = deepMerge(merged, hierarchy[i].config);
  }

  return merged;
}

/**
 * Identifies overridden fields in hierarchy.
 *
 * @param hierarchy - Configuration hierarchy
 * @returns Array of overrides with before/after values
 */
function identifyOverrides(
  hierarchy: Array<{ source: string; config: ToolConfig; level: number }>
): Array<{ field: string; before: any; after: any; source: string }> {
  const overrides: Array<{ field: string; before: any; after: any; source: string }> = [];

  if (hierarchy.length <= 1) {
    return overrides;
  }

  // Compare each level to the previous
  for (let i = 1; i < hierarchy.length; i++) {
    const before = hierarchy[i - 1].config;
    const after = hierarchy[i].config;
    const source = hierarchy[i].source;

    // Find differences
    const diffs = findDifferences('tool', before.tool, after.tool);

    for (const diff of diffs) {
      overrides.push({
        field: diff.path,
        before: diff.before,
        after: diff.after,
        source,
      });
    }
  }

  return overrides;
}

/**
 * Finds differences between two objects.
 *
 * @param path - Current path (for nested objects)
 * @param before - Before object
 * @param after - After object
 * @returns Array of differences
 */
function findDifferences(
  path: string,
  before: any,
  after: any
): Array<{ path: string; before: any; after: any }> {
  const diffs: Array<{ path: string; before: any; after: any }> = [];

  // Handle undefined/null
  if (before === undefined || before === null) {
    if (after !== undefined && after !== null) {
      diffs.push({ path, before, after });
    }
    return diffs;
  }

  if (after === undefined || after === null) {
    return diffs; // Removal not counted as override
  }

  // Handle primitives and arrays
  if (typeof before !== 'object' || typeof after !== 'object') {
    if (before !== after) {
      diffs.push({ path, before, after });
    }
    return diffs;
  }

  // Handle objects recursively
  const allKeys = new Set([
    ...Object.keys(before),
    ...Object.keys(after),
  ]);

  for (const key of allKeys) {
    const nestedPath = `${path}.${key}`;
    const nestedDiffs = findDifferences(nestedPath, before[key], after[key]);
    diffs.push(...nestedDiffs);
  }

  return diffs;
}

/**
 * Deep clones an object.
 *
 * @param obj - Object to clone
 * @returns Cloned object
 */
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Deep merges two objects.
 *
 * @param target - Target object
 * @param source - Source object
 * @returns Merged object
 */
function deepMerge<T>(target: T, source: Partial<T>): T {
  const result = { ...target };

  for (const key in source) {
    const sourceValue = source[key];
    const targetValue = (target as any)[key];

    if (
      sourceValue !== null &&
      typeof sourceValue === 'object' &&
      !Array.isArray(sourceValue) &&
      targetValue !== null &&
      typeof targetValue === 'object' &&
      !Array.isArray(targetValue)
    ) {
      // Recursive merge for nested objects
      (result as any)[key] = deepMerge(targetValue, sourceValue as any);
    } else {
      // Direct assignment for primitives and arrays
      (result as any)[key] = sourceValue;
    }
  }

  return result;
}

/**
 * Creates an empty preview (for errors).
 *
 * @param toolName - Tool name
 * @param errors - Errors
 * @returns Empty preview
 */
function createEmptyPreview(toolName: string, errors: string[]): ConfigPreview {
  const emptyConfig: ToolConfig = {
    tool: { name: toolName },
  };

  return {
    toolName,
    resolved: emptyConfig,
    hierarchy: [],
    overrides: [],
    json: formatAsJson(emptyConfig, { pretty: true }),
    yaml: formatAsYaml(emptyConfig),
    errors,
  };
}

// ============================================================================
// FORMATTING
// ============================================================================

/**
 * Formats config as JSON.
 *
 * @param config - Tool configuration
 * @param options - Format options
 * @returns JSON string
 */
export function formatAsJson(
  config: ToolConfig,
  options?: ConfigFormatOptions
): string {
  const indent = options?.indent ?? 2;
  const pretty = options?.pretty ?? true;

  return pretty
    ? JSON.stringify(config, null, indent)
    : JSON.stringify(config);
}

/**
 * Formats config as YAML.
 *
 * @param config - Tool configuration
 * @param options - Format options
 * @returns YAML string
 */
export function formatAsYaml(
  config: ToolConfig,
  options?: ConfigFormatOptions
): string {
  const indent = options?.indent ?? 2;

  return yaml.dump(config, { indent });
}

/**
 * Formats overrides for display.
 *
 * @param overrides - Array of overrides
 * @returns Formatted override list
 */
export function formatOverrides(
  overrides: Array<{ field: string; before: any; after: any; source: string }>
): string {
  if (overrides.length === 0) {
    return 'No overrides';
  }

  const lines: string[] = [];

  for (const override of overrides) {
    lines.push(`\n${override.field}:`);
    lines.push(`  Source: ${override.source}`);
    lines.push(`  Before: ${JSON.stringify(override.before)}`);
    lines.push(`  After:  ${JSON.stringify(override.after)}`);
  }

  return lines.join('\n');
}

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * @public
 * @exports generateConfigPreview - Generate config preview for a tool
 * @exports generateAllConfigPreviews - Generate previews for all tools
 * @exports formatAsJson - Format config as JSON
 * @exports formatAsYaml - Format config as YAML
 * @exports formatOverrides - Format overrides for display
 */
