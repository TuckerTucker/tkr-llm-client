/**
 * Validation Module
 *
 * Provides validation pipeline, debouncing, and caching for template validation.
 *
 * @module lib/validation
 * @version 1.0.0
 * @author Validation & Preview Engineer (Agent 4)
 */

// Pipeline exports
export {
  validateNode,
  validateTemplate,
  validateToolConfig,
  validateFragment,
  validateVariable,
  validateNodes,
  hasErrors,
  hasWarnings,
  getErrorsBySeverity,
  formatValidationErrors,
} from './pipeline';

export type {
  ValidatableNode,
  ValidationContext,
  EnhancedValidationResult,
} from './pipeline';

// Debounced validator exports
export {
  DebouncedValidator,
  createDebouncedValidator,
} from './debounced';

export type {
  DebouncedValidatorConfig,
} from './debounced';

// Cache exports
export {
  ValidationCache,
  createCachedValidator,
} from './cache';

export type {
  ValidationCacheConfig,
  CacheStats,
} from './cache';
