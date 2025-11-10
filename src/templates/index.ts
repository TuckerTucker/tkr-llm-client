/**
 * Agent Template System - Main Module Exports
 *
 * This module provides the complete type system for the agent template system,
 * enabling type-safe template loading, validation, composition, and execution.
 *
 * @module templates
 * @version 1.0.0
 */

// Export all types and type guards from the type system
export {
  // Core template types
  AgentTemplate,
  TemplateMetadata,
  AgentConfig,

  // Tool references
  ToolReference,
  ToolWithConfig,

  // Settings and fragments
  AgentSettings,
  PromptFragment,

  // Tool configuration
  ToolConfig,
  ToolPermissions,
  ToolValidation,
  ToolErrorHandling,

  // Validation
  ValidationRules,
  ValidationTypeRule,

  // Runtime and resolution
  RuntimeConfig,
  ResolvedAgentConfig,

  // Catalog
  TemplateCatalog,
  TemplateCatalogEntry,

  // Validation results
  ValidationResult,
  ValidationError,

  // Type guards
  isAgentTemplate,
  isPromptFragment,
  isToolConfig,
  isToolReference,
} from './types';

// Export template registry
export { TemplateRegistry } from './registry';

// Export agent factory
export {
  AgentFactory,
  AgentFactoryConfig,
  FactoryError,
  TemplateNotFoundError,
  MissingVariablesError,
  TemplateValidationError,
} from './factory';

// Export loader functions and errors
export {
  loadTemplate,
  loadFragment,
  loadToolConfig,
  TemplateLoaderError,
  FileNotFoundError,
  FileAccessError,
  YAMLParseError,
  SchemaValidationError,
} from './loader';

// Export interpolation functions
export {
  interpolate,
  hasVariables,
  extractVariables,
  validateVariables as validateTemplateVariables,
  InterpolationError,
} from './interpolation';

// Export validation functions
export {
  validateTemplate,
  validateToolConfig,
  validateFragment,
  validateVariables,
} from './validator';

// Export resolver functions
export {
  resolveTemplate,
  resolveExtends,
  resolveFragments,
  resolveToolConfigs,
  TemplateResolutionError,
  CircularInheritanceError,
  MaxDepthExceededError,
} from './resolver';
