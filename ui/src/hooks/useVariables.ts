/**
 * Variable Management Hook
 *
 * React hook for managing template variables with Zustand store integration.
 *
 * @module hooks/useVariables
 * @version 1.0.0
 * @author Variable Panel Engineer (Agent 4) - Wave 2
 */

import { useMemo } from 'react';
import { useVariableStore } from '@/../../src/lib/variables/variable-store';
import type {
  VariableDefinition,
  VariableValue,
} from '@/../../src/lib/variables/types';

/**
 * Hook return type
 */
export interface UseVariablesReturn {
  /** Variable definitions */
  variables: VariableDefinition[];

  /** Required variables */
  requiredVariables: VariableDefinition[];

  /** Optional variables */
  optionalVariables: VariableDefinition[];

  /** Current values map */
  values: Map<string, VariableValue>;

  /** Validation errors map */
  errors: Map<string, string>;

  /** Get a variable value by name */
  getValue: (name: string) => any;

  /** Set a variable value */
  setValue: (name: string, value: any) => void;

  /** Validate a single variable */
  validate: (name: string) => boolean;

  /** Validate all variables */
  validateAll: () => boolean;

  /** Reset a single variable to default */
  resetVariable: (name: string) => void;

  /** Reset all variables to defaults */
  reset: () => void;

  /** Check if any variable has been modified */
  isDirty: boolean;

  /** Check if any validation errors exist */
  hasErrors: boolean;

  /** Whether form is in edit mode */
  isEditing: boolean;

  /** Set edit mode */
  setEditMode: (isEditing: boolean) => void;

  /** Currently focused variable */
  focusedVariable: string | null;

  /** Set focused variable */
  setFocusedVariable: (name: string | null) => void;

  /** Get all values as record */
  getValuesRecord: () => Record<string, any>;

  /** Get missing required variables */
  getMissingRequired: () => string[];

  /** Whether validation is in progress */
  isValidating: boolean;

  /** Template ID */
  templateId: string | null;
}

/**
 * Hook for managing template variables
 *
 * @param templateId - Optional template ID to filter by
 * @returns Variable management interface
 */
export function useVariables(templateId?: string): UseVariablesReturn {
  // Get all store state and actions
  const storeTemplateId = useVariableStore((state) => state.templateId);
  const definitions = useVariableStore((state) => state.definitions);
  const values = useVariableStore((state) => state.values);
  const errors = useVariableStore((state) => state.errors);
  const isEditing = useVariableStore((state) => state.isEditing);
  const focusedVariable = useVariableStore((state) => state.focusedVariable);
  const isValidating = useVariableStore((state) => state.isValidating);

  const setValue = useVariableStore((state) => state.setValue);
  const validateVariable = useVariableStore((state) => state.validateVariable);
  const validateAll = useVariableStore((state) => state.validateAll);
  const resetVariable = useVariableStore((state) => state.resetVariable);
  const resetAll = useVariableStore((state) => state.resetAll);
  const setEditMode = useVariableStore((state) => state.setEditMode);
  const setFocusedVariable = useVariableStore((state) => state.setFocusedVariable);
  const getValuesRecord = useVariableStore((state) => state.getValuesRecord);
  const getMissingRequired = useVariableStore((state) => state.getMissingRequired);

  // Convert definitions Map to array
  const variables = useMemo(() => {
    return Array.from(definitions.values());
  }, [definitions]);

  // Split into required and optional
  const requiredVariables = useMemo(() => {
    return variables.filter((v) => v.required);
  }, [variables]);

  const optionalVariables = useMemo(() => {
    return variables.filter((v) => !v.required);
  }, [variables]);

  // Check if any value is dirty
  const isDirty = useMemo(() => {
    return Array.from(values.values()).some((v) => v.isDirty);
  }, [values]);

  // Check if any errors exist
  const hasErrors = useMemo(() => {
    return errors.size > 0;
  }, [errors]);

  // Get value by name
  const getValue = (name: string): any => {
    const variableValue = values.get(name);
    return variableValue?.value;
  };

  return {
    variables,
    requiredVariables,
    optionalVariables,
    values,
    errors,
    getValue,
    setValue,
    validate: validateVariable,
    validateAll,
    resetVariable,
    reset: resetAll,
    isDirty,
    hasErrors,
    isEditing,
    setEditMode,
    focusedVariable,
    setFocusedVariable,
    getValuesRecord,
    getMissingRequired,
    isValidating,
    templateId: templateId || storeTemplateId,
  };
}
