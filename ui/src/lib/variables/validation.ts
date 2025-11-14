/**
 * Variable Validation Logic
 *
 * Provides type validation, required field validation, custom validation rules,
 * and async validation support for template variables.
 *
 * @module ui/lib/variables/validation
 * @version 1.0.0
 * @author Variable System Engineer (Agent 4)
 */

import type {
  VariableConfig,
  VariableValue,
  VariableValues,
  VariableValidationError,
  VariableValidationResult,
  VariablesValidationState,
  ValidationRule,
  ValidatorFunction,
} from '../types/variable-types';

// ============================================================================
// VALIDATION REGISTRY
// ============================================================================

/**
 * Registry of custom validators
 */
const customValidators = new Map<string, ValidatorFunction>();

/**
 * Registers a custom validator
 *
 * @param name - Validator name
 * @param validator - Validator function
 *
 * @example
 * ```typescript
 * registerValidator('email', (value) => {
 *   const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value));
 *   return {
 *     valid,
 *     errors: valid ? [] : [{ field: 'email', message: 'Invalid email', severity: 'error' }],
 *     warnings: [],
 *   };
 * });
 * ```
 */
export function registerValidator(name: string, validator: ValidatorFunction): void {
  customValidators.set(name, validator);
}

/**
 * Gets a registered validator
 *
 * @param name - Validator name
 * @returns Validator function or undefined
 */
export function getValidator(name: string): ValidatorFunction | undefined {
  return customValidators.get(name);
}

// ============================================================================
// TYPE VALIDATION
// ============================================================================

/**
 * Validates that value matches the expected type
 *
 * @param value - Value to validate
 * @param config - Variable configuration
 * @returns Validation result
 */
export function validateType(
  value: VariableValue,
  config: VariableConfig
): VariableValidationResult {
  const errors: VariableValidationError[] = [];

  // Null/undefined handling
  if (value === null || value === undefined) {
    if (config.required) {
      errors.push({
        field: config.name,
        message: `${config.label || config.name} is required`,
        severity: 'error',
        code: 'REQUIRED',
      });
    }
    return { valid: errors.length === 0, errors, warnings: [] };
  }

  // Type-specific validation
  switch (config.type) {
    case 'string':
      if (typeof value !== 'string') {
        errors.push({
          field: config.name,
          message: `${config.label || config.name} must be a string`,
          severity: 'error',
          code: 'TYPE_MISMATCH',
        });
      } else if (config.pattern) {
        const regex = new RegExp(config.pattern);
        if (!regex.test(value)) {
          errors.push({
            field: config.name,
            message: `${config.label || config.name} does not match required pattern`,
            severity: 'error',
            code: 'PATTERN_MISMATCH',
          });
        }
      }
      break;

    case 'number':
      if (typeof value !== 'number' || isNaN(value)) {
        errors.push({
          field: config.name,
          message: `${config.label || config.name} must be a number`,
          severity: 'error',
          code: 'TYPE_MISMATCH',
        });
      } else {
        if (config.min !== undefined && value < config.min) {
          errors.push({
            field: config.name,
            message: `${config.label || config.name} must be at least ${config.min}`,
            severity: 'error',
            code: 'MIN_VALUE',
          });
        }
        if (config.max !== undefined && value > config.max) {
          errors.push({
            field: config.name,
            message: `${config.label || config.name} must be at most ${config.max}`,
            severity: 'error',
            code: 'MAX_VALUE',
          });
        }
      }
      break;

    case 'boolean':
      if (typeof value !== 'boolean') {
        errors.push({
          field: config.name,
          message: `${config.label || config.name} must be true or false`,
          severity: 'error',
          code: 'TYPE_MISMATCH',
        });
      }
      break;

    case 'enum':
      if (!config.enumOptions || !config.enumOptions.includes(String(value))) {
        errors.push({
          field: config.name,
          message: `${config.label || config.name} must be one of: ${config.enumOptions?.join(', ')}`,
          severity: 'error',
          code: 'INVALID_ENUM',
        });
      }
      break;

    case 'array':
      if (!Array.isArray(value)) {
        errors.push({
          field: config.name,
          message: `${config.label || config.name} must be an array`,
          severity: 'error',
          code: 'TYPE_MISMATCH',
        });
      }
      break;

    case 'object':
      if (typeof value !== 'object' || Array.isArray(value)) {
        errors.push({
          field: config.name,
          message: `${config.label || config.name} must be an object`,
          severity: 'error',
          code: 'TYPE_MISMATCH',
        });
      }
      break;
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: [],
  };
}

// ============================================================================
// REQUIRED FIELD VALIDATION
// ============================================================================

/**
 * Validates required fields
 *
 * @param value - Value to validate
 * @param config - Variable configuration
 * @returns Validation result
 */
export function validateRequired(
  value: VariableValue,
  config: VariableConfig
): VariableValidationResult {
  const errors: VariableValidationError[] = [];

  if (config.required) {
    if (value === null || value === undefined || value === '') {
      errors.push({
        field: config.name,
        message: `${config.label || config.name} is required`,
        severity: 'error',
        code: 'REQUIRED',
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: [],
  };
}

// ============================================================================
// CUSTOM VALIDATION
// ============================================================================

/**
 * Runs custom validation if configured
 *
 * @param value - Value to validate
 * @param config - Variable configuration
 * @param allValues - All variable values
 * @returns Validation result (may be async)
 */
export async function validateCustom(
  value: VariableValue,
  config: VariableConfig,
  allValues: VariableValues
): Promise<VariableValidationResult> {
  if (!config.validator) {
    return { valid: true, errors: [], warnings: [] };
  }

  const validator = getValidator(config.validator);
  if (!validator) {
    console.warn(`Validator "${config.validator}" not found for field "${config.name}"`);
    return { valid: true, errors: [], warnings: [] };
  }

  try {
    const result = await validator(value, config, allValues);
    return result;
  } catch (error) {
    return {
      valid: false,
      errors: [
        {
          field: config.name,
          message: `Validation error: ${error instanceof Error ? error.message : String(error)}`,
          severity: 'error',
          code: 'VALIDATOR_ERROR',
        },
      ],
      warnings: [],
    };
  }
}

// ============================================================================
// SINGLE VARIABLE VALIDATION
// ============================================================================

/**
 * Validates a single variable value
 *
 * @param value - Value to validate
 * @param config - Variable configuration
 * @param allValues - All variable values (for cross-field validation)
 * @returns Validation result
 */
export async function validateVariable(
  value: VariableValue,
  config: VariableConfig,
  allValues: VariableValues = {}
): Promise<VariableValidationResult> {
  const results: VariableValidationResult[] = [];

  // Run all validation checks
  results.push(validateRequired(value, config));
  results.push(validateType(value, config));

  // Custom validation (async)
  const customResult = await validateCustom(value, config, allValues);
  results.push(customResult);

  // Combine results
  const allErrors = results.flatMap(r => r.errors);
  const allWarnings = results.flatMap(r => r.warnings);

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  };
}

// ============================================================================
// MULTIPLE VARIABLES VALIDATION
// ============================================================================

/**
 * Validates all variables
 *
 * @param values - Variable values to validate
 * @param configs - Variable configurations
 * @returns Validation state for all variables
 */
export async function validateAllVariables(
  values: VariableValues,
  configs: VariableConfig[]
): Promise<VariablesValidationState> {
  const variableResults: Record<string, VariableValidationResult> = {};

  // Validate each variable
  for (const config of configs) {
    const value = values[config.name];
    const result = await validateVariable(value, config, values);
    variableResults[config.name] = result;
  }

  // Aggregate results
  const allErrors: VariableValidationError[] = [];
  const allWarnings: string[] = [];
  let valid = true;

  for (const [name, result] of Object.entries(variableResults)) {
    if (!result.valid) {
      valid = false;
    }
    allErrors.push(...result.errors);
    allWarnings.push(...result.warnings);
  }

  return {
    valid,
    variables: variableResults,
    errors: allErrors,
    warnings: allWarnings,
  };
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Checks if validation state has errors
 *
 * @param validation - Validation state
 * @returns True if has errors
 */
export function hasErrors(validation: VariablesValidationState): boolean {
  return validation.errors.length > 0;
}

/**
 * Checks if validation state has warnings
 *
 * @param validation - Validation state
 * @returns True if has warnings
 */
export function hasWarnings(validation: VariablesValidationState): boolean {
  return validation.warnings.length > 0;
}

/**
 * Gets errors for a specific field
 *
 * @param validation - Validation state
 * @param fieldName - Field name
 * @returns Errors for field
 */
export function getFieldErrors(
  validation: VariablesValidationState,
  fieldName: string
): VariableValidationError[] {
  return validation.errors.filter(err => err.field === fieldName);
}

/**
 * Formats validation errors for display
 *
 * @param errors - Validation errors
 * @returns Formatted error string
 */
export function formatValidationErrors(errors: VariableValidationError[]): string {
  if (errors.length === 0) {
    return '';
  }

  return errors
    .map(err => `${err.field}: ${err.message}`)
    .join('\n');
}

// ============================================================================
// BUILT-IN VALIDATORS
// ============================================================================

/**
 * Email validator
 */
registerValidator('email', (value: VariableValue): VariableValidationResult => {
  const errors: VariableValidationError[] = [];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (value && !emailRegex.test(String(value))) {
    errors.push({
      field: 'email',
      message: 'Invalid email address',
      severity: 'error',
      code: 'INVALID_EMAIL',
    });
  }

  return { valid: errors.length === 0, errors, warnings: [] };
});

/**
 * URL validator
 */
registerValidator('url', (value: VariableValue): VariableValidationResult => {
  const errors: VariableValidationError[] = [];

  try {
    if (value) {
      new URL(String(value));
    }
  } catch {
    errors.push({
      field: 'url',
      message: 'Invalid URL',
      severity: 'error',
      code: 'INVALID_URL',
    });
  }

  return { valid: errors.length === 0, errors, warnings: [] };
});

/**
 * Non-empty string validator
 */
registerValidator('nonEmpty', (value: VariableValue): VariableValidationResult => {
  const errors: VariableValidationError[] = [];

  if (typeof value === 'string' && value.trim().length === 0) {
    errors.push({
      field: 'string',
      message: 'Value cannot be empty',
      severity: 'error',
      code: 'EMPTY_STRING',
    });
  }

  return { valid: errors.length === 0, errors, warnings: [] };
});
