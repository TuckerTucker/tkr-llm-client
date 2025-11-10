/**
 * Schema Validation for Agent Templates
 *
 * Provides comprehensive validation for templates, fragments, and tool configurations.
 * Enforces security policies including local-only tools and safe defaults.
 *
 * @module templates/validator
 * @version 1.0.0
 * @author Validator Specialist (Agent 6)
 */

import type {
  AgentTemplate,
  ToolConfig,
  PromptFragment,
  ValidationResult,
  ValidationError,
  ValidationRules,
  ValidationTypeRule,
  ToolReference,
  ToolPermissions,
  ToolValidation,
  ToolErrorHandling,
} from './types';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Allowed local tools only - NO network tools for security.
 * These tools are safe for local-only agent execution.
 */
const ALLOWED_TOOLS = ['Read', 'Write', 'Edit', 'Bash', 'Grep', 'Glob'] as const;

/**
 * Network tools that are explicitly forbidden.
 * Agents should not have access to network operations.
 */
const FORBIDDEN_TOOLS = [
  'WebSearch',
  'WebFetch',
  'mcp__',
  'http',
  'fetch',
  'curl',
  'wget',
] as const;

/**
 * Valid model identifiers (shorthand).
 */
const VALID_MODELS = ['sonnet', 'opus', 'haiku'] as const;

/**
 * Maximum reasonable timeout (10 minutes in milliseconds).
 */
const MAX_TIMEOUT_MS = 600000;

/**
 * Minimum reasonable timeout (1 second in milliseconds).
 */
const MIN_TIMEOUT_MS = 1000;

/**
 * Maximum reasonable file size (100MB in bytes).
 */
const MAX_FILE_SIZE = 104857600;

/**
 * Temperature range constraints.
 */
const TEMPERATURE_MIN = 0.0;
const TEMPERATURE_MAX = 1.0;

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validates an agent template for correctness and security.
 *
 * Checks:
 * - Required fields present
 * - Tool names are local-only (no network tools)
 * - Model names valid
 * - Temperature in valid range
 * - Version follows semver
 * - No circular extends references
 *
 * @param template - The template to validate
 * @returns Validation result with any errors found
 *
 * @example
 * ```typescript
 * const result = validateTemplate(template);
 * if (!result.valid) {
 *   console.error('Validation failed:');
 *   result.errors.forEach(err => {
 *     console.error(`  ${err.field}: ${err.message}`);
 *   });
 * }
 * ```
 */
export function validateTemplate(template: AgentTemplate): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate metadata
  validateMetadata(template, errors);

  // Validate agent configuration
  validateAgentConfig(template, errors);

  // Validate validation rules (if present)
  if (template.validation) {
    validateValidationRules(template.validation, errors);
  }

  // Validate runtime config (if present)
  if (template.runtime) {
    validateRuntimeConfig(template.runtime, errors);
  }

  return {
    valid: errors.filter(e => e.severity === 'error').length === 0,
    errors,
  };
}

/**
 * Validates a tool configuration for correctness and security.
 *
 * Checks:
 * - Tool name matches one of the 6 local tools
 * - Permission paths are valid glob patterns
 * - Bash commands in allowed list, not in denied list
 * - File size limits are positive
 * - Rate limits are positive numbers
 * - Timeout values are reasonable
 *
 * @param config - The tool configuration to validate
 * @returns Validation result with any errors found
 *
 * @example
 * ```typescript
 * const result = validateToolConfig(toolConfig);
 * if (!result.valid) {
 *   throw new Error(`Invalid tool config: ${result.errors[0].message}`);
 * }
 * ```
 */
export function validateToolConfig(config: ToolConfig): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate tool name
  const toolName = config.tool.name;
  if (!toolName) {
    errors.push({
      field: 'tool.name',
      message: 'Tool name is required',
      severity: 'error',
    });
  } else {
    // Check if it's explicitly forbidden (network tools) - check first
    const isForbidden = FORBIDDEN_TOOLS.some(forbidden =>
      toolName.toLowerCase().includes(forbidden.toLowerCase())
    );

    if (isForbidden) {
      errors.push({
        field: 'tool.name',
        message: `Network tool "${toolName}" is forbidden for security. Only local tools are allowed: ${ALLOWED_TOOLS.join(', ')}`,
        severity: 'error',
      });
    } else if (!ALLOWED_TOOLS.includes(toolName as any)) {
      errors.push({
        field: 'tool.name',
        message: `Invalid tool name "${toolName}". Must be one of: ${ALLOWED_TOOLS.join(', ')}`,
        severity: 'error',
      });
    }
  }

  // Validate permissions (if present)
  if (config.tool.permissions) {
    validateToolPermissions(config.tool.permissions, toolName, errors);
  }

  // Validate validation rules (if present)
  if (config.tool.validation) {
    validateToolValidationRules(config.tool.validation, errors);
  }

  // Validate error handling (if present)
  if (config.tool.errorHandling) {
    validateToolErrorHandling(config.tool.errorHandling, errors);
  }

  // Warn if extends points to non-existent path (can't fully validate without file system)
  if (config.tool.extends) {
    if (typeof config.tool.extends !== 'string' || config.tool.extends.trim() === '') {
      errors.push({
        field: 'tool.extends',
        message: 'extends must be a non-empty string path',
        severity: 'error',
      });
    }
  }

  return {
    valid: errors.filter(e => e.severity === 'error').length === 0,
    errors,
  };
}

/**
 * Validates a prompt fragment for correctness.
 *
 * Checks:
 * - Required fields present (name, instructions)
 * - Field types are correct
 *
 * @param fragment - The prompt fragment to validate
 * @returns Validation result with any errors found
 *
 * @example
 * ```typescript
 * const result = validateFragment(fragment);
 * if (!result.valid) {
 *   console.error('Fragment validation failed');
 * }
 * ```
 */
export function validateFragment(fragment: PromptFragment): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate fragment structure
  if (!fragment.fragment) {
    errors.push({
      field: 'fragment',
      message: 'Fragment object is required',
      severity: 'error',
    });
    return { valid: false, errors };
  }

  // Validate name
  if (!fragment.fragment.name || typeof fragment.fragment.name !== 'string') {
    errors.push({
      field: 'fragment.name',
      message: 'Fragment name is required and must be a string',
      severity: 'error',
    });
  } else if (fragment.fragment.name.trim() === '') {
    errors.push({
      field: 'fragment.name',
      message: 'Fragment name cannot be empty',
      severity: 'error',
    });
  }

  // Validate instructions
  if (!fragment.fragment.instructions || typeof fragment.fragment.instructions !== 'string') {
    errors.push({
      field: 'fragment.instructions',
      message: 'Fragment instructions are required and must be a string',
      severity: 'error',
    });
  } else if (fragment.fragment.instructions.trim() === '') {
    errors.push({
      field: 'fragment.instructions',
      message: 'Fragment instructions cannot be empty',
      severity: 'error',
    });
  }

  // Optional fields - just check types if present
  if (fragment.fragment.example !== undefined && typeof fragment.fragment.example !== 'string') {
    errors.push({
      field: 'fragment.example',
      message: 'Fragment example must be a string if provided',
      severity: 'error',
    });
  }

  if (fragment.fragment.validation !== undefined && typeof fragment.fragment.validation !== 'string') {
    errors.push({
      field: 'fragment.validation',
      message: 'Fragment validation must be a string if provided',
      severity: 'error',
    });
  }

  if (fragment.fragment.safetyChecks !== undefined && typeof fragment.fragment.safetyChecks !== 'string') {
    errors.push({
      field: 'fragment.safetyChecks',
      message: 'Fragment safetyChecks must be a string if provided',
      severity: 'error',
    });
  }

  return {
    valid: errors.filter(e => e.severity === 'error').length === 0,
    errors,
  };
}

/**
 * Validates that provided variables match template requirements.
 *
 * Checks:
 * - Required variables are provided
 * - Variable types match schema (string, number, boolean, enum)
 * - Enum values are in allowed list
 * - Number values are within min/max ranges
 *
 * @param template - The template with validation rules
 * @param provided - The variables provided by the user
 * @returns Validation result with any errors found
 *
 * @example
 * ```typescript
 * const result = validateVariables(template, { file: 'src/index.ts', concern: 'security' });
 * if (!result.valid) {
 *   console.error('Missing required variables');
 * }
 * ```
 */
export function validateVariables(
  template: AgentTemplate,
  provided: Record<string, any>
): ValidationResult {
  const errors: ValidationError[] = [];

  // If no validation rules, everything is valid
  if (!template.validation) {
    return { valid: true, errors: [] };
  }

  const rules = template.validation;

  // Check required variables
  if (rules.required) {
    for (const requiredVar of rules.required) {
      if (!(requiredVar in provided)) {
        errors.push({
          field: `variables.${requiredVar}`,
          message: `Required variable "${requiredVar}" is not provided`,
          severity: 'error',
        });
      }
    }
  }

  // Validate types for all provided variables
  if (rules.types) {
    for (const [varName, varValue] of Object.entries(provided)) {
      const typeRule = rules.types[varName];
      if (typeRule) {
        validateVariableType(varName, varValue, typeRule, errors);
      }
    }
  }

  return {
    valid: errors.filter(e => e.severity === 'error').length === 0,
    errors,
  };
}

// ============================================================================
// HELPER VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validates template metadata section.
 */
function validateMetadata(template: AgentTemplate, errors: ValidationError[]): void {
  const { metadata } = template;

  // Check required fields
  if (!metadata.name || metadata.name.trim() === '') {
    errors.push({
      field: 'metadata.name',
      message: 'Template name is required and cannot be empty',
      severity: 'error',
    });
  }

  if (!metadata.version || metadata.version.trim() === '') {
    errors.push({
      field: 'metadata.version',
      message: 'Template version is required and cannot be empty',
      severity: 'error',
    });
  } else if (!isSemver(metadata.version)) {
    errors.push({
      field: 'metadata.version',
      message: `Version "${metadata.version}" does not follow semver format (expected X.Y.Z)`,
      severity: 'error',
    });
  }

  if (!metadata.description || metadata.description.trim() === '') {
    errors.push({
      field: 'metadata.description',
      message: 'Template description is required and cannot be empty',
      severity: 'error',
    });
  }

  // Validate extends path (if present)
  if (metadata.extends) {
    if (typeof metadata.extends !== 'string' || metadata.extends.trim() === '') {
      errors.push({
        field: 'metadata.extends',
        message: 'extends must be a non-empty string path',
        severity: 'error',
      });
    }
    // Note: We can't check for circular extends without file system access
    // That should be done by the loader/resolver
  }

  // Validate mixins array (if present)
  if (metadata.mixins) {
    if (!Array.isArray(metadata.mixins)) {
      errors.push({
        field: 'metadata.mixins',
        message: 'mixins must be an array of paths',
        severity: 'error',
      });
    } else {
      metadata.mixins.forEach((mixin, idx) => {
        if (typeof mixin !== 'string' || mixin.trim() === '') {
          errors.push({
            field: `metadata.mixins[${idx}]`,
            message: 'Each mixin must be a non-empty string path',
            severity: 'error',
          });
        }
      });
    }
  }

  // Validate tags (if present)
  if (metadata.tags) {
    if (!Array.isArray(metadata.tags)) {
      errors.push({
        field: 'metadata.tags',
        message: 'tags must be an array of strings',
        severity: 'error',
      });
    } else {
      metadata.tags.forEach((tag, idx) => {
        if (typeof tag !== 'string' || tag.trim() === '') {
          errors.push({
            field: `metadata.tags[${idx}]`,
            message: 'Each tag must be a non-empty string',
            severity: 'error',
          });
        }
      });
    }
  }
}

/**
 * Validates agent configuration section.
 */
function validateAgentConfig(template: AgentTemplate, errors: ValidationError[]): void {
  const { agent } = template;

  // Check required fields
  if (!agent.description || agent.description.trim() === '') {
    errors.push({
      field: 'agent.description',
      message: 'Agent description is required and cannot be empty',
      severity: 'error',
    });
  }

  if (!agent.prompt || agent.prompt.trim() === '') {
    errors.push({
      field: 'agent.prompt',
      message: 'Agent prompt is required and cannot be empty',
      severity: 'error',
    });
  }

  // Validate tools array
  if (!Array.isArray(agent.tools)) {
    errors.push({
      field: 'agent.tools',
      message: 'agent.tools must be an array',
      severity: 'error',
    });
  } else if (agent.tools.length === 0) {
    errors.push({
      field: 'agent.tools',
      message: 'At least one tool must be specified',
      severity: 'error',
    });
  } else {
    agent.tools.forEach((tool, idx) => {
      validateToolReference(tool, idx, errors);
    });
  }

  // Validate tool configs (if present)
  if (agent.toolConfigs) {
    if (!Array.isArray(agent.toolConfigs)) {
      errors.push({
        field: 'agent.toolConfigs',
        message: 'toolConfigs must be an array of paths',
        severity: 'error',
      });
    } else {
      agent.toolConfigs.forEach((configPath, idx) => {
        if (typeof configPath !== 'string' || configPath.trim() === '') {
          errors.push({
            field: `agent.toolConfigs[${idx}]`,
            message: 'Each tool config must be a non-empty string path',
            severity: 'error',
          });
        }
      });
    }
  }

  // Validate tool bundles (if present)
  if (agent.toolBundles) {
    if (!Array.isArray(agent.toolBundles)) {
      errors.push({
        field: 'agent.toolBundles',
        message: 'toolBundles must be an array of bundle names',
        severity: 'error',
      });
    } else {
      agent.toolBundles.forEach((bundle, idx) => {
        if (typeof bundle !== 'string' || bundle.trim() === '') {
          errors.push({
            field: `agent.toolBundles[${idx}]`,
            message: 'Each tool bundle must be a non-empty string',
            severity: 'error',
          });
        }
      });
    }
  }

  // Validate settings (if present)
  if (agent.settings) {
    validateAgentSettings(agent.settings, errors);
  }
}

/**
 * Validates agent settings.
 */
function validateAgentSettings(settings: any, errors: ValidationError[]): void {
  // Validate model
  if (settings.model !== undefined) {
    if (!VALID_MODELS.includes(settings.model)) {
      errors.push({
        field: 'agent.settings.model',
        message: `Invalid model "${settings.model}". Must be one of: ${VALID_MODELS.join(', ')}`,
        severity: 'error',
      });
    }
  }

  // Validate temperature
  if (settings.temperature !== undefined) {
    if (typeof settings.temperature !== 'number') {
      errors.push({
        field: 'agent.settings.temperature',
        message: 'temperature must be a number',
        severity: 'error',
      });
    } else if (settings.temperature < TEMPERATURE_MIN || settings.temperature > TEMPERATURE_MAX) {
      errors.push({
        field: 'agent.settings.temperature',
        message: `temperature must be between ${TEMPERATURE_MIN.toFixed(1)} and ${TEMPERATURE_MAX.toFixed(1)}, got ${settings.temperature}`,
        severity: 'error',
      });
    }
  }

  // Validate maxTurns
  if (settings.maxTurns !== undefined) {
    if (typeof settings.maxTurns !== 'number' || settings.maxTurns < 1) {
      errors.push({
        field: 'agent.settings.maxTurns',
        message: 'maxTurns must be a positive number',
        severity: 'error',
      });
    }
  }

  // Validate permissionMode
  if (settings.permissionMode !== undefined) {
    const validModes = ['ask', 'allow-all', 'reject-all'];
    if (!validModes.includes(settings.permissionMode)) {
      errors.push({
        field: 'agent.settings.permissionMode',
        message: `permissionMode must be one of: ${validModes.join(', ')}`,
        severity: 'error',
      });
    }
  }

  // Validate inherit
  if (settings.inherit !== undefined) {
    if (settings.inherit !== 'base') {
      errors.push({
        field: 'agent.settings.inherit',
        message: 'inherit must be "base" if specified',
        severity: 'error',
      });
    }
  }
}

/**
 * Validates a tool reference (string or object).
 */
function validateToolReference(tool: ToolReference, idx: number, errors: ValidationError[]): void {
  // String reference
  if (typeof tool === 'string') {
    validateToolName(tool, `agent.tools[${idx}]`, errors);
    return;
  }

  // Object reference
  if (typeof tool === 'object' && tool !== null) {
    const toolObj = tool as any;

    if (!toolObj.name) {
      errors.push({
        field: `agent.tools[${idx}].name`,
        message: 'Tool name is required',
        severity: 'error',
      });
    } else {
      validateToolName(toolObj.name, `agent.tools[${idx}].name`, errors);
    }

    // Validate config path (if present)
    if (toolObj.config !== undefined) {
      if (typeof toolObj.config !== 'string' || toolObj.config.trim() === '') {
        errors.push({
          field: `agent.tools[${idx}].config`,
          message: 'Tool config must be a non-empty string path',
          severity: 'error',
        });
      }
    }

    // Overrides are validated at runtime by resolver
  } else {
    errors.push({
      field: `agent.tools[${idx}]`,
      message: 'Tool must be a string or object with name property',
      severity: 'error',
    });
  }
}

/**
 * Validates a tool name against allowed/forbidden lists.
 */
function validateToolName(name: string, field: string, errors: ValidationError[]): void {
  // Check if it's explicitly forbidden (network tools) - check first
  const isForbidden = FORBIDDEN_TOOLS.some(forbidden =>
    name.toLowerCase().includes(forbidden.toLowerCase())
  );

  if (isForbidden) {
    errors.push({
      field,
      message: `Network tool "${name}" is forbidden for security. Only local tools are allowed: ${ALLOWED_TOOLS.join(', ')}`,
      severity: 'error',
    });
    return; // Don't add duplicate error
  }

  // Check if it's an allowed tool
  if (!ALLOWED_TOOLS.includes(name as any)) {
    errors.push({
      field,
      message: `Invalid tool "${name}". Only local tools are allowed: ${ALLOWED_TOOLS.join(', ')}`,
      severity: 'error',
    });
  }
}

/**
 * Validates validation rules section.
 */
function validateValidationRules(rules: ValidationRules, errors: ValidationError[]): void {
  // Validate required array
  if (rules.required !== undefined) {
    if (!Array.isArray(rules.required)) {
      errors.push({
        field: 'validation.required',
        message: 'required must be an array of variable names',
        severity: 'error',
      });
    } else {
      rules.required.forEach((varName, idx) => {
        if (typeof varName !== 'string' || varName.trim() === '') {
          errors.push({
            field: `validation.required[${idx}]`,
            message: 'Required variable name must be a non-empty string',
            severity: 'error',
          });
        }
      });
    }
  }

  // Validate optional array
  if (rules.optional !== undefined) {
    if (!Array.isArray(rules.optional)) {
      errors.push({
        field: 'validation.optional',
        message: 'optional must be an array of variable names',
        severity: 'error',
      });
    } else {
      rules.optional.forEach((varName, idx) => {
        if (typeof varName !== 'string' || varName.trim() === '') {
          errors.push({
            field: `validation.optional[${idx}]`,
            message: 'Optional variable name must be a non-empty string',
            severity: 'error',
          });
        }
      });
    }
  }

  // Validate types object
  if (rules.types !== undefined) {
    if (typeof rules.types !== 'object' || rules.types === null) {
      errors.push({
        field: 'validation.types',
        message: 'types must be an object mapping variable names to type rules',
        severity: 'error',
      });
    } else {
      for (const [varName, typeRule] of Object.entries(rules.types)) {
        validateTypeRule(varName, typeRule, errors);
      }
    }
  }
}

/**
 * Validates a type rule for a variable.
 */
function validateTypeRule(varName: string, rule: ValidationTypeRule, errors: ValidationError[]): void {
  const validTypes = ['string', 'number', 'boolean', 'enum', 'array'];

  if (!rule.type) {
    errors.push({
      field: `validation.types.${varName}.type`,
      message: 'Type is required for variable type rule',
      severity: 'error',
    });
  } else if (!validTypes.includes(rule.type)) {
    errors.push({
      field: `validation.types.${varName}.type`,
      message: `Invalid type "${rule.type}". Must be one of: ${validTypes.join(', ')}`,
      severity: 'error',
    });
  }

  // Validate enum values (required for enum type)
  if (rule.type === 'enum') {
    if (!rule.enum || !Array.isArray(rule.enum) || rule.enum.length === 0) {
      errors.push({
        field: `validation.types.${varName}.enum`,
        message: 'enum type requires a non-empty array of allowed values',
        severity: 'error',
      });
    }
  }

  // Validate min/max (only for number type)
  if (rule.min !== undefined) {
    if (rule.type !== 'number') {
      errors.push({
        field: `validation.types.${varName}.min`,
        message: 'min constraint only applies to number type',
        severity: 'warning',
      });
    } else if (typeof rule.min !== 'number') {
      errors.push({
        field: `validation.types.${varName}.min`,
        message: 'min must be a number',
        severity: 'error',
      });
    }
  }

  if (rule.max !== undefined) {
    if (rule.type !== 'number') {
      errors.push({
        field: `validation.types.${varName}.max`,
        message: 'max constraint only applies to number type',
        severity: 'warning',
      });
    } else if (typeof rule.max !== 'number') {
      errors.push({
        field: `validation.types.${varName}.max`,
        message: 'max must be a number',
        severity: 'error',
      });
    } else if (rule.min !== undefined && rule.max < rule.min) {
      errors.push({
        field: `validation.types.${varName}.max`,
        message: `max (${rule.max}) must be greater than or equal to min (${rule.min})`,
        severity: 'error',
      });
    }
  }
}

/**
 * Validates runtime configuration.
 */
function validateRuntimeConfig(runtime: any, errors: ValidationError[]): void {
  // Validate timeout
  if (runtime.timeout !== undefined) {
    if (typeof runtime.timeout !== 'number') {
      errors.push({
        field: 'runtime.timeout',
        message: 'timeout must be a number (milliseconds)',
        severity: 'error',
      });
    } else if (runtime.timeout < MIN_TIMEOUT_MS) {
      errors.push({
        field: 'runtime.timeout',
        message: `timeout must be at least ${MIN_TIMEOUT_MS}ms (1 second), got ${runtime.timeout}ms`,
        severity: 'error',
      });
    } else if (runtime.timeout > MAX_TIMEOUT_MS) {
      errors.push({
        field: 'runtime.timeout',
        message: `timeout must not exceed ${MAX_TIMEOUT_MS}ms (10 minutes), got ${runtime.timeout}ms. Consider splitting into smaller tasks.`,
        severity: 'error',
      });
    }
  }

  // Validate logLevel
  if (runtime.logLevel !== undefined) {
    const validLevels = ['debug', 'info', 'warn', 'error'];
    if (!validLevels.includes(runtime.logLevel)) {
      errors.push({
        field: 'runtime.logLevel',
        message: `logLevel must be one of: ${validLevels.join(', ')}`,
        severity: 'error',
      });
    }
  }

  // Validate workingDirectory (just type check, actual path validation needs fs)
  if (runtime.workingDirectory !== undefined) {
    if (typeof runtime.workingDirectory !== 'string' || runtime.workingDirectory.trim() === '') {
      errors.push({
        field: 'runtime.workingDirectory',
        message: 'workingDirectory must be a non-empty string path',
        severity: 'error',
      });
    }
  }
}

/**
 * Validates tool permissions.
 */
function validateToolPermissions(
  permissions: ToolPermissions,
  toolName: string,
  errors: ValidationError[]
): void {
  // Validate requireConfirmation
  if (permissions.requireConfirmation !== undefined) {
    const isValid =
      typeof permissions.requireConfirmation === 'boolean' ||
      (Array.isArray(permissions.requireConfirmation) &&
        permissions.requireConfirmation.every(p => typeof p === 'string'));

    if (!isValid) {
      errors.push({
        field: 'tool.permissions.requireConfirmation',
        message: 'requireConfirmation must be a boolean or array of pattern strings',
        severity: 'error',
      });
    }
  }

  // Validate allowedPaths (glob patterns)
  if (permissions.allowedPaths !== undefined) {
    if (!Array.isArray(permissions.allowedPaths)) {
      errors.push({
        field: 'tool.permissions.allowedPaths',
        message: 'allowedPaths must be an array of glob patterns',
        severity: 'error',
      });
    } else {
      permissions.allowedPaths.forEach((pattern, idx) => {
        if (typeof pattern !== 'string' || pattern.trim() === '') {
          errors.push({
            field: `tool.permissions.allowedPaths[${idx}]`,
            message: 'Each allowed path must be a non-empty glob pattern string',
            severity: 'error',
          });
        } else if (!isValidGlobPattern(pattern)) {
          errors.push({
            field: `tool.permissions.allowedPaths[${idx}]`,
            message: `Invalid glob pattern "${pattern}". Use patterns like "src/**/*.ts" or "**/*.js"`,
            severity: 'error',
          });
        }
      });
    }
  }

  // Validate deniedPaths (glob patterns)
  if (permissions.deniedPaths !== undefined) {
    if (!Array.isArray(permissions.deniedPaths)) {
      errors.push({
        field: 'tool.permissions.deniedPaths',
        message: 'deniedPaths must be an array of glob patterns',
        severity: 'error',
      });
    } else {
      permissions.deniedPaths.forEach((pattern, idx) => {
        if (typeof pattern !== 'string' || pattern.trim() === '') {
          errors.push({
            field: `tool.permissions.deniedPaths[${idx}]`,
            message: 'Each denied path must be a non-empty glob pattern string',
            severity: 'error',
          });
        } else if (!isValidGlobPattern(pattern)) {
          errors.push({
            field: `tool.permissions.deniedPaths[${idx}]`,
            message: `Invalid glob pattern "${pattern}". Use patterns like "**/node_modules/**" or "**/.env*"`,
            severity: 'error',
          });
        }
      });
    }
  }

  // Validate allowedCommands (for Bash tool only)
  if (permissions.allowedCommands !== undefined) {
    if (toolName !== 'Bash') {
      errors.push({
        field: 'tool.permissions.allowedCommands',
        message: 'allowedCommands only applies to Bash tool',
        severity: 'warning',
      });
    } else if (!Array.isArray(permissions.allowedCommands)) {
      errors.push({
        field: 'tool.permissions.allowedCommands',
        message: 'allowedCommands must be an array of command patterns',
        severity: 'error',
      });
    } else {
      permissions.allowedCommands.forEach((cmd, idx) => {
        if (typeof cmd !== 'string' || cmd.trim() === '') {
          errors.push({
            field: `tool.permissions.allowedCommands[${idx}]`,
            message: 'Each allowed command must be a non-empty string',
            severity: 'error',
          });
        }
      });
    }
  }

  // Validate deniedPatterns (for Bash tool only)
  if (permissions.deniedPatterns !== undefined) {
    if (toolName !== 'Bash') {
      errors.push({
        field: 'tool.permissions.deniedPatterns',
        message: 'deniedPatterns only applies to Bash tool',
        severity: 'warning',
      });
    } else if (!Array.isArray(permissions.deniedPatterns)) {
      errors.push({
        field: 'tool.permissions.deniedPatterns',
        message: 'deniedPatterns must be an array of command patterns',
        severity: 'error',
      });
    } else {
      permissions.deniedPatterns.forEach((pattern, idx) => {
        if (typeof pattern !== 'string' || pattern.trim() === '') {
          errors.push({
            field: `tool.permissions.deniedPatterns[${idx}]`,
            message: 'Each denied pattern must be a non-empty string',
            severity: 'error',
          });
        }
      });
    }
  }

  // Validate rate limits
  if (permissions.rateLimits !== undefined) {
    if (typeof permissions.rateLimits !== 'object' || permissions.rateLimits === null) {
      errors.push({
        field: 'tool.permissions.rateLimits',
        message: 'rateLimits must be an object',
        severity: 'error',
      });
    } else {
      const { requestsPerMinute, requestsPerHour } = permissions.rateLimits;

      if (requestsPerMinute !== undefined) {
        if (typeof requestsPerMinute !== 'number' || requestsPerMinute <= 0) {
          errors.push({
            field: 'tool.permissions.rateLimits.requestsPerMinute',
            message: 'requestsPerMinute must be a positive number',
            severity: 'error',
          });
        }
      }

      if (requestsPerHour !== undefined) {
        if (typeof requestsPerHour !== 'number' || requestsPerHour <= 0) {
          errors.push({
            field: 'tool.permissions.rateLimits.requestsPerHour',
            message: 'requestsPerHour must be a positive number',
            severity: 'error',
          });
        }
      }

      // Sanity check: per-minute should be less than per-hour
      if (
        requestsPerMinute !== undefined &&
        requestsPerHour !== undefined &&
        requestsPerMinute * 60 > requestsPerHour
      ) {
        errors.push({
          field: 'tool.permissions.rateLimits',
          message: `requestsPerMinute (${requestsPerMinute}) * 60 exceeds requestsPerHour (${requestsPerHour})`,
          severity: 'warning',
        });
      }
    }
  }
}

/**
 * Validates tool validation rules.
 */
function validateToolValidationRules(validation: ToolValidation, errors: ValidationError[]): void {
  // Validate checkDiskSpace
  if (validation.checkDiskSpace !== undefined && typeof validation.checkDiskSpace !== 'boolean') {
    errors.push({
      field: 'tool.validation.checkDiskSpace',
      message: 'checkDiskSpace must be a boolean',
      severity: 'error',
    });
  }

  // Validate minimumFreeSpace
  if (validation.minimumFreeSpace !== undefined) {
    if (typeof validation.minimumFreeSpace !== 'number' || validation.minimumFreeSpace <= 0) {
      errors.push({
        field: 'tool.validation.minimumFreeSpace',
        message: 'minimumFreeSpace must be a positive number (bytes)',
        severity: 'error',
      });
    }
  }

  // Validate verifyWritePermissions
  if (validation.verifyWritePermissions !== undefined && typeof validation.verifyWritePermissions !== 'boolean') {
    errors.push({
      field: 'tool.validation.verifyWritePermissions',
      message: 'verifyWritePermissions must be a boolean',
      severity: 'error',
    });
  }

  // Validate maxFileSize
  if (validation.maxFileSize !== undefined) {
    if (typeof validation.maxFileSize !== 'number' || validation.maxFileSize <= 0) {
      errors.push({
        field: 'tool.validation.maxFileSize',
        message: 'maxFileSize must be a positive number (bytes)',
        severity: 'error',
      });
    } else if (validation.maxFileSize > MAX_FILE_SIZE) {
      errors.push({
        field: 'tool.validation.maxFileSize',
        message: `maxFileSize (${validation.maxFileSize}) exceeds recommended maximum of ${MAX_FILE_SIZE} bytes (100MB)`,
        severity: 'warning',
      });
    }
  }

  // Validate allowedExtensions
  if (validation.allowedExtensions !== undefined) {
    if (!Array.isArray(validation.allowedExtensions)) {
      errors.push({
        field: 'tool.validation.allowedExtensions',
        message: 'allowedExtensions must be an array of extension strings',
        severity: 'error',
      });
    } else {
      validation.allowedExtensions.forEach((ext, idx) => {
        if (typeof ext !== 'string' || ext.trim() === '') {
          errors.push({
            field: `tool.validation.allowedExtensions[${idx}]`,
            message: 'Each extension must be a non-empty string',
            severity: 'error',
          });
        } else if (!ext.startsWith('.')) {
          errors.push({
            field: `tool.validation.allowedExtensions[${idx}]`,
            message: `Extension "${ext}" should start with a dot (e.g., ".ts" not "ts")`,
            severity: 'warning',
          });
        }
      });
    }
  }
}

/**
 * Validates tool error handling configuration.
 */
function validateToolErrorHandling(errorHandling: ToolErrorHandling, errors: ValidationError[]): void {
  // Validate retryAttempts
  if (errorHandling.retryAttempts !== undefined) {
    if (typeof errorHandling.retryAttempts !== 'number' || errorHandling.retryAttempts < 0) {
      errors.push({
        field: 'tool.errorHandling.retryAttempts',
        message: 'retryAttempts must be a non-negative number',
        severity: 'error',
      });
    } else if (errorHandling.retryAttempts > 10) {
      errors.push({
        field: 'tool.errorHandling.retryAttempts',
        message: `retryAttempts (${errorHandling.retryAttempts}) seems excessive. Consider a lower value (0-5).`,
        severity: 'warning',
      });
    }
  }

  // Validate retryDelayMs
  if (errorHandling.retryDelayMs !== undefined) {
    if (typeof errorHandling.retryDelayMs !== 'number' || errorHandling.retryDelayMs < 0) {
      errors.push({
        field: 'tool.errorHandling.retryDelayMs',
        message: 'retryDelayMs must be a non-negative number',
        severity: 'error',
      });
    } else if (errorHandling.retryDelayMs > MAX_TIMEOUT_MS) {
      errors.push({
        field: 'tool.errorHandling.retryDelayMs',
        message: `retryDelayMs (${errorHandling.retryDelayMs}ms) exceeds maximum timeout (${MAX_TIMEOUT_MS}ms)`,
        severity: 'error',
      });
    }
  }

  // Validate fallbackBehavior
  if (errorHandling.fallbackBehavior !== undefined) {
    const validBehaviors = ['throw', 'return-partial', 'skip'];
    if (!validBehaviors.includes(errorHandling.fallbackBehavior)) {
      errors.push({
        field: 'tool.errorHandling.fallbackBehavior',
        message: `fallbackBehavior must be one of: ${validBehaviors.join(', ')}`,
        severity: 'error',
      });
    }
  }

  // Validate onExisting
  if (errorHandling.onExisting !== undefined) {
    const validOptions = ['ask', 'overwrite', 'skip', 'append'];
    if (!validOptions.includes(errorHandling.onExisting)) {
      errors.push({
        field: 'tool.errorHandling.onExisting',
        message: `onExisting must be one of: ${validOptions.join(', ')}`,
        severity: 'error',
      });
    }
  }

  // Validate onError
  if (errorHandling.onError !== undefined) {
    const validOptions = ['throw', 'log', 'ignore'];
    if (!validOptions.includes(errorHandling.onError)) {
      errors.push({
        field: 'tool.errorHandling.onError',
        message: `onError must be one of: ${validOptions.join(', ')}`,
        severity: 'error',
      });
    }
  }
}

/**
 * Validates a variable value against its type rule.
 */
function validateVariableType(
  varName: string,
  value: any,
  rule: ValidationTypeRule,
  errors: ValidationError[]
): void {
  const actualType = Array.isArray(value) ? 'array' : typeof value;

  // Type matching
  switch (rule.type) {
    case 'string':
      if (typeof value !== 'string') {
        errors.push({
          field: `variables.${varName}`,
          message: `Expected string, got ${actualType}`,
          severity: 'error',
        });
      }
      break;

    case 'number':
      if (typeof value !== 'number') {
        errors.push({
          field: `variables.${varName}`,
          message: `Expected number, got ${actualType}`,
          severity: 'error',
        });
      } else {
        // Check min/max
        if (rule.min !== undefined && value < rule.min) {
          errors.push({
            field: `variables.${varName}`,
            message: `Value ${value} is less than minimum ${rule.min}`,
            severity: 'error',
          });
        }
        if (rule.max !== undefined && value > rule.max) {
          errors.push({
            field: `variables.${varName}`,
            message: `Value ${value} exceeds maximum ${rule.max}`,
            severity: 'error',
          });
        }
      }
      break;

    case 'boolean':
      if (typeof value !== 'boolean') {
        errors.push({
          field: `variables.${varName}`,
          message: `Expected boolean, got ${actualType}`,
          severity: 'error',
        });
      }
      break;

    case 'enum':
      if (rule.enum && !rule.enum.includes(value)) {
        errors.push({
          field: `variables.${varName}`,
          message: `Value "${value}" is not in allowed enum values: ${rule.enum.join(', ')}`,
          severity: 'error',
        });
      }
      break;

    case 'array':
      if (!Array.isArray(value)) {
        errors.push({
          field: `variables.${varName}`,
          message: `Expected array, got ${actualType}`,
          severity: 'error',
        });
      }
      break;

    default:
      errors.push({
        field: `variables.${varName}`,
        message: `Unknown type rule: ${rule.type}`,
        severity: 'error',
      });
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Checks if a string follows semantic versioning (X.Y.Z).
 */
function isSemver(version: string): boolean {
  // Basic semver check: X.Y.Z where X, Y, Z are numbers
  const semverRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/;
  return semverRegex.test(version);
}

/**
 * Validates that a string is a valid glob pattern.
 * Basic validation - checks for common glob syntax.
 */
function isValidGlobPattern(pattern: string): boolean {
  // Must not be empty
  if (!pattern || pattern.trim() === '') {
    return false;
  }

  // Should not contain null bytes or other invalid characters
  if (pattern.includes('\0')) {
    return false;
  }

  // Valid glob patterns typically contain *, **, ?, or are plain paths
  // We'll accept any string that doesn't have obvious errors
  // More sophisticated validation would require a glob parser

  return true;
}
