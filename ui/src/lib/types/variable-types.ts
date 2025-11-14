/**
 * Variable Type Definitions for ReactFlow Template System
 *
 * Defines types for variable configuration, values, validation, and form state.
 *
 * @module ui/lib/types/variable-types
 * @version 1.0.0
 * @author Variable System Engineer (Agent 4)
 */

/**
 * Supported variable types
 */
export type VariableType = 'string' | 'number' | 'boolean' | 'enum' | 'array' | 'object';

/**
 * Variable configuration from template
 */
export interface VariableConfig {
  /** Variable name (used in template) */
  name: string;

  /** Display label */
  label?: string;

  /** Variable type */
  type: VariableType;

  /** Help text or description */
  description?: string;

  /** Whether variable is required */
  required: boolean;

  /** Default value */
  defaultValue?: any;

  /** For enum type: allowed values */
  enumOptions?: string[];

  /** For number type: minimum value */
  min?: number;

  /** For number type: maximum value */
  max?: number;

  /** For string type: pattern validation */
  pattern?: string;

  /** For array type: item type */
  itemType?: VariableType;

  /** For object type: schema */
  schema?: Record<string, VariableConfig>;

  /** Custom validation function name */
  validator?: string;

  /** Placeholder text for input */
  placeholder?: string;
}

/**
 * Variable value (can be any type)
 */
export type VariableValue = string | number | boolean | any[] | Record<string, any> | null | undefined;

/**
 * Validation error for a variable
 */
export interface VariableValidationError {
  /** Variable name */
  field: string;

  /** Error message */
  message: string;

  /** Severity */
  severity: 'error' | 'warning';

  /** Error code for programmatic handling */
  code?: string;
}

/**
 * Validation result for a single variable
 */
export interface VariableValidationResult {
  /** Whether variable is valid */
  valid: boolean;

  /** Validation errors */
  errors: VariableValidationError[];

  /** Warnings (non-blocking) */
  warnings: string[];
}

/**
 * Validation state for all variables
 */
export interface VariablesValidationState {
  /** Overall validity */
  valid: boolean;

  /** Validation results by variable name */
  variables: Record<string, VariableValidationResult>;

  /** All errors across all variables */
  errors: VariableValidationError[];

  /** All warnings across all variables */
  warnings: string[];
}

/**
 * Variable values record
 */
export type VariableValues = Record<string, VariableValue>;

/**
 * Form state for variables
 */
export interface VariableFormState {
  /** Current variable values */
  values: VariableValues;

  /** Validation state */
  validation: VariablesValidationState;

  /** Touched fields (for showing validation only after blur) */
  touched: Set<string>;

  /** Whether form has been modified */
  dirty: boolean;

  /** Whether form is currently validating */
  validating: boolean;

  /** Whether form is submitting */
  submitting: boolean;
}

/**
 * Variable input props (base for all type-specific inputs)
 */
export interface VariableInputProps {
  /** Variable configuration */
  config: VariableConfig;

  /** Current value */
  value: VariableValue;

  /** Change handler */
  onChange: (value: VariableValue) => void;

  /** Blur handler */
  onBlur: () => void;

  /** Validation result */
  validation?: VariableValidationResult;

  /** Whether field has been touched */
  touched?: boolean;

  /** Whether field is disabled */
  disabled?: boolean;

  /** Whether to show validation immediately */
  showValidation?: boolean;
}

/**
 * Variable form callbacks
 */
export interface VariableFormCallbacks {
  /** Called when form values change */
  onChange?: (values: VariableValues) => void;

  /** Called when form is submitted */
  onSubmit?: (values: VariableValues) => void | Promise<void>;

  /** Called when form is reset */
  onReset?: () => void;

  /** Called when validation state changes */
  onValidationChange?: (validation: VariablesValidationState) => void;
}

/**
 * Variable form props
 */
export interface VariableFormProps {
  /** Variable configurations */
  variables: VariableConfig[];

  /** Initial values */
  initialValues?: VariableValues;

  /** Form callbacks */
  callbacks?: VariableFormCallbacks;

  /** Whether to validate on blur (default: true) */
  validateOnBlur?: boolean;

  /** Whether to validate on change (default: false) */
  validateOnChange?: boolean;

  /** Whether form is disabled */
  disabled?: boolean;

  /** Show submit button */
  showSubmit?: boolean;

  /** Show reset button */
  showReset?: boolean;

  /** Submit button text */
  submitText?: string;

  /** Reset button text */
  resetText?: string;
}

/**
 * Async validator function
 */
export type AsyncValidator = (
  value: VariableValue,
  config: VariableConfig,
  allValues: VariableValues
) => Promise<VariableValidationResult>;

/**
 * Sync validator function
 */
export type SyncValidator = (
  value: VariableValue,
  config: VariableConfig,
  allValues: VariableValues
) => VariableValidationResult;

/**
 * Validator function (sync or async)
 */
export type ValidatorFunction = SyncValidator | AsyncValidator;

/**
 * Validation rule
 */
export interface ValidationRule {
  /** Rule name */
  name: string;

  /** Validator function */
  validator: ValidatorFunction;

  /** Error message template */
  message: string;
}

/**
 * Interpolation preview data
 */
export interface InterpolationPreviewData {
  /** Original template */
  template: string;

  /** Interpolated result */
  result: string | null;

  /** Missing variables */
  missingVariables: string[];

  /** Errors during interpolation */
  errors: string[];

  /** Token count before and after */
  tokenCount: {
    before: number;
    after: number | null;
  };
}
