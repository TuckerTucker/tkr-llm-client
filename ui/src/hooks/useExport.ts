/**
 * Export Hook
 *
 * React hook for exporting templates and canvas state in multiple formats.
 * Integrates with backend export system and provides browser download functionality.
 *
 * @module hooks/useExport
 * @version 1.0.0
 * @author Export System Engineer (Wave 3, Agent 1)
 */

import { useState, useCallback } from 'react';
import type { Node, Edge } from 'reactflow';
import type { AgentTemplate } from '@/../../src/templates/types';
import {
  exportTemplate as backendExportTemplate,
  exportCanvas as backendExportCanvas,
  downloadExport as backendDownloadExport,
  copyExportToClipboard as backendCopyToClipboard,
  ExportFormat,
  type ExportOptions,
  type ExportResult,
} from '@/../../src/lib/export/template-export';

/**
 * Export format type (re-exported for convenience)
 */
export type { ExportFormat };
export { ExportFormat as ExportFormatEnum };

/**
 * Export result with additional metadata
 */
export interface UseExportResult extends ExportResult {
  /** File size in bytes */
  size: number;
  /** MIME type for the content */
  mimeType: string;
}

/**
 * Hook state
 */
interface ExportState {
  isExporting: boolean;
  error: string | null;
  lastExport: UseExportResult | null;
}

/**
 * Export hook for templates and canvas state
 *
 * @returns Export functions and state
 *
 * @example
 * ```tsx
 * const { exportTemplate, downloadExport, isExporting } = useExport();
 *
 * const handleExport = async () => {
 *   const result = await exportTemplate(template, ExportFormat.YAML);
 *   downloadExport(result);
 * };
 * ```
 */
export function useExport() {
  const [state, setState] = useState<ExportState>({
    isExporting: false,
    error: null,
    lastExport: null,
  });

  /**
   * Export a template to specified format
   */
  const exportTemplate = useCallback(
    async (
      template: AgentTemplate,
      format: ExportFormat,
      options?: Partial<ExportOptions>
    ): Promise<UseExportResult> => {
      setState((prev) => ({ ...prev, isExporting: true, error: null }));

      try {
        const exportOptions: ExportOptions = {
          format,
          includeMetadata: options?.includeMetadata ?? true,
          includeVariables: options?.includeVariables ?? false,
          prettyPrint: options?.prettyPrint ?? true,
          includeLayout: options?.includeLayout ?? false,
        };

        const result = backendExportTemplate(template, exportOptions);

        // Calculate size
        const size = new Blob([result.content]).size;

        // Warn if size is large
        if (size > 1024 * 1024) {
          console.warn(`Export size is large: ${(size / 1024 / 1024).toFixed(2)} MB`);
        }

        const enrichedResult: UseExportResult = {
          ...result,
          size,
          mimeType: result.contentType,
        };

        setState((prev) => ({
          ...prev,
          isExporting: false,
          lastExport: enrichedResult,
        }));

        return enrichedResult;
      } catch (error: any) {
        const errorMsg = error.message || 'Failed to export template';
        setState((prev) => ({
          ...prev,
          isExporting: false,
          error: errorMsg,
        }));
        throw new Error(errorMsg);
      }
    },
    []
  );

  /**
   * Export canvas state (nodes + edges)
   */
  const exportCanvas = useCallback(
    async (
      nodes: Node[],
      edges: Edge[],
      format: ExportFormat = ExportFormat.JSON,
      options?: Partial<ExportOptions>
    ): Promise<UseExportResult> => {
      setState((prev) => ({ ...prev, isExporting: true, error: null }));

      try {
        const exportOptions: ExportOptions = {
          format,
          prettyPrint: options?.prettyPrint ?? true,
          includeMetadata: options?.includeMetadata ?? true,
          includeVariables: options?.includeVariables ?? false,
          includeLayout: options?.includeLayout ?? true,
        };

        const result = backendExportCanvas(nodes, edges, exportOptions);

        // Calculate size
        const size = new Blob([result.content]).size;

        const enrichedResult: UseExportResult = {
          ...result,
          size,
          mimeType: result.contentType,
        };

        setState((prev) => ({
          ...prev,
          isExporting: false,
          lastExport: enrichedResult,
        }));

        return enrichedResult;
      } catch (error: any) {
        const errorMsg = error.message || 'Failed to export canvas';
        setState((prev) => ({
          ...prev,
          isExporting: false,
          error: errorMsg,
        }));
        throw new Error(errorMsg);
      }
    },
    []
  );

  /**
   * Trigger browser download for export result
   */
  const downloadExport = useCallback((result: UseExportResult | ExportResult) => {
    try {
      backendDownloadExport(result);
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to download export';
      setState((prev) => ({ ...prev, error: errorMsg }));
      throw new Error(errorMsg);
    }
  }, []);

  /**
   * Copy export result to clipboard
   */
  const copyToClipboard = useCallback(async (result: UseExportResult | ExportResult) => {
    try {
      await backendCopyToClipboard(result);
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to copy to clipboard';
      setState((prev) => ({ ...prev, error: errorMsg }));
      throw new Error(errorMsg);
    }
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  /**
   * Format file size for display
   */
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }, []);

  return {
    // Export functions
    exportTemplate,
    exportCanvas,
    downloadExport,
    copyToClipboard,

    // State
    isExporting: state.isExporting,
    error: state.error,
    lastExport: state.lastExport,

    // Utilities
    clearError,
    formatFileSize,
  };
}
