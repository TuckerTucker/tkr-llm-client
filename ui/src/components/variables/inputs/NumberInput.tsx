/**
 * Number Input Component
 *
 * Input component for number-type variables with min/max support.
 *
 * @module components/variables/inputs/NumberInput
 * @version 1.0.0
 * @author Variable Panel Engineer (Agent 4) - Wave 2
 */

import React from 'react';

export interface NumberInputProps {
  value: number | null;
  onChange: (value: number) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  min?: number;
  max?: number;
  step?: number;
}

export function NumberInput({
  value,
  onChange,
  placeholder,
  disabled = false,
  error = false,
  min,
  max,
  step = 1,
}: NumberInputProps): JSX.Element {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      onChange(0);
    } else {
      const num = parseFloat(val);
      if (!isNaN(num)) {
        onChange(num);
      }
    }
  };

  return (
    <input
      type="number"
      value={value ?? ''}
      onChange={handleChange}
      placeholder={placeholder}
      disabled={disabled}
      min={min}
      max={max}
      step={step}
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
