/**
 * File Path Input Component
 *
 * Text input with file picker button for file path variables.
 *
 * @module components/variables/inputs/FilePathInput
 * @version 1.0.0
 * @author Variable Panel Engineer (Agent 4) - Wave 2
 */

import React from 'react';

export interface FilePathInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
}

export function FilePathInput({
  value,
  onChange,
  placeholder = '/path/to/file',
  disabled = false,
  error = false,
}: FilePathInputProps): JSX.Element {
  const handleFileSelect = () => {
    // In a real implementation, this would open a file picker dialog
    // For now, we'll just show an alert
    alert('File picker not yet implemented. Please type the path manually.');
  };

  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          flex: 1,
          padding: '8px 12px',
          fontSize: '13px',
          border: `1px solid ${error ? '#ef4444' : '#d1d5db'}`,
          borderRadius: '6px',
          outline: 'none',
          backgroundColor: disabled ? '#f9fafb' : 'white',
          color: disabled ? '#9ca3af' : '#111827',
          fontFamily: 'monospace',
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
      <button
        type="button"
        onClick={handleFileSelect}
        disabled={disabled}
        style={{
          padding: '8px 12px',
          fontSize: '14px',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          backgroundColor: disabled ? '#f9fafb' : 'white',
          color: disabled ? '#9ca3af' : '#374151',
          cursor: disabled ? 'not-allowed' : 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        Browse...
      </button>
    </div>
  );
}
