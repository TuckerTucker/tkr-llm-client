/**
 * String Input Component
 *
 * Input component for string-type variables.
 *
 * @module components/variables/inputs/StringInput
 * @version 1.0.0
 * @author Variable Panel Engineer (Agent 4) - Wave 2
 */

import React from 'react';

export interface StringInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
}

export function StringInput({
  value,
  onChange,
  placeholder,
  disabled = false,
  error = false,
}: StringInputProps): JSX.Element {
  return (
    <input
      type="text"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      style={{
        width: '100%',
        padding: '8px 12px',
        fontSize: '14px',
        border: `1px solid ${error ? '#ef4444' : '#d1d5db'}`,
        borderRadius: '6px',
        outline: 'none',
        backgroundColor: disabled ? '#f9fafb' : 'white',
        color: disabled ? '#9ca3af' : '#111827',
        transition: 'border-color 0.2s',
      }}
      onFocus={(e) => {
        if (!error) {
          e.target.style.borderColor = '#3b82f6';
        }
      }}
      onBlur={(e) => {
        if (!error) {
          e.target.style.borderColor = '#d1d5db';
        }
      }}
    />
  );
}
