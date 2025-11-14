/**
 * Object/JSON Input Component
 *
 * JSON editor (textarea) for object-type variables.
 *
 * @module components/variables/inputs/ObjectInput
 * @version 1.0.0
 * @author Variable Panel Engineer (Agent 4) - Wave 2
 */

import React, { useState, useEffect } from 'react';

export interface ObjectInputProps {
  value: Record<string, any> | null;
  onChange: (value: Record<string, any>) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
}

export function ObjectInput({
  value,
  onChange,
  placeholder = '{ "key": "value" }',
  disabled = false,
  error = false,
}: ObjectInputProps): JSX.Element {
  // Convert object to JSON string
  const [textValue, setTextValue] = useState(() => {
    try {
      return value ? JSON.stringify(value, null, 2) : '';
    } catch {
      return '';
    }
  });

  const [parseError, setParseError] = useState<string | null>(null);

  // Update text when value prop changes
  useEffect(() => {
    try {
      const newText = value ? JSON.stringify(value, null, 2) : '';
      setTextValue(newText);
      setParseError(null);
    } catch (err) {
      setParseError('Invalid JSON object');
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setTextValue(text);

    // Try to parse JSON
    if (text.trim() === '') {
      setParseError(null);
      onChange({});
      return;
    }

    try {
      const parsed = JSON.parse(text);
      if (typeof parsed === 'object' && !Array.isArray(parsed)) {
        setParseError(null);
        onChange(parsed);
      } else {
        setParseError('Must be a JSON object');
      }
    } catch (err) {
      setParseError('Invalid JSON syntax');
    }
  };

  return (
    <div>
      <textarea
        value={textValue}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        rows={6}
        style={{
          width: '100%',
          padding: '8px 12px',
          fontSize: '13px',
          border: `1px solid ${error || parseError ? '#ef4444' : '#d1d5db'}`,
          borderRadius: '6px',
          outline: 'none',
          backgroundColor: disabled ? '#f9fafb' : 'white',
          color: disabled ? '#9ca3af' : '#111827',
          fontFamily: 'monospace',
          resize: 'vertical',
          transition: 'border-color 0.2s',
        }}
        onFocus={(e) => {
          if (!error && !parseError) {
            e.target.style.borderColor = '#3b82f6';
          }
        }}
        onBlur={(e) => {
          if (!error && !parseError) {
            e.target.style.borderColor = '#d1d5db';
          }
        }}
      />
      {parseError && (
        <div
          style={{
            marginTop: '4px',
            fontSize: '12px',
            color: '#ef4444',
          }}
        >
          {parseError}
        </div>
      )}
    </div>
  );
}
