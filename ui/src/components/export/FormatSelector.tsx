/**
 * Format Selector Component
 *
 * UI for selecting export format with radio buttons and descriptions.
 *
 * @module components/export/FormatSelector
 * @version 1.0.0
 * @author Export System Engineer (Wave 3, Agent 1)
 */

import React from 'react';
import { ExportFormat } from '@/../../src/lib/export/template-export';
import {
  getFormatDisplayName,
  getFormatDescription,
  getFormatIcon,
} from '../../lib/export/formatters';

export interface FormatSelectorProps {
  /** Current selected format */
  selectedFormat: ExportFormat;
  /** Callback when format changes */
  onFormatChange: (format: ExportFormat) => void;
  /** Available formats (defaults to all) */
  availableFormats?: ExportFormat[];
  /** Show format descriptions */
  showDescriptions?: boolean;
}

/**
 * Format Selector Component
 *
 * Radio button selector for export formats with icons and descriptions.
 *
 * @param props - Component props
 */
export const FormatSelector: React.FC<FormatSelectorProps> = ({
  selectedFormat,
  onFormatChange,
  availableFormats = [
    ExportFormat.YAML,
    ExportFormat.JSON,
    ExportFormat.MARKDOWN,
    ExportFormat.CANVAS,
  ],
  showDescriptions = true,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: '#374151',
          marginBottom: 4,
        }}
      >
        Export Format
      </label>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {availableFormats.map((format) => (
          <FormatOption
            key={format}
            format={format}
            selected={selectedFormat === format}
            onSelect={() => onFormatChange(format)}
            showDescription={showDescriptions}
          />
        ))}
      </div>
    </div>
  );
};

interface FormatOptionProps {
  format: ExportFormat;
  selected: boolean;
  onSelect: () => void;
  showDescription: boolean;
}

const FormatOption: React.FC<FormatOptionProps> = ({
  format,
  selected,
  onSelect,
  showDescription,
}) => {
  const displayName = getFormatDisplayName(format);
  const description = getFormatDescription(format);
  const icon = getFormatIcon(format);

  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        padding: 12,
        border: `2px solid ${selected ? '#3b82f6' : '#e5e7eb'}`,
        borderRadius: 8,
        backgroundColor: selected ? '#eff6ff' : 'white',
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => {
        if (!selected) {
          e.currentTarget.style.borderColor = '#d1d5db';
          e.currentTarget.style.backgroundColor = '#f9fafb';
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          e.currentTarget.style.borderColor = '#e5e7eb';
          e.currentTarget.style.backgroundColor = 'white';
        }
      }}
    >
      <input
        type="radio"
        checked={selected}
        onChange={onSelect}
        style={{
          marginTop: 2,
          marginRight: 12,
          cursor: 'pointer',
          accentColor: '#3b82f6',
        }}
      />

      <div style={{ flex: 1 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: showDescription ? 4 : 0,
          }}
        >
          <span style={{ fontSize: 18 }}>{icon}</span>
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: selected ? '#1d4ed8' : '#374151',
            }}
          >
            {displayName}
          </span>
        </div>

        {showDescription && (
          <p
            style={{
              fontSize: 12,
              color: '#6b7280',
              margin: 0,
              lineHeight: 1.4,
            }}
          >
            {description}
          </p>
        )}
      </div>
    </label>
  );
};
