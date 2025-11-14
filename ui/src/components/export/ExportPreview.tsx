/**
 * Export Preview Component
 *
 * Preview panel showing export content with syntax highlighting and line numbers.
 *
 * @module components/export/ExportPreview
 * @version 1.0.0
 * @author Export System Engineer (Wave 3, Agent 1)
 */

import React from 'react';
import { ExportFormat } from '@/../../src/lib/export/template-export';
import { truncateForPreview } from '../../lib/export/formatters';

export interface ExportPreviewProps {
  /** Content to preview */
  content: string;
  /** Export format */
  format: ExportFormat;
  /** Maximum lines to show */
  maxLines?: number;
  /** Show line numbers */
  showLineNumbers?: boolean;
  /** Loading state */
  isLoading?: boolean;
}

/**
 * Export Preview Component
 *
 * Displays preview of export content with optional line numbers.
 *
 * @param props - Component props
 */
export const ExportPreview: React.FC<ExportPreviewProps> = ({
  content,
  format,
  maxLines = 50,
  showLineNumbers = true,
  isLoading = false,
}) => {
  const displayContent = React.useMemo(
    () => truncateForPreview(content, maxLines),
    [content, maxLines]
  );

  const lines = displayContent.split('\n');
  const isTruncated = content.split('\n').length > maxLines;

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 400,
          backgroundColor: '#f9fafb',
          borderRadius: 8,
          border: '1px solid #e5e7eb',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 40,
              height: 40,
              border: '3px solid #e5e7eb',
              borderTopColor: '#3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 12px',
            }}
          />
          <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
            Generating preview...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <label
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#374151',
          }}
        >
          Preview
        </label>

        <div style={{ fontSize: 12, color: '#6b7280' }}>
          {lines.length} lines {isTruncated && '(truncated)'}
        </div>
      </div>

      <div
        style={{
          backgroundColor: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          overflow: 'auto',
          maxHeight: 400,
        }}
      >
        <pre
          style={{
            margin: 0,
            padding: 16,
            fontSize: 12,
            fontFamily: "'Monaco', 'Menlo', 'Courier New', monospace",
            lineHeight: 1.6,
            color: '#374151',
            overflow: 'auto',
          }}
        >
          {showLineNumbers ? (
            <LineNumberedContent lines={lines} />
          ) : (
            displayContent
          )}
        </pre>
      </div>

      {isTruncated && (
        <p
          style={{
            fontSize: 12,
            color: '#9ca3af',
            margin: 0,
            fontStyle: 'italic',
          }}
        >
          Preview limited to {maxLines} lines. Download to see full content.
        </p>
      )}
    </div>
  );
};

interface LineNumberedContentProps {
  lines: string[];
}

const LineNumberedContent: React.FC<LineNumberedContentProps> = ({ lines }) => {
  const maxLineNumber = lines.length;
  const lineNumberWidth = String(maxLineNumber).length;

  return (
    <>
      {lines.map((line, index) => (
        <div
          key={index}
          style={{
            display: 'flex',
            gap: 16,
          }}
        >
          <span
            style={{
              color: '#9ca3af',
              userSelect: 'none',
              minWidth: `${lineNumberWidth}ch`,
              textAlign: 'right',
            }}
          >
            {index + 1}
          </span>
          <span style={{ flex: 1, whiteSpace: 'pre' }}>{line || ' '}</span>
        </div>
      ))}
    </>
  );
};
