/**
 * Export Format Utilities
 *
 * Formatting utilities for different export formats.
 * Provides syntax highlighting and preview formatting.
 *
 * @module lib/export/formatters
 * @version 1.0.0
 * @author Export System Engineer (Wave 3, Agent 1)
 */

import { ExportFormat } from '@/../../src/lib/export/template-export';

/**
 * Get file extension for format
 */
export function getFileExtension(format: ExportFormat): string {
  switch (format) {
    case ExportFormat.YAML:
      return 'yaml';
    case ExportFormat.JSON:
      return 'json';
    case ExportFormat.MARKDOWN:
      return 'md';
    case ExportFormat.CANVAS:
      return 'json';
    default:
      return 'txt';
  }
}

/**
 * Get MIME type for format
 */
export function getMimeType(format: ExportFormat): string {
  switch (format) {
    case ExportFormat.YAML:
      return 'application/x-yaml';
    case ExportFormat.JSON:
    case ExportFormat.CANVAS:
      return 'application/json';
    case ExportFormat.MARKDOWN:
      return 'text/markdown';
    default:
      return 'text/plain';
  }
}

/**
 * Get display name for format
 */
export function getFormatDisplayName(format: ExportFormat): string {
  switch (format) {
    case ExportFormat.YAML:
      return 'YAML';
    case ExportFormat.JSON:
      return 'JSON';
    case ExportFormat.MARKDOWN:
      return 'Markdown';
    case ExportFormat.CANVAS:
      return 'Canvas State';
    default:
      return 'Unknown';
  }
}

/**
 * Get format description
 */
export function getFormatDescription(format: ExportFormat): string {
  switch (format) {
    case ExportFormat.YAML:
      return 'Human-readable YAML format with comments';
    case ExportFormat.JSON:
      return 'Machine-readable JSON format';
    case ExportFormat.MARKDOWN:
      return 'Documentation-style Markdown format';
    case ExportFormat.CANVAS:
      return 'Canvas layout state for restoration';
    default:
      return '';
  }
}

/**
 * Get format icon (emoji)
 */
export function getFormatIcon(format: ExportFormat): string {
  switch (format) {
    case ExportFormat.YAML:
      return '📄';
    case ExportFormat.JSON:
      return '🔧';
    case ExportFormat.MARKDOWN:
      return '📝';
    case ExportFormat.CANVAS:
      return '🎨';
    default:
      return '📦';
  }
}

/**
 * Truncate content for preview
 */
export function truncateForPreview(content: string, maxLines: number = 50): string {
  const lines = content.split('\n');
  if (lines.length <= maxLines) {
    return content;
  }
  return lines.slice(0, maxLines).join('\n') + '\n\n... (truncated)';
}

/**
 * Format content for display (basic syntax highlighting classes)
 */
export function formatForDisplay(content: string, format: ExportFormat): string {
  // For now, just return content as-is
  // Could add basic syntax highlighting in the future
  return content;
}

/**
 * Validate export content
 */
export function validateExportContent(content: string, format: ExportFormat): boolean {
  try {
    switch (format) {
      case ExportFormat.JSON:
      case ExportFormat.CANVAS:
        JSON.parse(content);
        return true;
      case ExportFormat.YAML:
      case ExportFormat.MARKDOWN:
        return content.length > 0;
      default:
        return true;
    }
  } catch {
    return false;
  }
}
