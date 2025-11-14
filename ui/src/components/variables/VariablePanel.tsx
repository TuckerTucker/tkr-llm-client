/**
 * Variable Panel Component
 *
 * Left sidebar panel for displaying and editing template variables.
 *
 * @module components/variables/VariablePanel
 * @version 1.0.0
 * @author Variable Panel Engineer (Agent 4) - Wave 2
 */

import React, { useMemo } from 'react';
import { useVariables } from '../../hooks/useVariables';
import { VariableInput } from './VariableInput';

export interface VariablePanelProps {
  /** Template ID */
  templateId: string;

  /** Template name for display */
  templateName?: string;

  /** Close handler */
  onClose?: () => void;
}

/**
 * Variable editing panel component
 */
export function VariablePanel({
  templateId,
  templateName,
  onClose,
}: VariablePanelProps): JSX.Element {
  const {
    requiredVariables,
    optionalVariables,
    values,
    errors,
    getValue,
    setValue,
    validateAll,
    reset,
    isDirty,
    hasErrors,
  } = useVariables(templateId);

  // Count total errors
  const errorCount = errors.size;

  // Get error messages
  const errorMessages = useMemo(() => {
    return Array.from(errors.entries()).map(([name, message]) => ({
      name,
      message,
    }));
  }, [errors]);

  const handleSave = () => {
    const isValid = validateAll();
    if (isValid) {
      alert('Variables saved successfully!');
    } else {
      alert('Please fix validation errors before saving');
    }
  };

  const handleReset = () => {
    if (confirm('Reset all variables to their default values?')) {
      reset();
    }
  };

  return (
    <div
      style={{
        width: '350px',
        height: '100%',
        backgroundColor: 'white',
        borderRight: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '4px',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: 600,
              color: '#111827',
            }}
          >
            Variables: {templateName || templateId}
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                padding: '4px 8px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: '18px',
                color: '#6b7280',
                lineHeight: 1,
              }}
              title="Close panel"
            >
              ✕
            </button>
          )}
        </div>
        <div style={{ fontSize: '13px', color: '#6b7280' }}>
          {requiredVariables.length + optionalVariables.length} variables
          {isDirty && ' • Modified'}
        </div>
      </div>

      {/* Variables Form */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '16px',
        }}
      >
        {/* Required Variables */}
        {requiredVariables.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h3
              style={{
                margin: '0 0 12px 0',
                fontSize: '14px',
                fontWeight: 600,
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Required Variables
            </h3>
            {requiredVariables.map((variable) => (
              <VariableInput
                key={variable.name}
                definition={variable}
                value={getValue(variable.name)}
                error={errors.get(variable.name)}
                onChange={(value) => setValue(variable.name, value)}
              />
            ))}
          </div>
        )}

        {/* Optional Variables */}
        {optionalVariables.length > 0 && (
          <div>
            <h3
              style={{
                margin: '0 0 12px 0',
                fontSize: '14px',
                fontWeight: 600,
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Optional Variables
            </h3>
            {optionalVariables.map((variable) => (
              <VariableInput
                key={variable.name}
                definition={variable}
                value={getValue(variable.name)}
                error={errors.get(variable.name)}
                onChange={(value) => setValue(variable.name, value)}
              />
            ))}
          </div>
        )}

        {/* No variables message */}
        {requiredVariables.length === 0 && optionalVariables.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: '#9ca3af',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📝</div>
            <div style={{ fontSize: '14px' }}>
              No variables defined for this template
            </div>
          </div>
        )}
      </div>

      {/* Validation Summary */}
      {hasErrors && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: '#fef2f2',
            borderTop: '1px solid #fecaca',
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          <div
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: '#991b1b',
              marginBottom: '8px',
            }}
          >
            Validation: {errorCount} {errorCount === 1 ? 'error' : 'errors'}
          </div>
          <div style={{ fontSize: '12px', color: '#7f1d1d' }}>
            {errorMessages.slice(0, 3).map((err, idx) => (
              <div
                key={idx}
                style={{
                  marginBottom: '4px',
                  display: 'flex',
                  gap: '4px',
                }}
              >
                <span>⚠</span>
                <span>{err.message}</span>
              </div>
            ))}
            {errorCount > 3 && (
              <div style={{ marginTop: '4px', fontStyle: 'italic' }}>
                ... and {errorCount - 3} more
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div
        style={{
          padding: '16px',
          borderTop: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb',
          display: 'flex',
          gap: '12px',
        }}
      >
        <button
          onClick={handleReset}
          disabled={!isDirty}
          style={{
            flex: 1,
            padding: '10px 16px',
            fontSize: '14px',
            fontWeight: 500,
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            backgroundColor: 'white',
            color: '#374151',
            cursor: isDirty ? 'pointer' : 'not-allowed',
            opacity: isDirty ? 1 : 0.5,
          }}
        >
          Reset
        </button>
        <button
          onClick={handleSave}
          style={{
            flex: 1,
            padding: '10px 16px',
            fontSize: '14px',
            fontWeight: 500,
            border: 'none',
            borderRadius: '6px',
            backgroundColor: hasErrors ? '#9ca3af' : '#3b82f6',
            color: 'white',
            cursor: hasErrors ? 'not-allowed' : 'pointer',
          }}
        >
          Save
        </button>
      </div>
    </div>
  );
}
