/**
 * Agent Factory for Template → Configuration Pipeline
 *
 * Orchestrates the complete template resolution pipeline:
 * 1. Template discovery and loading (Registry + Loader)
 * 2. Schema validation (Validator)
 * 3. Inheritance and composition (Resolver)
 * 4. Variable interpolation (Interpolation)
 * 5. Final configuration output (ResolvedAgentConfig)
 *
 * @module templates/factory
 * @version 1.0.0
 * @author Factory Engineer (Agent 10)
 */

import * as path from 'path';
import type { AgentTemplate, ResolvedAgentConfig } from './types';
import { TemplateRegistry } from './registry';
import { loadTemplate } from './loader';
import { validateTemplate, validateVariables } from './validator';
import { resolveTemplate } from './resolver';
import { validateVariables as checkMissingVariables } from './interpolation';

// ============================================================================
// ERROR CLASSES
// ============================================================================

/**
 * Base error class for factory operations.
 */
export class FactoryError extends Error {
  constructor(
    message: string,
    public readonly templateName?: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'FactoryError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error thrown when a template cannot be found.
 */
export class TemplateNotFoundError extends FactoryError {
  constructor(
    templateName: string,
    public readonly availableTemplates: string[]
  ) {
    const suggestion =
      availableTemplates.length > 0
        ? `\n\nAvailable templates:\n${availableTemplates.map((t) => `  - ${t}`).join('\n')}`
        : '\n\nNo templates found. Make sure your template directory is configured correctly.';

    super(`Template "${templateName}" not found.${suggestion}`, templateName);
    this.name = 'TemplateNotFoundError';
  }
}

/**
 * Error thrown when required variables are missing.
 */
export class MissingVariablesError extends FactoryError {
  constructor(
    templateName: string,
    public readonly missingVariables: string[]
  ) {
    super(
      `Missing required variables for template "${templateName}": ${missingVariables.join(', ')}`,
      templateName
    );
    this.name = 'MissingVariablesError';
  }
}

/**
 * Error thrown when template validation fails.
 */
export class TemplateValidationError extends FactoryError {
  constructor(
    templateName: string,
    public readonly validationErrors: Array<{ field: string; message: string; severity: string }>
  ) {
    const errorList = validationErrors
      .filter((e) => e.severity === 'error')
      .map((e) => `  - ${e.field}: ${e.message}`)
      .join('\n');

    super(
      `Template validation failed for "${templateName}":\n${errorList}`,
      templateName
    );
    this.name = 'TemplateValidationError';
  }
}

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Configuration options for AgentFactory.
 */
export interface AgentFactoryConfig {
  /**
   * Directory containing agent templates.
   * Default: './agent-templates'
   */
  templateDir?: string;

  /**
   * Base directory for resolving relative paths in templates.
   * Default: process.cwd()
   */
  baseDir?: string;

  /**
   * Validate templates during scan.
   * If true, invalid templates will be logged as warnings but won't stop the scan.
   * Default: true
   */
  validateTemplates?: boolean;

  /**
   * Enable caching of resolved configurations.
   * If true, subsequent calls to create() with the same template name and variables
   * will return cached results (faster but won't pick up template changes).
   * Default: false
   */
  cacheEnabled?: boolean;
}

// ============================================================================
// AGENT FACTORY
// ============================================================================

/**
 * Agent template factory for creating ready-to-execute agent configurations.
 *
 * Provides a high-level interface to the template system:
 * - Discovers templates from filesystem
 * - Validates template schema and user variables
 * - Resolves inheritance, mixins, and tool configurations
 * - Interpolates variables into prompts
 * - Outputs ResolvedAgentConfig ready for LLMClient.query()
 *
 * @example
 * ```typescript
 * // Initialize factory
 * const factory = new AgentFactory({ templateDir: './agent-templates' });
 * await factory.scan();
 *
 * // Create agent from template name
 * const config = await factory.create('code-reviewer-agent', {
 *   targetFile: './src/index.ts',
 *   outputPath: './review.md'
 * });
 *
 * // Use with LLMClient
 * const client = new LLMClient({ claudeSDK: sdk });
 * for await (const msg of client.query(config.prompt, {
 *   allowedTools: config.tools,
 *   maxTurns: config.settings.maxTurns,
 *   temperature: config.settings.temperature
 * })) {
 *   console.log(msg.content);
 * }
 * ```
 */
export class AgentFactory {
  /**
   * Template registry for discovery and caching.
   */
  private registry: TemplateRegistry;

  /**
   * Base directory for resolving relative paths.
   */
  private baseDir: string;

  /**
   * Whether to validate templates during scan.
   */
  private validateTemplates: boolean;

  /**
   * Whether caching is enabled.
   */
  private cacheEnabled: boolean;

  /**
   * Cache of resolved configurations (template name + variables hash → config).
   */
  private cache: Map<string, ResolvedAgentConfig>;

  /**
   * Whether the registry has been scanned.
   */
  private scanned: boolean;

  /**
   * Creates a new agent factory.
   *
   * @param config - Factory configuration options
   */
  constructor(config?: AgentFactoryConfig) {
    const templateDir = config?.templateDir || './agent-templates';
    this.baseDir = config?.baseDir || process.cwd();
    this.validateTemplates = config?.validateTemplates ?? true;
    this.cacheEnabled = config?.cacheEnabled ?? false;

    this.registry = new TemplateRegistry(templateDir);
    this.cache = new Map();
    this.scanned = false;
  }

  /**
   * Scans the template directory and builds the registry.
   *
   * Must be called before using create() or createFromPath().
   * Can be called multiple times to refresh the registry.
   *
   * @throws {Error} If template directory doesn't exist
   */
  public async scan(): Promise<void> {
    await this.registry.scan();
    this.scanned = true;

    // Clear cache on rescan
    if (this.cacheEnabled) {
      this.cache.clear();
    }
  }

  /**
   * Creates a resolved agent configuration from a template name.
   *
   * Full pipeline:
   * 1. Look up template in registry
   * 2. Load template from filesystem
   * 3. Validate template schema
   * 4. Validate provided variables
   * 5. Resolve inheritance and mixins
   * 6. Resolve tool configurations
   * 7. Interpolate variables
   * 8. Return ResolvedAgentConfig
   *
   * @param templateName - Name of the template (from metadata.name)
   * @param variables - Variables for interpolation
   * @returns Fully resolved agent configuration ready for LLMClient.query()
   * @throws {TemplateNotFoundError} If template doesn't exist
   * @throws {MissingVariablesError} If required variables are missing
   * @throws {TemplateValidationError} If template validation fails
   * @throws {FactoryError} If resolution fails
   *
   * @example
   * ```typescript
   * const config = await factory.create('code-reviewer-agent', {
   *   targetFile: './src/index.ts',
   *   outputPath: './review.md'
   * });
   * ```
   */
  public async create(
    templateName: string,
    variables: Record<string, any> = {}
  ): Promise<ResolvedAgentConfig> {
    // Ensure registry is scanned
    if (!this.scanned) {
      throw new FactoryError(
        'Factory has not been scanned. Call factory.scan() first.',
        templateName
      );
    }

    // Check cache (if enabled)
    if (this.cacheEnabled) {
      const cacheKey = this.getCacheKey(templateName, variables);
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      // Step 1: Look up template in registry
      const template = this.registry.getTemplate(templateName);
      if (!template) {
        throw new TemplateNotFoundError(templateName, this.registry.listNames());
      }

      // Step 2: Validate template schema (if enabled)
      if (this.validateTemplates) {
        const validationResult = validateTemplate(template);
        if (!validationResult.valid) {
          throw new TemplateValidationError(templateName, validationResult.errors);
        }
      }

      // Step 3: Validate variables (required fields present)
      await this.validateVariables(template, variables);

      // Step 4: Get the template's file path from registry for resolving relative paths
      const templatePath = this.registry.getTemplatePath(templateName);
      const templateBaseDir = templatePath ? path.dirname(templatePath) : undefined;

      // Step 5: Resolve template (inheritance, mixins, tool configs, interpolation)
      const resolved = await resolveTemplate(template, variables, templateBaseDir);

      // Step 6: Cache result (if enabled)
      if (this.cacheEnabled) {
        const cacheKey = this.getCacheKey(templateName, variables);
        this.cache.set(cacheKey, resolved);
      }

      return resolved;
    } catch (error) {
      // Re-throw known error types
      if (
        error instanceof TemplateNotFoundError ||
        error instanceof MissingVariablesError ||
        error instanceof TemplateValidationError
      ) {
        throw error;
      }

      // Wrap other errors
      throw new FactoryError(
        `Failed to create agent from template "${templateName}": ${error instanceof Error ? error.message : String(error)}`,
        templateName,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Creates a resolved agent configuration from a template file path.
   *
   * Useful when you have a template file outside the template directory,
   * or when you want to create an agent without scanning the registry.
   *
   * @param templatePath - Path to template YAML file (absolute or relative to baseDir)
   * @param variables - Variables for interpolation
   * @returns Fully resolved agent configuration
   * @throws {MissingVariablesError} If required variables are missing
   * @throws {TemplateValidationError} If template validation fails
   * @throws {FactoryError} If template loading or resolution fails
   *
   * @example
   * ```typescript
   * const config = await factory.createFromPath('./custom-agent.yaml', {
   *   targetFile: './src/index.ts'
   * });
   * ```
   */
  public async createFromPath(
    templatePath: string,
    variables: Record<string, any> = {}
  ): Promise<ResolvedAgentConfig> {
    try {
      // Resolve absolute path
      const absolutePath = path.isAbsolute(templatePath)
        ? templatePath
        : path.resolve(this.baseDir, templatePath);

      // Step 1: Load template from file
      const template = await loadTemplate(absolutePath);

      // Step 2: Validate template schema (if enabled)
      if (this.validateTemplates) {
        const validationResult = validateTemplate(template);
        if (!validationResult.valid) {
          throw new TemplateValidationError(template.metadata.name, validationResult.errors);
        }
      }

      // Step 3: Validate variables
      await this.validateVariables(template, variables);

      // Step 4: Resolve template (with baseDir from template path)
      const templateBaseDir = path.dirname(absolutePath);
      const resolved = await resolveTemplate(template, variables, templateBaseDir);

      return resolved;
    } catch (error) {
      // Re-throw known error types
      if (
        error instanceof MissingVariablesError ||
        error instanceof TemplateValidationError
      ) {
        throw error;
      }

      // Wrap other errors
      throw new FactoryError(
        `Failed to create agent from path "${templatePath}": ${error instanceof Error ? error.message : String(error)}`,
        undefined,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Gets the template registry.
   *
   * Use this to access the catalog, filter templates, etc.
   *
   * @returns Template registry
   *
   * @example
   * ```typescript
   * const catalog = factory.getRegistry().getCatalog();
   * console.log(`Found ${catalog.count} templates`);
   *
   * const codeAgents = factory.getRegistry().filterByTag('code-analysis');
   * ```
   */
  public getRegistry(): TemplateRegistry {
    return this.registry;
  }

  /**
   * Refreshes the factory by rescanning templates and clearing cache.
   *
   * Call this when template files have changed on disk.
   *
   * @throws {Error} If template directory doesn't exist
   */
  public async refresh(): Promise<void> {
    await this.scan();
  }

  /**
   * Validates that all required variables are provided.
   *
   * @param template - Template to validate against
   * @param variables - Provided variables
   * @throws {MissingVariablesError} If required variables are missing
   */
  private async validateVariables(
    template: AgentTemplate,
    variables: Record<string, any>
  ): Promise<void> {
    // Check template validation rules (if present)
    if (template.validation) {
      const result = validateVariables(template, variables);
      if (!result.valid) {
        const missingVars = result.errors
          .filter((e) => e.severity === 'error' && e.message.includes('not provided'))
          .map((e) => e.field.replace('variables.', ''));

        if (missingVars.length > 0) {
          throw new MissingVariablesError(template.metadata.name, missingVars);
        }
      }
    }

    // Also check for missing variables in prompt (using interpolation module)
    const missing = checkMissingVariables(template.agent.prompt, variables);
    if (missing.length > 0) {
      throw new MissingVariablesError(template.metadata.name, missing);
    }
  }

  /**
   * Generates a cache key from template name and variables.
   *
   * @param templateName - Template name
   * @param variables - Variables
   * @returns Cache key
   */
  private getCacheKey(templateName: string, variables: Record<string, any>): string {
    // Simple cache key: template name + JSON of variables
    // For production use, consider a more sophisticated hash
    return `${templateName}:${JSON.stringify(variables)}`;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * @public
 * @exports AgentFactory - Main factory class
 * @exports AgentFactoryConfig - Factory configuration interface
 * @exports FactoryError - Base error class
 * @exports TemplateNotFoundError - Template not found error
 * @exports MissingVariablesError - Missing variables error
 * @exports TemplateValidationError - Validation error
 */
