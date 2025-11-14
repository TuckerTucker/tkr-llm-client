/**
 * Boolean Input Component
 *
 * Checkbox/toggle input component for boolean-type variables.
 *
 * @module components/variables/inputs/BooleanInput
 * @version 1.0.0
 * @author Variable Panel Engineer (Agent 4) - Wave 2
 */

import React from 'react';

export interface BooleanInputProps {
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  label?: string;
}

export function BooleanInput({
  value,
  onChange,
  disabled = false,
  label = 'Enabled',
}: BooleanInputProps): JSX.Element {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        userSelect: 'none',
      }}
    >
      <input
        type="checkbox"
        checked={value || false}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        style={{
          width: '18px',
          height: '18px',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      />
      <span
        style={{
          fontSize: '14px',
          color: disabled ? '#9ca3af' : '#374151',
        }}
      >
        {label}
      </span>
    </label>
  );
}
