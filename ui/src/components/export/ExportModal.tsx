/**
 * Export Modal Component
 *
 * Modal dialog for exporting templates and canvas state in multiple formats.
 * Provides format selection, preview, and export options.
 *
 * @module components/export/ExportModal
 * @version 1.0.0
 * @author Export System Engineer (Wave 3, Agent 1)
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { Node, Edge } from 'reactflow';
import type { AgentTemplate } from '@/../../src/templates/types';
import { ExportFormat } from '@/../../src/lib/export/template-export';
import { useExport, type UseExportResult } from '../../hooks/useExport';
import { FormatSelector } from './FormatSelector';
import { ExportPreview } from './ExportPreview';
import { formatFileSize } from '../../hooks/useExport';

export interface ExportModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Callback to close modal */
  onClose: () => void;
  /** Template to export (if applicable) */
  template?: AgentTemplate | null;
  /** Nodes to export as canvas state */
  nodes?: Node[];
  /** Edges to export as canvas state */
  edges?: Edge[];
  /** Export mode */
  mode?: 'template' | 'canvas';
}

/**
 * Export Modal Component
 *
 * Full-featured export dialog with format selection, preview, and download.
 *
 * @param props - Component props
 */
export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  template,
  nodes = [],
  edges = [],
  mode = 'template',
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>(ExportFormat.YAML);
  const [exportResult, setExportResult] = useState<UseExportResult | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const {
    exportTemplate,
    exportCanvas,
    downloadExport,
    copyToClipboard,
    isExporting,
    error,
    clearError,
  } = useExport();

  // Generate preview when format changes
  useEffect(() => {
    if (!isOpen) return;

    const generatePreview = async () => {
      try {
        let result: UseExportResult;

        if (mode === 'template' && template) {
          result = await exportTemplate(template, selectedFormat);
        } else if (mode === 'canvas') {
          result = await exportCanvas(nodes, edges, selectedFormat);
        } else {
          return;
        }

        setExportResult(result);
      } catch (err) {
        console.error('Failed to generate preview:', err);
      }
    };

    generatePreview();
  }, [isOpen, selectedFormat, mode, template, nodes, edges, exportTemplate, exportCanvas]);

  // Reset copy success message after 2 seconds
  useEffect(() => {
    if (copySuccess) {
      const timer = setTimeout(() => setCopySuccess(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copySuccess]);

  // Handle download
  const handleDownload = useCallback(() => {
    if (exportResult) {
      downloadExport(exportResult);
    }
  }, [exportResult, downloadExport]);

  // Handle copy to clipboard
  const handleCopy = useCallback(async () => {
    if (exportResult) {
      try {
        await copyToClipboard(exportResult);
        setCopySuccess(true);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  }, [exportResult, copyToClipboard]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const availableFormats =
    mode === 'canvas'
      ? [ExportFormat.JSON, ExportFormat.YAML]
      : [ExportFormat.YAML, ExportFormat.JSON, ExportFormat.MARKDOWN];

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onClick={onClose}
      >
        {/* Modal */}
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: 12,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            width: '90%',
            maxWidth: 800,
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              padding: '20px 24px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: '#111827' }}>
                Export {mode === 'template' ? 'Template' : 'Canvas State'}
              </h2>
              {template && (
                <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0 0' }}>
                  {template.metadata.name} v{template.metadata.version}
                </p>
              )}
              {mode === 'canvas' && (
                <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0 0' }}>
                  {nodes.length} nodes, {edges.length} edges
                </p>
              )}
            </div>

            <button
              onClick={onClose}
              style={{
                border: 'none',
                background: 'none',
                fontSize: 24,
                color: '#9ca3af',
                cursor: 'pointer',
                padding: 4,
                lineHeight: 1,
              }}
              title="Close (ESC)"
              aria-label="Close modal"
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div
            style={{
              padding: 24,
              overflow: 'auto',
              flex: 1,
            }}
          >
            {error && (
              <div
                style={{
                  padding: 12,
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: 8,
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ fontSize: 14, color: '#dc2626' }}>{error}</span>
                <button
                  onClick={clearError}
                  style={{
                    border: 'none',
                    background: 'none',
                    color: '#dc2626',
                    cursor: 'pointer',
                    fontSize: 18,
                    padding: 0,
                  }}
                >
                  ×
                </button>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Format Selector */}
              <FormatSelector
                selectedFormat={selectedFormat}
                onFormatChange={setSelectedFormat}
                availableFormats={availableFormats}
                showDescriptions={true}
              />

              {/* Preview */}
              {exportResult && (
                <>
                  <ExportPreview
                    content={exportResult.content}
                    format={selectedFormat}
                    maxLines={50}
                    showLineNumbers={true}
                    isLoading={isExporting}
                  />

                  {/* File Info */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      padding: 12,
                      backgroundColor: '#f9fafb',
                      borderRadius: 8,
                      fontSize: 13,
                      color: '#6b7280',
                    }}
                  >
                    <div>
                      <strong>Filename:</strong> {exportResult.filename}
                    </div>
                    <div>
                      <strong>Size:</strong> {(exportResult.size / 1024).toFixed(1)} KB
                    </div>
                    <div>
                      <strong>Type:</strong> {exportResult.mimeType}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '16px 24px',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 12,
            }}
          >
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px',
                border: '1px solid #d1d5db',
                borderRadius: 6,
                backgroundColor: 'white',
                color: '#374151',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>

            <button
              onClick={handleCopy}
              disabled={!exportResult || isExporting}
              style={{
                padding: '8px 16px',
                border: '1px solid #d1d5db',
                borderRadius: 6,
                backgroundColor: copySuccess ? '#10b981' : 'white',
                color: copySuccess ? 'white' : '#374151',
                fontSize: 14,
                fontWeight: 500,
                cursor: exportResult && !isExporting ? 'pointer' : 'not-allowed',
                opacity: exportResult && !isExporting ? 1 : 0.5,
                transition: 'all 0.15s',
              }}
            >
              {copySuccess ? '✓ Copied!' : 'Copy to Clipboard'}
            </button>

            <button
              onClick={handleDownload}
              disabled={!exportResult || isExporting}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: 6,
                backgroundColor: exportResult && !isExporting ? '#3b82f6' : '#9ca3af',
                color: 'white',
                fontSize: 14,
                fontWeight: 500,
                cursor: exportResult && !isExporting ? 'pointer' : 'not-allowed',
              }}
            >
              Download
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
