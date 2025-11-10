/**
 * Template Resolution System
 *
 * Handles inheritance, mixin composition, and tool configuration merging for agent templates.
 * Implements the complete resolution pipeline to produce ready-to-execute configurations.
 *
 * @module templates/resolver
 * @version 1.0.0
 * @author Resolver Architect (Agent 8)
 */

import * as path from 'path';
import type {
  AgentTemplate,
  ResolvedAgentConfig,
  ToolConfig,
  ToolReference,
  AgentSettings,
} from './types';
import { loadTemplate, loadFragment, loadToolConfig } from './loader';
import { interpolate } from './interpolation';

// ============================================================================
// ERROR CLASSES
// ============================================================================

/**
 * Base error class for template resolution failures.
 */
export class TemplateResolutionError extends Error {
  constructor(
    message: string,
    public readonly templateName?: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'TemplateResolutionError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error thrown when circular inheritance is detected.
 */
export class CircularInheritanceError extends TemplateResolutionError {
  constructor(chain: string[]) {
    super(
      `Circular inheritance detected: ${chain.join(' → ')} → ${chain[0]}`,
      chain[0]
    );
    this.name = 'CircularInheritanceError';
  }
}

/**
 * Error thrown when inheritance depth exceeds maximum.
 */
export class MaxDepthExceededError extends TemplateResolutionError {
  constructor(depth: number, maxDepth: number, templateName: string) {
    super(
      `Maximum inheritance depth (${maxDepth}) exceeded at depth ${depth}`,
      templateName
    );
    this.name = 'MaxDepthExceededError';
  }
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Maximum inheritance depth to prevent infinite recursion.
 */
const MAX_INHERITANCE_DEPTH = 10;

/**
 * Model identifier mapping from shorthand to full model ID.
 */
const MODEL_ID_MAP: Record<string, string> = {
  sonnet: 'claude-sonnet-4-5-20250929',
  opus: 'claude-opus-4-20250514',
  haiku: 'claude-haiku-4-20250514',
};

/**
 * Default model if not specified.
 */
const DEFAULT_MODEL = 'claude-sonnet-4-5-20250929';

// ============================================================================
// MAIN RESOLUTION FUNCTION
// ============================================================================

/**
 * Resolves a template into a ready-to-execute agent configuration.
 *
 * Resolution pipeline:
 * 1. Resolve inheritance (extends)
 * 2. Mix in fragments
 * 3. Compose tool configurations
 * 4. Interpolate variables
 * 5. Validate final result
 *
 * @param template - The agent template to resolve
 * @param variables - Variables for interpolation (optional)
 * @returns Fully resolved agent configuration ready for LLMClient.query()
 * @throws {TemplateResolutionError} If resolution fails
 * @throws {CircularInheritanceError} If circular inheritance detected
 * @throws {MaxDepthExceededError} If inheritance depth exceeds maximum
 *
 * @example
 * ```typescript
 * const template = await loadTemplate('./code-reviewer-agent.yaml');
 * const resolved = await resolveTemplate(template, {
 *   targetFile: './src/index.ts',
 *   outputPath: './review.md'
 * });
 *
 * // resolved.prompt contains fully interpolated prompt
 * // resolved.tools is ['Read', 'Write', 'Grep', 'Glob']
 * // resolved.toolConfigs has merged configurations
 * ```
 */
export async function resolveTemplate(
  template: AgentTemplate,
  variables?: Record<string, any>,
  baseDir?: string
): Promise<ResolvedAgentConfig> {
  try {
    // Step 1: Resolve inheritance
    const inheritanceResolved = await resolveExtends(template, baseDir);

    // Step 2: Resolve fragments (mix into prompt)
    const prompt = await resolveFragments(inheritanceResolved, baseDir);

    // Step 3: Resolve tool configurations
    const toolConfigs = await resolveToolConfigs(inheritanceResolved, baseDir);

    // Step 4: Extract tool names from tool references
    const tools = extractToolNames(inheritanceResolved.agent.tools);

    // Step 5: Resolve settings
    const settings = resolveSettings(inheritanceResolved.agent.settings);

    // Step 6: Build variable context for interpolation
    const vars = {
      ...variables,
      templateName: inheritanceResolved.metadata.name,
      templateVersion: inheritanceResolved.metadata.version,
    };

    // Step 7: Resolve runtime configuration (with interpolation)
    const runtime = resolveRuntime(inheritanceResolved.runtime, vars);

    // Step 8: Interpolate variables in prompt
    const interpolatedPrompt = interpolate(prompt, vars);

    // Step 9: Build resolved configuration
    const resolved: ResolvedAgentConfig = {
      prompt: interpolatedPrompt,
      tools,
      toolConfigs,
      settings,
      runtime,
    };

    return resolved;
  } catch (error) {
    if (error instanceof TemplateResolutionError) {
      throw error;
    }
    throw new TemplateResolutionError(
      `Failed to resolve template: ${error instanceof Error ? error.message : String(error)}`,
      template.metadata.name,
      error instanceof Error ? error : undefined
    );
  }
}

// ============================================================================
// INHERITANCE RESOLUTION
// ============================================================================

/**
 * Resolves template inheritance by merging parent templates.
 *
 * Recursively loads and merges parent templates according to inheritance rules:
 * - Child metadata overrides parent (except extends/mixins)
 * - Child prompt is appended to parent prompt
 * - Child tools are added to parent tools (union)
 * - Child settings override specific parent settings (deep merge)
 *
 * @param template - The template to resolve
 * @param baseDir - Base directory for resolving relative paths (optional)
 * @param visited - Set of visited template names to detect circular inheritance
 * @param depth - Current inheritance depth
 * @returns Template with inheritance fully resolved
 * @throws {CircularInheritanceError} If circular inheritance detected
 * @throws {MaxDepthExceededError} If inheritance depth exceeds maximum
 *
 * @example
 * ```typescript
 * const template = await loadTemplate('./code-reviewer-agent.yaml');
 * const resolved = await resolveExtends(template);
 * // resolved contains merged parent + child configuration
 * ```
 */
export async function resolveExtends(
  template: AgentTemplate,
  baseDir?: string,
  visited: Set<string> = new Set(),
  depth: number = 0
): Promise<AgentTemplate> {
  // Check depth limit
  if (depth > MAX_INHERITANCE_DEPTH) {
    throw new MaxDepthExceededError(depth, MAX_INHERITANCE_DEPTH, template.metadata.name);
  }

  // If no extends, return as-is
  if (!template.metadata.extends) {
    return template;
  }

  // Detect circular inheritance
  if (visited.has(template.metadata.name)) {
    const chain = Array.from(visited);
    throw new CircularInheritanceError(chain);
  }

  // Mark as visited
  const newVisited = new Set(visited);
  newVisited.add(template.metadata.name);

  try {
    // Resolve parent path
    const parentPath = resolveTemplatePath(template.metadata.extends, baseDir);

    // Load parent template
    const parentTemplate = await loadTemplate(parentPath);

    // Resolve parent's inheritance recursively
    const parentDir = path.dirname(parentPath);
    const resolvedParent = await resolveExtends(
      parentTemplate,
      parentDir,
      newVisited,
      depth + 1
    );

    // Merge child over parent
    const merged = mergeTemplates(resolvedParent, template);

    // Remove extends field from merged result
    delete merged.metadata.extends;

    return merged;
  } catch (error) {
    // Re-throw CircularInheritanceError and MaxDepthExceededError as-is
    if (error instanceof CircularInheritanceError || error instanceof MaxDepthExceededError) {
      throw error;
    }
    throw new TemplateResolutionError(
      `Failed to resolve extends for template "${template.metadata.name}": ${error instanceof Error ? error.message : String(error)}`,
      template.metadata.name,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Merges a child template with its parent template.
 *
 * Merge rules (from YAML schema contract):
 * - metadata: Child overrides parent (except extends/mixins which are preserved)
 * - agent.description: Child overrides parent
 * - agent.prompt: Child is APPENDED to parent
 * - agent.tools: Union of parent + child (no duplicates)
 * - agent.toolConfigs: Union of parent + child
 * - agent.toolBundles: Union of parent + child
 * - agent.settings: Deep merge (child overrides specific keys)
 * - validation: Deep merge
 * - runtime: Deep merge (child overrides specific keys)
 *
 * @param parent - Parent template
 * @param child - Child template
 * @returns Merged template
 */
function mergeTemplates(parent: AgentTemplate, child: AgentTemplate): AgentTemplate {
  // Merge metadata (child overrides parent, preserve child's extends/mixins)
  const metadata = {
    ...parent.metadata,
    ...child.metadata,
  };

  // Merge agent configuration
  const agent = {
    ...parent.agent,
    ...child.agent,
    // Prompt: APPEND child to parent
    prompt: parent.agent.prompt + '\n\n' + child.agent.prompt,
    // Tools: UNION (no duplicates)
    tools: mergeToolReferences(parent.agent.tools, child.agent.tools),
    // Tool configs: UNION
    toolConfigs: mergeArrays(parent.agent.toolConfigs, child.agent.toolConfigs),
    // Tool bundles: UNION
    toolBundles: mergeArrays(parent.agent.toolBundles, child.agent.toolBundles),
    // Settings: DEEP MERGE
    settings: mergeSettings(parent.agent.settings, child.agent.settings),
  };

  // Merge validation (deep merge)
  const validation = mergeValidation(parent.validation, child.validation);

  // Merge runtime (deep merge)
  const runtime = mergeRuntime(parent.runtime, child.runtime);

  return {
    metadata,
    agent,
    validation,
    runtime,
  };
}

/**
 * Merges two arrays of tool references, removing duplicates.
 *
 * @param parent - Parent tool references
 * @param child - Child tool references
 * @returns Merged array with no duplicates
 */
function mergeToolReferences(
  parent: ToolReference[] = [],
  child: ToolReference[] = []
): ToolReference[] {
  const merged: ToolReference[] = [...parent];
  const parentToolNames = new Set(parent.map(extractToolName));

  for (const childTool of child) {
    const childToolName = extractToolName(childTool);
    if (!parentToolNames.has(childToolName)) {
      merged.push(childTool);
      parentToolNames.add(childToolName);
    }
  }

  return merged;
}

/**
 * Merges two arrays, removing duplicates.
 *
 * @param parent - Parent array
 * @param child - Child array
 * @returns Merged array with no duplicates
 */
function mergeArrays<T>(parent?: T[], child?: T[]): T[] | undefined {
  if (!parent && !child) return undefined;
  if (!parent) return child;
  if (!child) return parent;

  const merged = [...parent];
  const seen = new Set(parent);

  for (const item of child) {
    if (!seen.has(item)) {
      merged.push(item);
      seen.add(item);
    }
  }

  return merged;
}

/**
 * Merges agent settings (deep merge, child overrides parent).
 *
 * @param parent - Parent settings
 * @param child - Child settings
 * @returns Merged settings
 */
function mergeSettings(
  parent?: AgentSettings,
  child?: AgentSettings
): AgentSettings | undefined {
  if (!parent && !child) return undefined;
  if (!parent) return child;
  if (!child) return parent;

  // If child has inherit: 'base', use parent as base
  if (child.inherit === 'base') {
    return {
      ...parent,
      ...child,
      inherit: undefined, // Remove inherit marker
    };
  }

  // Normal deep merge (child overrides parent)
  return {
    ...parent,
    ...child,
  };
}

/**
 * Merges validation rules (deep merge).
 *
 * @param parent - Parent validation rules
 * @param child - Child validation rules
 * @returns Merged validation rules
 */
function mergeValidation(parent: any, child: any): any {
  if (!parent && !child) return undefined;
  if (!parent) return child;
  if (!child) return parent;

  return {
    required: mergeArrays(parent.required, child.required),
    optional: mergeArrays(parent.optional, child.optional),
    types: {
      ...parent.types,
      ...child.types,
    },
  };
}

/**
 * Merges runtime configuration (deep merge, child overrides parent).
 *
 * @param parent - Parent runtime config
 * @param child - Child runtime config
 * @returns Merged runtime config
 */
function mergeRuntime(parent: any, child: any): any {
  if (!parent && !child) return undefined;
  if (!parent) return child;
  if (!child) return parent;

  return {
    ...parent,
    ...child,
  };
}

// ============================================================================
// FRAGMENT MIXING
// ============================================================================

/**
 * Resolves and mixes fragments into the template prompt.
 *
 * Loads all fragment files from the mixins array and concatenates their
 * instructions into the template prompt in order.
 *
 * @param template - The template with mixins to resolve
 * @param baseDir - Base directory for resolving relative paths (optional)
 * @returns Fully composed prompt with fragments mixed in
 * @throws {TemplateResolutionError} If fragment loading fails
 *
 * @example
 * ```typescript
 * const template = await loadTemplate('./code-reviewer.yaml');
 * // template.metadata.mixins = ['./fragments/file-safety.yaml']
 * const prompt = await resolveFragments(template);
 * // prompt contains template prompt + fragment instructions
 * ```
 */
export async function resolveFragments(
  template: AgentTemplate,
  baseDir?: string
): Promise<string> {
  let prompt = template.agent.prompt;

  // If no mixins, return prompt as-is
  if (!template.metadata.mixins || template.metadata.mixins.length === 0) {
    return prompt;
  }

  try {
    // Load and concatenate fragments in order
    for (const mixinPath of template.metadata.mixins) {
      const fragmentPath = resolveTemplatePath(mixinPath, baseDir);
      const fragment = await loadFragment(fragmentPath);

      // Append fragment instructions to prompt
      prompt += '\n\n' + fragment.fragment.instructions;
    }

    return prompt;
  } catch (error) {
    throw new TemplateResolutionError(
      `Failed to resolve fragments for template "${template.metadata.name}": ${error instanceof Error ? error.message : String(error)}`,
      template.metadata.name,
      error instanceof Error ? error : undefined
    );
  }
}

// ============================================================================
// TOOL CONFIG COMPOSITION
// ============================================================================

/**
 * Resolves and composes tool configurations for all tools.
 *
 * Composition priority (highest to lowest):
 * 1. Inline overrides (in template's tools array)
 * 2. Template-level configs (in toolConfigs array)
 * 3. Tool config file inheritance (via extends in config file)
 * 4. Empty config (no restrictions)
 *
 * @param template - The template with tool configs to resolve
 * @param baseDir - Base directory for resolving relative paths (optional)
 * @returns Map of tool name → ToolConfig
 * @throws {TemplateResolutionError} If tool config loading fails
 *
 * @example
 * ```typescript
 * const template = await loadTemplate('./code-reviewer.yaml');
 * const configs = await resolveToolConfigs(template);
 * // configs = { Write: {...}, Read: {...}, ... }
 * ```
 */
export async function resolveToolConfigs(
  template: AgentTemplate,
  baseDir?: string
): Promise<Record<string, ToolConfig>> {
  const configs: Record<string, ToolConfig> = {};

  try {
    // Step 1: Load template-level tool configs
    const templateConfigs = await loadTemplateToolConfigs(template, baseDir);

    // Step 2: Process each tool and build final configs
    for (const toolRef of template.agent.tools) {
      const toolName = extractToolName(toolRef);

      // Get base config from template-level configs
      let baseConfig = templateConfigs[toolName];

      // If tool is object with config path, load that config
      if (typeof toolRef === 'object' && toolRef.config) {
        const configPath = resolveTemplatePath(toolRef.config, baseDir);
        baseConfig = await loadToolConfig(configPath);
      }

      // If tool is object with overrides, apply them
      if (typeof toolRef === 'object' && toolRef.overrides) {
        baseConfig = mergeToolConfig(baseConfig, toolRef.overrides);
      }

      // Store final config (or empty config if none found)
      configs[toolName] = baseConfig || createEmptyToolConfig(toolName);
    }

    return configs;
  } catch (error) {
    throw new TemplateResolutionError(
      `Failed to resolve tool configs for template "${template.metadata.name}": ${error instanceof Error ? error.message : String(error)}`,
      template.metadata.name,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Loads template-level tool configurations from toolConfigs array.
 *
 * @param template - The template
 * @param baseDir - Base directory for resolving paths
 * @returns Map of tool name → ToolConfig
 */
async function loadTemplateToolConfigs(
  template: AgentTemplate,
  baseDir?: string
): Promise<Record<string, ToolConfig>> {
  const configs: Record<string, ToolConfig> = {};

  if (!template.agent.toolConfigs) {
    return configs;
  }

  for (const configPath of template.agent.toolConfigs) {
    const absolutePath = resolveTemplatePath(configPath, baseDir);
    const config = await loadToolConfig(absolutePath);
    configs[config.tool.name] = config;
  }

  return configs;
}

/**
 * Merges tool configuration overrides into base config.
 *
 * @param baseConfig - Base tool configuration
 * @param overrides - Configuration overrides
 * @returns Merged configuration
 */
function mergeToolConfig(
  baseConfig: ToolConfig | undefined,
  overrides: Partial<ToolConfig>
): ToolConfig {
  if (!baseConfig) {
    // If no base config, create one from overrides
    return {
      tool: {
        name: (overrides as any).tool?.name || '',
        ...overrides.tool,
      },
    } as ToolConfig;
  }

  // Handle both wrapped (tool.permissions) and unwrapped (permissions) overrides
  // This allows user-friendly YAML like:
  //   overrides:
  //     permissions:
  //       requireConfirmation: false
  // Instead of requiring:
  //   overrides:
  //     tool:
  //       permissions:
  //         requireConfirmation: false
  const overridesAny = overrides as any;
  const overrideTool = (overrides.tool || {}) as any;
  const unwrappedOverrides = {
    defaultSettings: overridesAny.defaultSettings || overrideTool.defaultSettings,
    permissions: overridesAny.permissions || overrideTool.permissions,
    validation: overridesAny.validation || overrideTool.validation,
    errorHandling: overridesAny.errorHandling || overrideTool.errorHandling,
  };

  return {
    tool: {
      ...baseConfig.tool,
      ...(overrides.tool || {}),
      defaultSettings: baseConfig.tool.defaultSettings || unwrappedOverrides.defaultSettings
        ? {
            ...baseConfig.tool.defaultSettings,
            ...unwrappedOverrides.defaultSettings,
          }
        : undefined,
      permissions: baseConfig.tool.permissions || unwrappedOverrides.permissions
        ? {
            ...baseConfig.tool.permissions,
            ...unwrappedOverrides.permissions,
          }
        : undefined,
      validation: baseConfig.tool.validation || unwrappedOverrides.validation
        ? {
            ...baseConfig.tool.validation,
            ...unwrappedOverrides.validation,
          }
        : undefined,
      errorHandling: baseConfig.tool.errorHandling || unwrappedOverrides.errorHandling
        ? {
            ...baseConfig.tool.errorHandling,
            ...unwrappedOverrides.errorHandling,
          }
        : undefined,
    },
  };
}

/**
 * Creates an empty tool configuration with just the tool name.
 *
 * @param toolName - The tool name
 * @returns Empty tool configuration
 */
function createEmptyToolConfig(toolName: string): ToolConfig {
  return {
    tool: {
      name: toolName,
    },
  };
}

// ============================================================================
// SETTINGS AND RUNTIME RESOLUTION
// ============================================================================

/**
 * Resolves agent settings to final format.
 *
 * Converts model shorthand to full model ID.
 *
 * @param settings - Agent settings
 * @returns Resolved settings with full model ID
 */
function resolveSettings(settings?: AgentSettings): ResolvedAgentConfig['settings'] {
  const model = settings?.model || 'sonnet';
  const modelId = MODEL_ID_MAP[model] || DEFAULT_MODEL;

  return {
    model: modelId,
    temperature: settings?.temperature,
    maxTurns: settings?.maxTurns,
    permissionMode: settings?.permissionMode,
  };
}

/**
 * Resolves runtime configuration.
 *
 * @param runtime - Runtime config
 * @param variables - Variables for interpolation
 * @returns Resolved runtime configuration
 */
function resolveRuntime(
  runtime: any,
  variables?: Record<string, any>
): ResolvedAgentConfig['runtime'] {
  const workingDirectory = runtime?.workingDirectory || process.cwd();

  // Interpolate working directory if it contains variables
  const interpolatedWorkingDir = variables
    ? interpolate(workingDirectory, variables)
    : workingDirectory;

  return {
    workingDirectory: interpolatedWorkingDir,
    timeout: runtime?.timeout,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extracts tool names from an array of tool references.
 *
 * @param tools - Array of tool references (strings or objects)
 * @returns Array of tool names
 */
function extractToolNames(tools: ToolReference[]): string[] {
  return tools.map(extractToolName);
}

/**
 * Extracts the tool name from a tool reference.
 *
 * @param tool - Tool reference (string or object)
 * @returns Tool name
 */
function extractToolName(tool: ToolReference): string {
  return typeof tool === 'string' ? tool : tool.name;
}

/**
 * Resolves a template path to an absolute path.
 *
 * @param filePath - File path (relative or absolute)
 * @param baseDir - Base directory for relative paths (defaults to cwd)
 * @returns Absolute file path
 */
function resolveTemplatePath(filePath: string, baseDir?: string): string {
  if (path.isAbsolute(filePath)) {
    return filePath;
  }

  const base = baseDir || process.cwd();
  return path.resolve(base, filePath);
}

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * @public
 * @exports resolveTemplate - Main resolution function (inheritance + fragments + configs + interpolation)
 * @exports resolveExtends - Resolve template inheritance
 * @exports resolveFragments - Resolve and mix prompt fragments
 * @exports resolveToolConfigs - Resolve and compose tool configurations
 * @exports TemplateResolutionError - Base error class
 * @exports CircularInheritanceError - Circular inheritance error
 * @exports MaxDepthExceededError - Max depth exceeded error
 */
