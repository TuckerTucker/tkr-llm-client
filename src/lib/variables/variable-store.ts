/**
 * Variable Store
 *
 * Zustand store for managing template variables, validation, and UI state.
 *
 * @module lib/variables/variable-store
 * @version 1.0.0
 * @author Variable System Engineer (Agent 4) - Wave 3
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  VariableState,
  VariableDefinition,
  VariableValue,
  ExtractedVariable,
} from './types';
import { validateVariableValue } from './validation';

/**
 * Create a variable value object
 */
function createVariableValue(
  name: string,
  value: any,
  isValid: boolean,
  error?: string
): VariableValue {
  return {
    name,
    value,
    isValid,
    error,
    isDirty: false,
    lastModified: Date.now(),
  };
}

/**
 * Variable store
 */
export const useVariableStore = create<VariableState>()(
  persist(
    (set, get) => ({
      // ========================================
      // State
      // ========================================

      templateId: null,
      definitions: new Map(),
      values: new Map(),
      isEditing: false,
      focusedVariable: null,
      errors: new Map(),
      isValidating: false,
      extractedVariables: [],

      // ========================================
      // Actions
      // ========================================

      setTemplate: (templateId: string, definitions: VariableDefinition[]) => {
        const definitionsMap = new Map<string, VariableDefinition>();
        const valuesMap = new Map<string, VariableValue>();

        // Build definitions map and initialize values
        definitions.forEach((def) => {
          definitionsMap.set(def.name, def);

          // Initialize with default value or undefined
          const initialValue = def.defaultValue !== undefined ? def.defaultValue : '';
          const validationResult = validateVariableValue(initialValue, def);

          valuesMap.set(
            def.name,
            createVariableValue(def.name, initialValue, validationResult.valid, validationResult.error)
          );
        });

        set({
          templateId,
          definitions: definitionsMap,
          values: valuesMap,
          errors: new Map(),
          extractedVariables: [],
        });
      },

      setValue: (name: string, value: any) => {
        const state = get();
        const definition = state.definitions.get(name);

        if (!definition) {
          console.warn(`Variable definition not found: ${name}`);
          return;
        }

        // Validate the new value
        const validationResult = validateVariableValue(value, definition);

        // Update value
        const newValues = new Map(state.values);
        const existingValue = newValues.get(name);
        const isDirty = existingValue ? value !== definition.defaultValue : true;

        newValues.set(name, {
          name,
          value,
          isValid: validationResult.valid,
          error: validationResult.error,
          isDirty,
          lastModified: Date.now(),
        });

        // Update errors map
        const newErrors = new Map(state.errors);
        if (validationResult.error) {
          newErrors.set(name, validationResult.error);
        } else {
          newErrors.delete(name);
        }

        set({ values: newValues, errors: newErrors });
      },

      setValues: (values: Record<string, any>) => {
        const state = get();
        const newValues = new Map(state.values);
        const newErrors = new Map<string, string>();

        Object.entries(values).forEach(([name, value]) => {
          const definition = state.definitions.get(name);
          if (!definition) return;

          const validationResult = validateVariableValue(value, definition);
          const isDirty = value !== definition.defaultValue;

          newValues.set(name, {
            name,
            value,
            isValid: validationResult.valid,
            error: validationResult.error,
            isDirty,
            lastModified: Date.now(),
          });

          if (validationResult.error) {
            newErrors.set(name, validationResult.error);
          }
        });

        set({ values: newValues, errors: newErrors });
      },

      validateVariable: (name: string) => {
        const state = get();
        const definition = state.definitions.get(name);
        const variableValue = state.values.get(name);

        if (!definition || !variableValue) {
          return false;
        }

        const validationResult = validateVariableValue(variableValue.value, definition);

        // Update value with validation result
        const newValues = new Map(state.values);
        newValues.set(name, {
          ...variableValue,
          isValid: validationResult.valid,
          error: validationResult.error,
          lastModified: Date.now(),
        });

        // Update errors map
        const newErrors = new Map(state.errors);
        if (validationResult.error) {
          newErrors.set(name, validationResult.error);
        } else {
          newErrors.delete(name);
        }

        set({ values: newValues, errors: newErrors });

        return validationResult.valid;
      },

      validateAll: () => {
        const state = get();
        set({ isValidating: true });

        const newValues = new Map(state.values);
        const newErrors = new Map<string, string>();
        let allValid = true;

        state.definitions.forEach((definition, name) => {
          const variableValue = state.values.get(name);
          if (!variableValue) return;

          const validationResult = validateVariableValue(variableValue.value, definition);

          newValues.set(name, {
            ...variableValue,
            isValid: validationResult.valid,
            error: validationResult.error,
            lastModified: Date.now(),
          });

          if (validationResult.error) {
            newErrors.set(name, validationResult.error);
            allValid = false;
          }
        });

        set({ values: newValues, errors: newErrors, isValidating: false });

        return allValid;
      },

      resetVariable: (name: string) => {
        const state = get();
        const definition = state.definitions.get(name);

        if (!definition) return;

        const defaultValue = definition.defaultValue !== undefined ? definition.defaultValue : '';
        const validationResult = validateVariableValue(defaultValue, definition);

        const newValues = new Map(state.values);
        newValues.set(name, {
          name,
          value: defaultValue,
          isValid: validationResult.valid,
          error: validationResult.error,
          isDirty: false,
          lastModified: Date.now(),
        });

        const newErrors = new Map(state.errors);
        newErrors.delete(name);

        set({ values: newValues, errors: newErrors });
      },

      resetAll: () => {
        const state = get();
        const newValues = new Map<string, VariableValue>();
        const newErrors = new Map<string, string>();

        state.definitions.forEach((definition, name) => {
          const defaultValue = definition.defaultValue !== undefined ? definition.defaultValue : '';
          const validationResult = validateVariableValue(defaultValue, definition);

          newValues.set(name, {
            name,
            value: defaultValue,
            isValid: validationResult.valid,
            error: validationResult.error,
            isDirty: false,
            lastModified: Date.now(),
          });
        });

        set({ values: newValues, errors: newErrors });
      },

      setEditMode: (isEditing: boolean) => {
        set({ isEditing });
      },

      setFocusedVariable: (name: string | null) => {
        set({ focusedVariable: name });
      },

      addDefinition: (definition: VariableDefinition) => {
        const state = get();
        const newDefinitions = new Map(state.definitions);
        newDefinitions.set(definition.name, definition);

        // Initialize value
        const initialValue = definition.defaultValue !== undefined ? definition.defaultValue : '';
        const validationResult = validateVariableValue(initialValue, definition);

        const newValues = new Map(state.values);
        newValues.set(
          definition.name,
          createVariableValue(definition.name, initialValue, validationResult.valid, validationResult.error)
        );

        set({ definitions: newDefinitions, values: newValues });
      },

      removeDefinition: (name: string) => {
        const state = get();
        const newDefinitions = new Map(state.definitions);
        const newValues = new Map(state.values);
        const newErrors = new Map(state.errors);

        newDefinitions.delete(name);
        newValues.delete(name);
        newErrors.delete(name);

        set({ definitions: newDefinitions, values: newValues, errors: newErrors });
      },

      updateDefinition: (name: string, updates: Partial<VariableDefinition>) => {
        const state = get();
        const definition = state.definitions.get(name);

        if (!definition) return;

        const newDefinitions = new Map(state.definitions);
        newDefinitions.set(name, { ...definition, ...updates });

        // Re-validate with updated definition
        const variableValue = state.values.get(name);
        if (variableValue) {
          const updatedDef = newDefinitions.get(name)!;
          const validationResult = validateVariableValue(variableValue.value, updatedDef);

          const newValues = new Map(state.values);
          newValues.set(name, {
            ...variableValue,
            isValid: validationResult.valid,
            error: validationResult.error,
            lastModified: Date.now(),
          });

          const newErrors = new Map(state.errors);
          if (validationResult.error) {
            newErrors.set(name, validationResult.error);
          } else {
            newErrors.delete(name);
          }

          set({ definitions: newDefinitions, values: newValues, errors: newErrors });
        } else {
          set({ definitions: newDefinitions });
        }
      },

      setExtractedVariables: (variables: ExtractedVariable[]) => {
        set({ extractedVariables: variables });
      },

      getValuesRecord: () => {
        const state = get();
        const record: Record<string, any> = {};

        state.values.forEach((variableValue, name) => {
          record[name] = variableValue.value;
        });

        return record;
      },

      getMissingRequired: () => {
        const state = get();
        const missing: string[] = [];

        state.definitions.forEach((definition, name) => {
          if (definition.required) {
            const variableValue = state.values.get(name);
            if (!variableValue || !variableValue.value || variableValue.value === '') {
              missing.push(name);
            }
          }
        });

        return missing;
      },

      clear: () => {
        set({
          templateId: null,
          definitions: new Map(),
          values: new Map(),
          isEditing: false,
          focusedVariable: null,
          errors: new Map(),
          isValidating: false,
          extractedVariables: [],
        });
      },
    }),
    {
      name: 'variable-store',
      partialize: (state) => ({
        templateId: state.templateId,
        values: Array.from(state.values.entries()),
      }),
      // Custom storage to handle Map serialization
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;

          const { state } = JSON.parse(str);
          if (state.values) {
            state.values = new Map(state.values);
          }
          return { state };
        },
        setItem: (name, value) => {
          const { state } = value;
          const serializedState = {
            ...state,
            values: state.values ? Array.from(state.values.entries()) : [],
          };
          localStorage.setItem(name, JSON.stringify({ state: serializedState }));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);
