/**
 * YAML Template Loader
 *
 * Loads agent templates, prompt fragments, and tool configurations from YAML files.
 * Provides robust error handling with helpful context for file loading failures.
 *
 * @module templates/loader
 * @version 1.0.0
 * @author YAML Loader Engineer (Agent 4)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import {
  AgentTemplate,
  PromptFragment,
  ToolConfig,
  isAgentTemplate,
  isPromptFragment,
  isToolConfig,
} from './types';

// ============================================================================
// ERROR CLASSES
// ============================================================================

/**
 * Base error class for template loading failures.
 */
export class TemplateLoaderError extends Error {
  constructor(
    message: string,
    public readonly filePath: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'TemplateLoaderError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error thrown when a template file is not found.
 */
export class FileNotFoundError extends TemplateLoaderError {
  constructor(filePath: string) {
    super(`Template file not found: ${filePath}`, filePath);
    this.name = 'FileNotFoundError';
  }
}

/**
 * Error thrown when a file cannot be read due to permissions.
 */
export class FileAccessError extends TemplateLoaderError {
  constructor(filePath: string, cause: Error) {
    super(`Cannot access file (permission denied): ${filePath}`, filePath, cause);
    this.name = 'FileAccessError';
  }
}

/**
 * Error thrown when YAML parsing fails.
 */
export class YAMLParseError extends TemplateLoaderError {
  constructor(filePath: string, cause: Error) {
    const yamlError = cause as yaml.YAMLException;
    const lineInfo = yamlError.mark
      ? ` at line ${yamlError.mark.line + 1}, column ${yamlError.mark.column + 1}`
      : '';
    super(
      `Invalid YAML syntax in ${filePath}${lineInfo}: ${yamlError.message}`,
      filePath,
      cause
    );
    this.name = 'YAMLParseError';
  }
}

/**
 * Error thrown when loaded YAML doesn't match expected schema.
 */
export class SchemaValidationError extends TemplateLoaderError {
  constructor(filePath: string, expectedType: string, reason: string) {
    super(
      `Schema validation failed for ${filePath}: Expected ${expectedType}, but ${reason}`,
      filePath
    );
    this.name = 'SchemaValidationError';
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Resolves a file path to an absolute path.
 *
 * @param filePath - The file path (relative or absolute)
 * @returns Absolute file path
 */
function resolveFilePath(filePath: string): string {
  if (path.isAbsolute(filePath)) {
    return filePath;
  }
  return path.resolve(process.cwd(), filePath);
}

/**
 * Reads and parses a YAML file.
 *
 * @param filePath - Path to YAML file
 * @returns Parsed YAML content (single document)
 * @throws {FileNotFoundError} If file doesn't exist
 * @throws {FileAccessError} If file cannot be read
 * @throws {YAMLParseError} If YAML parsing fails
 */
function readYAMLFile(filePath: string): unknown {
  const absolutePath = resolveFilePath(filePath);

  // Check file exists
  if (!fs.existsSync(absolutePath)) {
    throw new FileNotFoundError(absolutePath);
  }

  // Read file
  let content: string;
  try {
    content = fs.readFileSync(absolutePath, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EACCES') {
      throw new FileAccessError(absolutePath, error as Error);
    }
    throw new TemplateLoaderError(
      `Failed to read file: ${absolutePath}`,
      absolutePath,
      error as Error
    );
  }

  // Parse YAML
  try {
    return yaml.load(content, { filename: absolutePath });
  } catch (error) {
    throw new YAMLParseError(absolutePath, error as Error);
  }
}

/**
 * Reads and parses a multi-document YAML file.
 *
 * @param filePath - Path to YAML file
 * @returns Array of parsed YAML documents
 * @throws {FileNotFoundError} If file doesn't exist
 * @throws {FileAccessError} If file cannot be read
 * @throws {YAMLParseError} If YAML parsing fails
 */
function readMultiDocumentYAML(filePath: string): unknown[] {
  const absolutePath = resolveFilePath(filePath);

  // Check file exists
  if (!fs.existsSync(absolutePath)) {
    throw new FileNotFoundError(absolutePath);
  }

  // Read file
  let content: string;
  try {
    content = fs.readFileSync(absolutePath, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EACCES') {
      throw new FileAccessError(absolutePath, error as Error);
    }
    throw new TemplateLoaderError(
      `Failed to read file: ${absolutePath}`,
      absolutePath,
      error as Error
    );
  }

  // Parse YAML (all documents)
  try {
    return yaml.loadAll(content, undefined, { filename: absolutePath });
  } catch (error) {
    throw new YAMLParseError(absolutePath, error as Error);
  }
}

// ============================================================================
// PUBLIC LOADER FUNCTIONS
// ============================================================================

/**
 * Loads an agent template from a YAML file.
 *
 * Supports both relative and absolute paths. Validates that the loaded
 * content conforms to the AgentTemplate schema.
 *
 * @param filePath - Path to template YAML file (relative or absolute)
 * @returns Loaded and validated AgentTemplate
 * @throws {FileNotFoundError} If template file doesn't exist
 * @throws {FileAccessError} If file cannot be read due to permissions
 * @throws {YAMLParseError} If YAML parsing fails
 * @throws {SchemaValidationError} If content doesn't match AgentTemplate schema
 *
 * @example
 * ```typescript
 * // Load with absolute path
 * const template = await loadTemplate('/path/to/code-reviewer-agent.yaml');
 *
 * // Load with relative path (resolved from cwd)
 * const template = await loadTemplate('./agent-templates/code-reviewer.yaml');
 * ```
 */
export async function loadTemplate(filePath: string): Promise<AgentTemplate> {
  const absolutePath = resolveFilePath(filePath);
  const content = readYAMLFile(absolutePath);

  if (!isAgentTemplate(content)) {
    // Provide helpful error message about what's wrong
    if (typeof content !== 'object' || content === null) {
      throw new SchemaValidationError(
        absolutePath,
        'AgentTemplate',
        'file content is not an object'
      );
    }

    const obj = content as Record<string, unknown>;

    if (!obj.metadata) {
      throw new SchemaValidationError(
        absolutePath,
        'AgentTemplate',
        'missing required field "metadata"'
      );
    }

    if (!obj.agent) {
      throw new SchemaValidationError(
        absolutePath,
        'AgentTemplate',
        'missing required field "agent"'
      );
    }

    // Generic validation failure
    throw new SchemaValidationError(
      absolutePath,
      'AgentTemplate',
      'schema validation failed (check required fields: metadata.name, metadata.version, metadata.description, agent.description, agent.prompt, agent.tools)'
    );
  }

  return content;
}

/**
 * Loads a prompt fragment from a YAML file.
 *
 * Supports both relative and absolute paths. Validates that the loaded
 * content conforms to the PromptFragment schema.
 *
 * @param filePath - Path to fragment YAML file (relative or absolute)
 * @returns Loaded and validated PromptFragment
 * @throws {FileNotFoundError} If fragment file doesn't exist
 * @throws {FileAccessError} If file cannot be read due to permissions
 * @throws {YAMLParseError} If YAML parsing fails
 * @throws {SchemaValidationError} If content doesn't match PromptFragment schema
 *
 * @example
 * ```typescript
 * const fragment = await loadFragment('./prompt-fragments/file-safety.yaml');
 * console.log(fragment.fragment.instructions);
 * ```
 */
export async function loadFragment(filePath: string): Promise<PromptFragment> {
  const absolutePath = resolveFilePath(filePath);
  const content = readYAMLFile(absolutePath);

  if (!isPromptFragment(content)) {
    // Provide helpful error message
    if (typeof content !== 'object' || content === null) {
      throw new SchemaValidationError(
        absolutePath,
        'PromptFragment',
        'file content is not an object'
      );
    }

    const obj = content as Record<string, unknown>;

    if (!obj.fragment) {
      throw new SchemaValidationError(
        absolutePath,
        'PromptFragment',
        'missing required field "fragment"'
      );
    }

    // Generic validation failure
    throw new SchemaValidationError(
      absolutePath,
      'PromptFragment',
      'schema validation failed (check required fields: fragment.name, fragment.instructions)'
    );
  }

  return content;
}

/**
 * Loads a tool configuration from a YAML file.
 *
 * Supports both single-document and multi-document YAML files.
 * - Single document: Returns the tool config directly
 * - Multi-document: Returns the first valid ToolConfig found
 *
 * @param filePath - Path to tool config YAML file (relative or absolute)
 * @returns Loaded and validated ToolConfig
 * @throws {FileNotFoundError} If config file doesn't exist
 * @throws {FileAccessError} If file cannot be read due to permissions
 * @throws {YAMLParseError} If YAML parsing fails
 * @throws {SchemaValidationError} If content doesn't match ToolConfig schema
 *
 * @example
 * ```typescript
 * // Single document
 * const config = await loadToolConfig('./tool-configs/write-safe-config.yaml');
 *
 * // Multi-document (returns first valid config)
 * const config = await loadToolConfig('./tool-configs/multi-tool-config.yaml');
 * ```
 */
export async function loadToolConfig(filePath: string): Promise<ToolConfig> {
  const absolutePath = resolveFilePath(filePath);

  // Try single document first
  try {
    const content = readYAMLFile(absolutePath);

    if (isToolConfig(content)) {
      return content;
    }

    // If it's not a valid ToolConfig, try multi-document
  } catch (error) {
    // If single-document parsing failed, try multi-document
    // (Some errors like file not found should propagate)
    if (
      error instanceof FileNotFoundError ||
      error instanceof FileAccessError
    ) {
      throw error;
    }
  }

  // Try multi-document YAML
  try {
    const documents = readMultiDocumentYAML(absolutePath);

    if (documents.length === 0) {
      throw new SchemaValidationError(
        absolutePath,
        'ToolConfig',
        'file is empty or contains no documents'
      );
    }

    // Find first valid ToolConfig
    for (const doc of documents) {
      if (isToolConfig(doc)) {
        return doc;
      }
    }

    // No valid configs found
    throw new SchemaValidationError(
      absolutePath,
      'ToolConfig',
      'no valid ToolConfig found in multi-document YAML (check required field: tool.name)'
    );
  } catch (error) {
    if (error instanceof TemplateLoaderError) {
      throw error;
    }

    // Final fallback: generic schema error
    throw new SchemaValidationError(
      absolutePath,
      'ToolConfig',
      'schema validation failed (check required field: tool.name)'
    );
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * @public
 * @exports loadTemplate - Load AgentTemplate from YAML
 * @exports loadFragment - Load PromptFragment from YAML
 * @exports loadToolConfig - Load ToolConfig from YAML (supports multi-document)
 * @exports TemplateLoaderError - Base error class
 * @exports FileNotFoundError - File not found error
 * @exports FileAccessError - Permission denied error
 * @exports YAMLParseError - YAML syntax error
 * @exports SchemaValidationError - Schema validation error
 */
