/**
 * Array Input Component
 *
 * Multi-line textarea input for array-type variables.
 *
 * @module components/variables/inputs/ArrayInput
 * @version 1.0.0
 * @author Variable Panel Engineer (Agent 4) - Wave 2
 */

import React from 'react';

export interface ArrayInputProps {
  value: string[] | any[];
  onChange: (value: any[]) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
}

export function ArrayInput({
  value,
  onChange,
  placeholder = 'One item per line',
  disabled = false,
  error = false,
}: ArrayInputProps): JSX.Element {
  // Convert array to string (one item per line)
  const textValue = Array.isArray(value) ? value.join('\n') : '';

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    // Split by newlines, filter empty lines
    const items = text.split('\n').filter((line) => line.trim() !== '');
    onChange(items);
  };

  return (
    <textarea
      value={textValue}
      onChange={handleChange}
      placeholder={placeholder}
      disabled={disabled}
      rows={4}
      style={{
        width: '100%',
        padding: '8px 12px',
        fontSize: '14px',
        border: `1px solid ${error ? '#ef4444' : '#d1d5db'}`,
        borderRadius: '6px',
        outline: 'none',
        backgroundColor: disabled ? '#f9fafb' : 'white',
        color: disabled ? '#9ca3af' : '#111827',
        fontFamily: 'monospace',
        resize: 'vertical',
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
