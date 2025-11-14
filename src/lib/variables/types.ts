/**
 * Variable System Type Definitions
 *
 * Defines types for template variables, validation, and UI state.
 *
 * @module lib/variables/types
 * @version 1.0.0
 * @author Variable System Engineer (Agent 4) - Wave 3
 */

// ============================================================================
// VARIABLE DEFINITIONS
// ============================================================================

/**
 * Variable type enumeration
 */
export enum VariableType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  ARRAY = 'array',
  OBJECT = 'object',
  FILE_PATH = 'file_path',
  DIRECTORY_PATH = 'directory_path',
  URL = 'url',
  EMAIL = 'email',
  DATE = 'date',
  JSON = 'json',
}

/**
 * Variable validation rule
 */
export interface VariableValidation {
  /** Validation type */
  type: 'required' | 'pattern' | 'min' | 'max' | 'minLength' | 'maxLength' | 'enum' | 'custom';

  /** Validation value/parameter */
  value?: any;

  /** Error message for validation failure */
  message: string;
}

/**
 * Variable definition
 */
export interface VariableDefinition {
  /** Variable name (e.g., "targetPath") */
  name: string;

  /** Display label for UI */
  label: string;

  /** Variable type */
  type: VariableType;

  /** Description/help text */
  description?: string;

  /** Default value */
  defaultValue?: any;

  /** Whether variable is required */
  required: boolean;

  /** Validation rules */
  validation?: VariableValidation[];

  /** Placeholder text for input */
  placeholder?: string;

  /** Options for enum/select types */
  options?: Array<{ label: string; value: any }>;

  /** Whether variable is sensitive (hide in logs) */
  sensitive?: boolean;

  /** Variable category/group */
  category?: string;
}

/**
 * Variable value with metadata
 */
export interface VariableValue {
  /** Variable name */
  name: string;

  /** Current value */
  value: any;

  /** Whether value is valid */
  isValid: boolean;

  /** Validation error message */
  error?: string;

  /** Whether value has been modified from default */
  isDirty: boolean;

  /** Last modified timestamp */
  lastModified: number;
}

/**
 * Variable extraction result
 */
export interface ExtractedVariable {
  /** Variable name */
  name: string;

  /** Where the variable was found */
  source: 'prompt' | 'config' | 'fragment';

  /** Line number where found (if applicable) */
  line?: number;

  /** Context around the variable reference */
  context?: string;
}

// ============================================================================
// VARIABLE STORE STATE
// ============================================================================

/**
 * Variable store state
 */
export interface VariableState {
  /** Template ID this variable set belongs to */
  templateId: string | null;

  /** Variable definitions */
  definitions: Map<string, VariableDefinition>;

  /** Current variable values */
  values: Map<string, VariableValue>;

  /** Whether form is in edit mode */
  isEditing: boolean;

  /** Currently focused variable */
  focusedVariable: string | null;

  /** Variable validation errors */
  errors: Map<string, string>;

  /** Whether validation is in progress */
  isValidating: boolean;

  /** Extracted variables from template */
  extractedVariables: ExtractedVariable[];

  // ========================================
  // Actions
  // ========================================

  /**
   * Set template and load its variables
   */
  setTemplate: (templateId: string, definitions: VariableDefinition[]) => void;

  /**
   * Set variable value
   */
  setValue: (name: string, value: any) => void;

  /**
   * Set multiple variable values
   */
  setValues: (values: Record<string, any>) => void;

  /**
   * Validate single variable
   */
  validateVariable: (name: string) => boolean;

  /**
   * Validate all variables
   */
  validateAll: () => boolean;

  /**
   * Reset variable to default value
   */
  resetVariable: (name: string) => void;

  /**
   * Reset all variables to defaults
   */
  resetAll: () => void;

  /**
   * Set edit mode
   */
  setEditMode: (isEditing: boolean) => void;

  /**
   * Set focused variable
   */
  setFocusedVariable: (name: string | null) => void;

  /**
   * Add variable definition
   */
  addDefinition: (definition: VariableDefinition) => void;

  /**
   * Remove variable definition
   */
  removeDefinition: (name: string) => void;

  /**
   * Update variable definition
   */
  updateDefinition: (name: string, updates: Partial<VariableDefinition>) => void;

  /**
   * Set extracted variables
   */
  setExtractedVariables: (variables: ExtractedVariable[]) => void;

  /**
   * Get all values as record
   */
  getValuesRecord: () => Record<string, any>;

  /**
   * Get missing required variables
   */
  getMissingRequired: () => string[];

  /**
   * Clear all state
   */
  clear: () => void;
}

// ============================================================================
// VARIABLE UI STATE
// ============================================================================

/**
 * Variable editor UI mode
 */
export enum VariableEditorMode {
  FORM = 'form',
  JSON = 'json',
  YAML = 'yaml',
}

/**
 * Variable editor state
 */
export interface VariableEditorState {
  /** Current editor mode */
  mode: VariableEditorMode;

  /** Whether to show advanced options */
  showAdvanced: boolean;

  /** Whether to group variables by category */
  groupByCategory: boolean;

  /** Collapsed categories */
  collapsedCategories: Set<string>;

  /** Search/filter query */
  searchQuery: string;

  /** Show only required variables */
  showRequiredOnly: boolean;

  /** Show only invalid variables */
  showInvalidOnly: boolean;
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Variable validation result
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;

  /** Error message if validation failed */
  error?: string;

  /** Validation rule that failed */
  rule?: VariableValidation;
}

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * @public
 * @exports VariableType - Variable type enumeration
 * @exports VariableDefinition - Variable definition structure
 * @exports VariableValue - Variable value with metadata
 * @exports ExtractedVariable - Extracted variable reference
 * @exports VariableState - Variable store state
 * @exports VariableEditorMode - Editor mode enumeration
 * @exports VariableEditorState - Editor UI state
 * @exports ValidationResult - Validation result structure
 */
