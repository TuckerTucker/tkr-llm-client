/**
 * Variable Input Component
 *
 * Renders appropriate input based on variable type with validation display.
 *
 * @module components/variables/VariableInput
 * @version 1.0.0
 * @author Variable Panel Engineer (Agent 4) - Wave 2
 */

import React from 'react';
import { VariableType } from '@/../../src/lib/variables/types';
import type { VariableDefinition } from '@/../../src/lib/variables/types';
import {
  StringInput,
  NumberInput,
  BooleanInput,
  ArrayInput,
  ObjectInput,
  FilePathInput,
  UrlInput,
  EmailInput,
  DateInput,
} from './inputs';

export interface VariableInputProps {
  /** Variable definition */
  definition: VariableDefinition;

  /** Current value */
  value: any;

  /** Validation error message */
  error?: string;

  /** Change handler */
  onChange: (value: any) => void;

  /** Whether input is disabled */
  disabled?: boolean;
}

/**
 * Renders the appropriate input component based on variable type
 */
export function VariableInput({
  definition,
  value,
  error,
  onChange,
  disabled = false,
}: VariableInputProps): JSX.Element {
  const hasError = !!error;
  const isValid = !hasError && value !== undefined && value !== null && value !== '';

  // Render type-specific input
  const renderInput = () => {
    const commonProps = {
      disabled,
      error: hasError,
    };

    switch (definition.type) {
      case VariableType.STRING:
        return (
          <StringInput
            value={value || ''}
            onChange={onChange}
            placeholder={definition.placeholder}
            {...commonProps}
          />
        );

      case VariableType.NUMBER:
        return (
          <NumberInput
            value={value}
            onChange={onChange}
            placeholder={definition.placeholder}
            {...commonProps}
          />
        );

      case VariableType.BOOLEAN:
        return (
          <BooleanInput
            value={value || false}
            onChange={onChange}
            label={definition.label}
            disabled={disabled}
          />
        );

      case VariableType.ARRAY:
        return (
          <ArrayInput
            value={value || []}
            onChange={onChange}
            placeholder={definition.placeholder || 'One item per line'}
            {...commonProps}
          />
        );

      case VariableType.OBJECT:
      case VariableType.JSON:
        return (
          <ObjectInput
            value={value || null}
            onChange={onChange}
            placeholder={definition.placeholder || '{ "key": "value" }'}
            {...commonProps}
          />
        );

      case VariableType.FILE_PATH:
      case VariableType.DIRECTORY_PATH:
        return (
          <FilePathInput
            value={value || ''}
            onChange={onChange}
            placeholder={definition.placeholder || '/path/to/file'}
            {...commonProps}
          />
        );

      case VariableType.URL:
        return (
          <UrlInput
            value={value || ''}
            onChange={onChange}
            placeholder={definition.placeholder || 'https://example.com'}
            {...commonProps}
          />
        );

      case VariableType.EMAIL:
        return (
          <EmailInput
            value={value || ''}
            onChange={onChange}
            placeholder={definition.placeholder || 'user@example.com'}
            {...commonProps}
          />
        );

      case VariableType.DATE:
        return (
          <DateInput
            value={value || ''}
            onChange={onChange}
            {...commonProps}
          />
        );

      default:
        return (
          <StringInput
            value={value || ''}
            onChange={onChange}
            placeholder={definition.placeholder}
            {...commonProps}
          />
        );
    }
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      {/* Label */}
      <label
        style={{
          display: 'block',
          marginBottom: '6px',
          fontSize: '14px',
          fontWeight: 500,
          color: hasError ? '#ef4444' : '#374151',
        }}
      >
        {definition.label}
        {definition.required && (
          <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>
        )}
        {isValid && definition.required && (
          <span
            style={{
              marginLeft: '8px',
              color: '#10b981',
              fontSize: '16px',
            }}
          >
            ✓
          </span>
        )}
      </label>

      {/* Description */}
      {definition.description && (
        <div
          style={{
            marginBottom: '6px',
            fontSize: '13px',
            color: '#6b7280',
          }}
        >
          {definition.description}
        </div>
      )}

      {/* Input */}
      {renderInput()}

      {/* Error message */}
      {hasError && (
        <div
          style={{
            marginTop: '6px',
            fontSize: '13px',
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <span>⚠</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
