/**
 * Variable Validation
 *
 * Validation logic for template variables.
 *
 * @module lib/variables/validation
 * @version 1.0.0
 * @author Variable System Engineer (Agent 4) - Wave 3
 */

import { VariableType } from './types';
import type { VariableDefinition, VariableValidation, ValidationResult } from './types';

/**
 * Validate a variable value against its definition
 */
export function validateVariableValue(value: any, definition: VariableDefinition): ValidationResult {
  // Check required
  if (definition.required && (value === undefined || value === null || value === '')) {
    return {
      valid: false,
      error: `${definition.label} is required`,
    };
  }

  // Skip further validation if empty and not required
  if (!definition.required && (value === undefined || value === null || value === '')) {
    return { valid: true };
  }

  // Type validation
  const typeValidation = validateType(value, definition.type);
  if (!typeValidation.valid) {
    return typeValidation;
  }

  // Custom validation rules
  if (definition.validation) {
    for (const rule of definition.validation) {
      const ruleValidation = validateRule(value, rule, definition);
      if (!ruleValidation.valid) {
        return ruleValidation;
      }
    }
  }

  return { valid: true };
}

/**
 * Validate value type
 */
function validateType(value: any, type: VariableType): ValidationResult {
  switch (type) {
    case 'string':
      if (typeof value !== 'string') {
        return { valid: false, error: 'Must be a string' };
      }
      break;

    case 'number':
      if (typeof value !== 'number' || isNaN(value)) {
        return { valid: false, error: 'Must be a number' };
      }
      break;

    case 'boolean':
      if (typeof value !== 'boolean') {
        return { valid: false, error: 'Must be true or false' };
      }
      break;

    case 'array':
      if (!Array.isArray(value)) {
        return { valid: false, error: 'Must be an array' };
      }
      break;

    case 'object':
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        return { valid: false, error: 'Must be an object' };
      }
      break;

    case 'file_path':
    case 'directory_path':
      if (typeof value !== 'string') {
        return { valid: false, error: 'Must be a valid path' };
      }
      // Basic path validation
      if (value.includes('..') && !value.startsWith('/')) {
        return { valid: false, error: 'Invalid path format' };
      }
      break;

    case 'url':
      if (typeof value !== 'string') {
        return { valid: false, error: 'Must be a valid URL' };
      }
      try {
        new URL(value);
      } catch {
        return { valid: false, error: 'Invalid URL format' };
      }
      break;

    case 'email':
      if (typeof value !== 'string') {
        return { valid: false, error: 'Must be a valid email' };
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return { valid: false, error: 'Invalid email format' };
      }
      break;

    case 'date':
      if (typeof value !== 'string') {
        return { valid: false, error: 'Must be a valid date' };
      }
      if (isNaN(Date.parse(value))) {
        return { valid: false, error: 'Invalid date format' };
      }
      break;

    case 'json':
      if (typeof value === 'string') {
        try {
          JSON.parse(value);
        } catch {
          return { valid: false, error: 'Invalid JSON format' };
        }
      }
      break;
  }

  return { valid: true };
}

/**
 * Validate a single rule
 */
function validateRule(value: any, rule: VariableValidation, _definition: VariableDefinition): ValidationResult {
  switch (rule.type) {
    case 'required':
      if (value === undefined || value === null || value === '') {
        return { valid: false, error: rule.message, rule };
      }
      break;

    case 'pattern':
      if (typeof value === 'string' && rule.value) {
        const regex = new RegExp(rule.value);
        if (!regex.test(value)) {
          return { valid: false, error: rule.message, rule };
        }
      }
      break;

    case 'min':
      if (typeof value === 'number' && rule.value !== undefined) {
        if (value < rule.value) {
          return { valid: false, error: rule.message, rule };
        }
      }
      break;

    case 'max':
      if (typeof value === 'number' && rule.value !== undefined) {
        if (value > rule.value) {
          return { valid: false, error: rule.message, rule };
        }
      }
      break;

    case 'minLength':
      if (typeof value === 'string' && rule.value !== undefined) {
        if (value.length < rule.value) {
          return { valid: false, error: rule.message, rule };
        }
      }
      if (Array.isArray(value) && rule.value !== undefined) {
        if (value.length < rule.value) {
          return { valid: false, error: rule.message, rule };
        }
      }
      break;

    case 'maxLength':
      if (typeof value === 'string' && rule.value !== undefined) {
        if (value.length > rule.value) {
          return { valid: false, error: rule.message, rule };
        }
      }
      if (Array.isArray(value) && rule.value !== undefined) {
        if (value.length > rule.value) {
          return { valid: false, error: rule.message, rule };
        }
      }
      break;

    case 'enum':
      if (Array.isArray(rule.value) && !rule.value.includes(value)) {
        return { valid: false, error: rule.message, rule };
      }
      break;

    case 'custom':
      // Custom validation would need to be implemented by caller
      // For now, we'll trust the value is valid
      break;
  }

  return { valid: true };
}

/**
 * Extract variables from template content
 */
export function extractVariables(content: string, source: 'prompt' | 'config' | 'fragment'): Array<{
  name: string;
  source: 'prompt' | 'config' | 'fragment';
  line: number;
  context: string;
}> {
  const variables: Array<{
    name: string;
    source: 'prompt' | 'config' | 'fragment';
    line: number;
    context: string;
  }> = [];

  // Match {{variableName}} pattern
  const regex = /\{\{(\w+)\}\}/g;
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    let match;
    while ((match = regex.exec(line)) !== null) {
      variables.push({
        name: match[1],
        source,
        line: index + 1,
        context: line.trim(),
      });
    }
  });

  return variables;
}

/**
 * Check for missing variables in content
 */
export function checkMissingVariables(
  content: string,
  providedVariables: Record<string, any>
): string[] {
  const regex = /\{\{(\w+)\}\}/g;
  const required = new Set<string>();
  let match;

  while ((match = regex.exec(content)) !== null) {
    required.add(match[1]);
  }

  const missing: string[] = [];
  required.forEach((varName) => {
    if (!(varName in providedVariables) || providedVariables[varName] === undefined || providedVariables[varName] === '') {
      missing.push(varName);
    }
  });

  return missing;
}

/**
 * Interpolate variables into content
 */
export function interpolateVariables(content: string, variables: Record<string, any>): string {
  let result = content;

  Object.entries(variables).forEach(([name, value]) => {
    const regex = new RegExp(`\\{\\{${name}\\}\\}`, 'g');
    result = result.replace(regex, String(value));
  });

  return result;
}

/**
 * Create variable definition from extracted variable
 */
export function createDefinitionFromExtracted(
  name: string,
  type: VariableType = VariableType.STRING,
  required: boolean = true
): VariableDefinition {
  return {
    name,
    label: name.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase()),
    type,
    description: `Variable: ${name}`,
    required,
    validation: required
      ? [
          {
            type: 'required',
            message: `${name} is required`,
          },
        ]
      : undefined,
  };
}
