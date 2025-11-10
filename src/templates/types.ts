/**
 * Type System for Agent Template System
 *
 * Complete TypeScript type definitions for the agent template system.
 * This module provides type safety and runtime type checking for template
 * loading, validation, composition, and execution.
 *
 * @module templates/types
 * @version 1.0.0
 * @author Type System Architect (Agent 1)
 */

// ============================================================================
// CORE TEMPLATE TYPES
// ============================================================================

/**
 * Complete agent template definition loaded from YAML.
 *
 * Represents the full structure of an agent template including metadata,
 * configuration, validation rules, and runtime settings. This is the root
 * type for all template operations.
 *
 * @example
 * ```typescript
 * const template: AgentTemplate = {
 *   metadata: {
 *     name: 'code-reviewer',
 *     version: '1.0.0',
 *     description: 'Reviews code for quality and security'
 *   },
 *   agent: {
 *     description: 'Code review specialist',
 *     prompt: 'Review {{ file }} for {{ concern }}',
 *     tools: ['Read', 'Grep']
 *   }
 * };
 * ```
 */
export interface AgentTemplate {
  /** Template identification and composition metadata */
  metadata: TemplateMetadata;

  /** Agent behavior and tool configuration */
  agent: AgentConfig;

  /** Optional validation rules for template inputs */
  validation?: ValidationRules;

  /** Optional runtime execution configuration */
  runtime?: RuntimeConfig;
}

/**
 * Template identification and composition information.
 *
 * Defines the identity and composition strategy for an agent template,
 * including inheritance (extends), mixins, and versioning information.
 */
export interface TemplateMetadata {
  /** Unique template identifier (kebab-case recommended) */
  name: string;

  /** Semantic version (e.g., "1.0.0", "2.1.3") */
  version: string;

  /** Human-readable description of template purpose */
  description: string;

  /** Template author or organization */
  author?: string;

  /** Searchable tags for template discovery */
  tags?: string[];

  /** True if this is a base template (for inheritance) */
  base?: boolean;

  /** Path to parent template for inheritance */
  extends?: string;

  /** Paths to prompt fragment files for composition */
  mixins?: string[];
}

// ============================================================================
// AGENT CONFIGURATION
// ============================================================================

/**
 * Agent behavior and tool configuration.
 *
 * Defines what the agent can do, including its system prompt, available tools,
 * tool configurations, and inference settings.
 */
export interface AgentConfig {
  /** Agent capability description (user-facing) */
  description: string;

  /** System prompt with optional {{ variable }} interpolation */
  prompt: string;

  /** Allowed tools (by name or with config) */
  tools: ToolReference[];

  /** Paths to tool configuration files */
  toolConfigs?: string[];

  /** Named tool bundles (e.g., 'file-operations', 'code-analysis') */
  toolBundles?: string[];

  /** Model and inference settings */
  settings?: AgentSettings;
}

/**
 * Reference to a tool, either by name or with configuration.
 *
 * Allows specifying tools as simple strings or as objects with
 * additional configuration and overrides.
 *
 * @example
 * ```typescript
 * // Simple reference
 * const tool1: ToolReference = 'Read';
 *
 * // With configuration
 * const tool2: ToolReference = {
 *   name: 'Write',
 *   config: './configs/safe-write.yml',
 *   overrides: {
 *     permissions: { requireConfirmation: true }
 *   }
 * };
 * ```
 */
export type ToolReference = string | ToolWithConfig;

/**
 * Tool reference with configuration options.
 *
 * Provides fine-grained control over tool behavior through
 * config files and inline overrides.
 */
export interface ToolWithConfig {
  /** Tool name (Read, Write, Edit, Bash, etc.) */
  name: string;

  /** Path to tool configuration file */
  config?: string;

  /** Inline configuration overrides */
  overrides?: Partial<ToolConfig>;
}

/**
 * Model and inference configuration settings.
 *
 * Controls the LLM behavior, permissions, and conversation parameters.
 */
export interface AgentSettings {
  /** Model size selection */
  model?: 'sonnet' | 'opus' | 'haiku';

  /** Sampling temperature (0.0 = deterministic, 1.0 = creative) */
  temperature?: number;

  /** Maximum conversation turns before termination */
  maxTurns?: number;

  /** Tool permission mode */
  permissionMode?: 'ask' | 'allow-all' | 'reject-all';

  /** Inherit settings from base template */
  inherit?: 'base';
}

// ============================================================================
// PROMPT FRAGMENTS
// ============================================================================

/**
 * Reusable prompt fragment for template composition.
 *
 * Fragments are standalone pieces of prompts that can be mixed into
 * templates for modular, reusable prompt engineering.
 *
 * @example
 * ```typescript
 * const fragment: PromptFragment = {
 *   fragment: {
 *     name: 'safety-checks',
 *     instructions: 'Always verify file exists before writing',
 *     safetyChecks: 'Check disk space before large writes'
 *   }
 * };
 * ```
 */
export interface PromptFragment {
  fragment: {
    /** Fragment identifier for reference */
    name: string;

    /** Main instructional content */
    instructions: string;

    /** Optional usage example */
    example?: string;

    /** Optional validation guidance */
    validation?: string;

    /** Optional safety guidelines */
    safetyChecks?: string;
  };
}

// ============================================================================
// TOOL CONFIGURATION
// ============================================================================

/**
 * Tool permission and safety configuration.
 *
 * Defines how a tool should behave, including permissions, validation,
 * error handling, and inheritance from parent configs.
 */
export interface ToolConfig {
  tool: {
    /** Tool name this configuration applies to */
    name: string;

    /** Default parameter settings for the tool */
    defaultSettings?: Record<string, any>;

    /** Access control rules */
    permissions?: ToolPermissions;

    /** Input validation rules */
    validation?: ToolValidation;

    /** Error handling behavior */
    errorHandling?: ToolErrorHandling;

    /** Parent configuration to extend */
    extends?: string;
  };
}

/**
 * Tool access control rules.
 *
 * Defines what paths, commands, and operations a tool is allowed
 * to perform, with rate limiting support.
 */
export interface ToolPermissions {
  /**
   * Require user confirmation before execution.
   * - true: Always require confirmation
   * - false: Never require confirmation
   * - string[]: Require confirmation for matching patterns
   */
  requireConfirmation?: boolean | string[];

  /** Glob patterns for allowed file/directory access */
  allowedPaths?: string[];

  /** Glob patterns for blocked file/directory access */
  deniedPaths?: string[];

  /** Allowed command patterns (for Bash tool) */
  allowedCommands?: string[];

  /** Blocked command patterns (for Bash tool) */
  deniedPatterns?: string[];

  /** Rate limiting configuration */
  rateLimits?: {
    /** Maximum requests per minute */
    requestsPerMinute?: number;

    /** Maximum requests per hour */
    requestsPerHour?: number;
  };
}

/**
 * Tool input validation rules.
 *
 * Defines pre-execution validation checks to ensure safe
 * and successful tool operations.
 */
export interface ToolValidation {
  /** Check available disk space before write operations */
  checkDiskSpace?: boolean;

  /** Minimum free space required (in bytes) */
  minimumFreeSpace?: number;

  /** Verify write permissions before file operations */
  verifyWritePermissions?: boolean;

  /** Maximum allowed file size (in bytes) */
  maxFileSize?: number;

  /** Allowed file extensions (e.g., ['.ts', '.js']) */
  allowedExtensions?: string[];
}

/**
 * Tool error handling behavior.
 *
 * Configures retry logic, fallback behavior, and conflict resolution
 * for tool operations.
 */
export interface ToolErrorHandling {
  /** Number of retry attempts on failure */
  retryAttempts?: number;

  /** Delay between retry attempts (milliseconds) */
  retryDelayMs?: number;

  /** Behavior when operation fails after retries */
  fallbackBehavior?: 'throw' | 'return-partial' | 'skip';

  /** Behavior when file/resource already exists */
  onExisting?: 'ask' | 'overwrite' | 'skip' | 'append';

  /** Error reporting behavior */
  onError?: 'throw' | 'log' | 'ignore';
}

// ============================================================================
// VALIDATION RULES
// ============================================================================

/**
 * Template input validation requirements.
 *
 * Defines which variables are required or optional, and their
 * expected types and constraints.
 *
 * @example
 * ```typescript
 * const rules: ValidationRules = {
 *   required: ['file', 'concern'],
 *   optional: ['outputFormat'],
 *   types: {
 *     file: { type: 'string' },
 *     concern: { type: 'enum', enum: ['security', 'performance'] },
 *     outputFormat: { type: 'string', default: 'markdown' }
 *   }
 * };
 * ```
 */
export interface ValidationRules {
  /** Required variable names (must be provided) */
  required?: string[];

  /** Optional variable names (defaults will be used if omitted) */
  optional?: string[];

  /** Type constraints for each variable */
  types?: Record<string, ValidationTypeRule>;
}

/**
 * Type constraint rule for a validation variable.
 *
 * Specifies the expected type and any additional constraints
 * like min/max values or enum options.
 */
export interface ValidationTypeRule {
  /** Expected type of the variable */
  type: 'string' | 'number' | 'boolean' | 'enum' | 'array';

  /** Allowed values for enum type */
  enum?: string[];

  /** Minimum value for number type */
  min?: number;

  /** Maximum value for number type */
  max?: number;

  /** Default value if not provided */
  default?: any;
}

// ============================================================================
// RUNTIME CONFIGURATION
// ============================================================================

/**
 * Runtime execution configuration.
 *
 * Controls the execution environment for the agent, including
 * working directory, timeouts, and logging.
 */
export interface RuntimeConfig {
  /** Working directory (may contain {{ cwd }} variable) */
  workingDirectory?: string;

  /** Operation timeout (milliseconds) */
  timeout?: number;

  /** Logging verbosity level */
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

// ============================================================================
// RESOLVED CONFIGURATION
// ============================================================================

/**
 * Final resolved agent configuration ready for execution.
 *
 * This is the output of the template resolution process, with all
 * inheritance applied, variables interpolated, and tools resolved.
 * Ready to be passed to LLMClient.query().
 *
 * @example
 * ```typescript
 * const resolved: ResolvedAgentConfig = {
 *   prompt: 'Review src/index.ts for security issues',
 *   tools: ['Read', 'Grep'],
 *   toolConfigs: {
 *     Read: { tool: { name: 'Read', permissions: {...} } }
 *   },
 *   settings: {
 *     model: 'claude-sonnet-4-5-20250929',
 *     temperature: 0.7,
 *     maxTurns: 5
 *   },
 *   runtime: {
 *     workingDirectory: '/project/src',
 *     timeout: 30000
 *   }
 * };
 * ```
 */
export interface ResolvedAgentConfig {
  /** Fully interpolated system prompt (no {{ variables }} remaining) */
  prompt: string;

  /** Tool names only (resolved from references) */
  tools: string[];

  /** Resolved tool configurations by tool name */
  toolConfigs: Record<string, ToolConfig>;

  /** Model and inference settings */
  settings: {
    /** Full model identifier */
    model: string;

    /** Sampling temperature */
    temperature?: number;

    /** Maximum conversation turns */
    maxTurns?: number;

    /** Permission mode */
    permissionMode?: string;
  };

  /** Runtime execution settings */
  runtime: {
    /** Resolved working directory */
    workingDirectory: string;

    /** Operation timeout */
    timeout?: number;
  };
}

// ============================================================================
// TEMPLATE CATALOG
// ============================================================================

/**
 * Registry catalog of available templates.
 *
 * Provides a searchable index of all templates in the registry,
 * with metadata for discovery and selection.
 */
export interface TemplateCatalog {
  /** All available template entries */
  templates: TemplateCatalogEntry[];

  /** Total number of templates */
  count: number;

  /** All unique tags across templates */
  tags: string[];
}

/**
 * Catalog entry for a single template.
 *
 * Summarizes a template's capabilities and requirements
 * for display in catalogs and selection interfaces.
 */
export interface TemplateCatalogEntry {
  /** Template name */
  name: string;

  /** Template version */
  version: string;

  /** Template description */
  description: string;

  /** Template tags */
  tags: string[];

  /** Available tools */
  tools: string[];

  /** Required input variables */
  requiredInputs: string[];

  /** Optional input variables */
  optionalInputs: string[];
}

// ============================================================================
// VALIDATION RESULTS
// ============================================================================

/**
 * Result of template validation.
 *
 * Indicates whether validation passed and provides detailed
 * error information if validation failed.
 */
export interface ValidationResult {
  /** True if validation passed, false otherwise */
  valid: boolean;

  /** Validation errors (empty if valid) */
  errors: ValidationError[];
}

/**
 * Single validation error.
 *
 * Describes a specific validation failure with field context,
 * error message, and severity level.
 */
export interface ValidationError {
  /** Field or path that failed validation */
  field: string;

  /** Human-readable error description */
  message: string;

  /** Error severity level */
  severity: 'error' | 'warning';
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard for AgentTemplate.
 *
 * Validates that an object conforms to the AgentTemplate interface
 * at runtime, checking all required fields and structure.
 *
 * @param obj - Object to check
 * @returns True if obj is a valid AgentTemplate
 *
 * @example
 * ```typescript
 * const data = loadYaml('template.yml');
 * if (isAgentTemplate(data)) {
 *   // TypeScript knows data is AgentTemplate
 *   console.log(data.metadata.name);
 * }
 * ```
 */
export function isAgentTemplate(obj: unknown): obj is AgentTemplate {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  const candidate = obj as Record<string, unknown>;

  // Check metadata
  if (typeof candidate.metadata !== 'object' || candidate.metadata === null) {
    return false;
  }
  const metadata = candidate.metadata as Record<string, unknown>;
  if (
    typeof metadata.name !== 'string' ||
    typeof metadata.version !== 'string' ||
    typeof metadata.description !== 'string'
  ) {
    return false;
  }

  // Check agent
  if (typeof candidate.agent !== 'object' || candidate.agent === null) {
    return false;
  }
  const agent = candidate.agent as Record<string, unknown>;
  if (
    typeof agent.description !== 'string' ||
    typeof agent.prompt !== 'string' ||
    !Array.isArray(agent.tools)
  ) {
    return false;
  }

  // Optional fields don't need validation if absent
  if (candidate.validation !== undefined && typeof candidate.validation !== 'object') {
    return false;
  }

  if (candidate.runtime !== undefined && typeof candidate.runtime !== 'object') {
    return false;
  }

  return true;
}

/**
 * Type guard for PromptFragment.
 *
 * Validates that an object conforms to the PromptFragment interface,
 * checking the nested fragment structure.
 *
 * @param obj - Object to check
 * @returns True if obj is a valid PromptFragment
 *
 * @example
 * ```typescript
 * const data = loadYaml('fragment.yml');
 * if (isPromptFragment(data)) {
 *   console.log(data.fragment.instructions);
 * }
 * ```
 */
export function isPromptFragment(obj: unknown): obj is PromptFragment {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  const candidate = obj as Record<string, unknown>;

  if (typeof candidate.fragment !== 'object' || candidate.fragment === null) {
    return false;
  }

  const fragment = candidate.fragment as Record<string, unknown>;
  if (
    typeof fragment.name !== 'string' ||
    typeof fragment.instructions !== 'string'
  ) {
    return false;
  }

  return true;
}

/**
 * Type guard for ToolConfig.
 *
 * Validates that an object conforms to the ToolConfig interface,
 * checking the nested tool structure.
 *
 * @param obj - Object to check
 * @returns True if obj is a valid ToolConfig
 *
 * @example
 * ```typescript
 * const data = loadYaml('tool-config.yml');
 * if (isToolConfig(data)) {
 *   console.log(data.tool.name);
 * }
 * ```
 */
export function isToolConfig(obj: unknown): obj is ToolConfig {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  const candidate = obj as Record<string, unknown>;

  if (typeof candidate.tool !== 'object' || candidate.tool === null) {
    return false;
  }

  const tool = candidate.tool as Record<string, unknown>;
  if (typeof tool.name !== 'string') {
    return false;
  }

  return true;
}

/**
 * Type guard for ToolReference.
 *
 * Validates that a value is either a string (tool name) or a
 * ToolWithConfig object.
 *
 * @param ref - Reference to check
 * @returns True if ref is a valid ToolReference
 *
 * @example
 * ```typescript
 * function processTools(tools: unknown[]) {
 *   const validTools = tools.filter(isToolReference);
 *   // validTools is now ToolReference[]
 * }
 * ```
 */
export function isToolReference(ref: unknown): ref is ToolReference {
  // Simple string reference
  if (typeof ref === 'string') {
    return true;
  }

  // ToolWithConfig object
  if (typeof ref === 'object' && ref !== null) {
    const candidate = ref as Record<string, unknown>;
    return typeof candidate.name === 'string';
  }

  return false;
}

// ============================================================================
// EXPORTS
// ============================================================================

// All types are already exported via individual export statements above.
// This section serves as documentation of the public API.

/**
 * @public
 * @exports AgentTemplate - Complete template definition
 * @exports TemplateMetadata - Template identification and composition
 * @exports AgentConfig - Agent behavior and tools
 * @exports ToolReference - Tool reference (string or object)
 * @exports ToolWithConfig - Tool with configuration
 * @exports AgentSettings - Model and inference settings
 * @exports PromptFragment - Reusable prompt piece
 * @exports ToolConfig - Tool permission and safety config
 * @exports ToolPermissions - Access control rules
 * @exports ToolValidation - Input validation rules
 * @exports ToolErrorHandling - Error handling behavior
 * @exports ValidationRules - Template input validation
 * @exports ValidationTypeRule - Type constraint rule
 * @exports RuntimeConfig - Runtime execution config
 * @exports ResolvedAgentConfig - Final resolved config for execution
 * @exports TemplateCatalog - Registry catalog
 * @exports TemplateCatalogEntry - Single catalog entry
 * @exports ValidationResult - Validation result
 * @exports ValidationError - Single validation error
 * @exports isAgentTemplate - Type guard for AgentTemplate
 * @exports isPromptFragment - Type guard for PromptFragment
 * @exports isToolConfig - Type guard for ToolConfig
 * @exports isToolReference - Type guard for ToolReference
 */
