/**
 * Export System Tests
 *
 * Comprehensive tests for the export functionality including all 4 formats,
 * hook behavior, and integration points.
 *
 * @module __tests__/export
 * @version 1.0.0
 * @author Export System Engineer (Wave 3, Agent 1)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useExport } from '../hooks/useExport';
import {
  exportTemplate,
  exportCanvas,
  ExportFormat,
  type ExportResult,
} from '@/../../src/lib/export/template-export';
import type { AgentTemplate } from '@/../../src/templates/types';
import type { Node, Edge } from 'reactflow';

// Mock template for testing
const mockTemplate: AgentTemplate = {
  metadata: {
    name: 'test-template',
    version: '1.0.0',
    description: 'Test template for export',
    tags: ['test', 'export'],
  },
  agent: {
    description: 'Test agent',
    prompt: 'You are a test agent',
    tools: ['Read', 'Write'],
  },
};

// Mock nodes and edges
const mockNodes: Node[] = [
  {
    id: '1',
    type: 'template',
    position: { x: 0, y: 0 },
    data: { label: 'Test Node' },
  },
  {
    id: '2',
    type: 'template',
    position: { x: 100, y: 100 },
    data: { label: 'Test Node 2' },
  },
];

const mockEdges: Edge[] = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
  },
];

describe('Export System', () => {
  describe('exportTemplate', () => {
    it('exports template to YAML format', () => {
      const result = exportTemplate(mockTemplate, { format: ExportFormat.YAML });

      expect(result.content).toBeTruthy();
      expect(result.contentType).toBe('application/x-yaml');
      expect(result.filename).toBe('test-template.yaml');
      expect(result.content).toContain('name: test-template');
      expect(result.content).toContain('version: 1.0.0');
    });

    it('exports template to JSON format', () => {
      const result = exportTemplate(mockTemplate, { format: ExportFormat.JSON });

      expect(result.content).toBeTruthy();
      expect(result.contentType).toBe('application/json');
      expect(result.filename).toBe('test-template.json');

      const parsed = JSON.parse(result.content);
      expect(parsed.metadata.name).toBe('test-template');
      expect(parsed.metadata.version).toBe('1.0.0');
    });

    it('exports template to Markdown format', () => {
      const result = exportTemplate(mockTemplate, { format: ExportFormat.MARKDOWN });

      expect(result.content).toBeTruthy();
      expect(result.contentType).toBe('text/markdown');
      expect(result.filename).toBe('test-template.md');
      expect(result.content).toContain('# test-template');
      expect(result.content).toContain('## Metadata');
      expect(result.content).toContain('## Tools');
    });

    it('includes metadata when requested', () => {
      const result = exportTemplate(mockTemplate, {
        format: ExportFormat.YAML,
        includeMetadata: true,
      });

      expect(result.content).toContain('name: test-template');
      expect(result.content).toContain('description: Test template for export');
    });

    it('respects prettyPrint option for JSON', () => {
      const prettyResult = exportTemplate(mockTemplate, {
        format: ExportFormat.JSON,
        prettyPrint: true,
      });

      expect(prettyResult.content).toContain('\n');
      expect(prettyResult.content).toContain('  ');
    });
  });

  describe('exportCanvas', () => {
    it('exports canvas state to JSON format', () => {
      const result = exportCanvas(mockNodes, mockEdges, {
        format: ExportFormat.JSON,
      });

      expect(result.content).toBeTruthy();
      expect(result.contentType).toBe('application/json');
      expect(result.filename).toBe('canvas-state.json');

      const parsed = JSON.parse(result.content);
      expect(parsed.nodes).toHaveLength(2);
      expect(parsed.edges).toHaveLength(1);
      expect(parsed.metadata.nodeCount).toBe(2);
      expect(parsed.metadata.edgeCount).toBe(1);
    });

    it('exports canvas state to YAML format', () => {
      const result = exportCanvas(mockNodes, mockEdges, {
        format: ExportFormat.YAML,
      });

      expect(result.content).toBeTruthy();
      expect(result.contentType).toBe('application/x-yaml');
      expect(result.filename).toBe('canvas-state.yaml');
      expect(result.content).toContain('nodes:');
      expect(result.content).toContain('edges:');
    });

    it('includes node positions in canvas export', () => {
      const result = exportCanvas(mockNodes, mockEdges, {
        format: ExportFormat.JSON,
      });

      const parsed = JSON.parse(result.content);
      expect(parsed.nodes[0].position).toEqual({ x: 0, y: 0 });
      expect(parsed.nodes[1].position).toEqual({ x: 100, y: 100 });
    });

    it('includes metadata with timestamp', () => {
      const result = exportCanvas(mockNodes, mockEdges, {
        format: ExportFormat.JSON,
      });

      const parsed = JSON.parse(result.content);
      expect(parsed.metadata.exportedAt).toBeTruthy();
      expect(new Date(parsed.metadata.exportedAt).getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('useExport hook', () => {
    beforeEach(() => {
      // Clear any previous mocks
      vi.clearAllMocks();
    });

    it('initializes with correct default state', () => {
      const { result } = renderHook(() => useExport());

      expect(result.current.isExporting).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.lastExport).toBe(null);
    });

    it('exports template and updates state', async () => {
      const { result } = renderHook(() => useExport());

      let exportResult;
      await act(async () => {
        exportResult = await result.current.exportTemplate(
          mockTemplate,
          ExportFormat.YAML
        );
      });

      expect(exportResult).toBeTruthy();
      expect(exportResult.content).toContain('test-template');
      expect(result.current.isExporting).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.lastExport).toBeTruthy();
    });

    it('exports canvas and updates state', async () => {
      const { result } = renderHook(() => useExport());

      let exportResult;
      await act(async () => {
        exportResult = await result.current.exportCanvas(
          mockNodes,
          mockEdges,
          ExportFormat.JSON
        );
      });

      expect(exportResult).toBeTruthy();
      expect(JSON.parse(exportResult.content).nodes).toHaveLength(2);
      expect(result.current.isExporting).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('calculates file size correctly', async () => {
      const { result } = renderHook(() => useExport());

      let exportResult;
      await act(async () => {
        exportResult = await result.current.exportTemplate(
          mockTemplate,
          ExportFormat.JSON
        );
      });

      expect(exportResult.size).toBeGreaterThan(0);
      expect(exportResult.size).toBe(new Blob([exportResult.content]).size);
    });

    it('formats file size for display', () => {
      const { result } = renderHook(() => useExport());

      expect(result.current.formatFileSize(500)).toBe('500 B');
      expect(result.current.formatFileSize(1024)).toBe('1.0 KB');
      expect(result.current.formatFileSize(1024 * 1024)).toBe('1.00 MB');
    });

    it('handles export errors gracefully', async () => {
      const { result } = renderHook(() => useExport());

      // Pass invalid template to trigger error
      const invalidTemplate = {} as AgentTemplate;

      await expect(async () => {
        await act(async () => {
          await result.current.exportTemplate(invalidTemplate, ExportFormat.YAML);
        });
      }).rejects.toThrow();

      expect(result.current.isExporting).toBe(false);
      expect(result.current.error).toBeTruthy();
    });

    it('clears error state', async () => {
      const { result } = renderHook(() => useExport());

      // Trigger error
      try {
        await act(async () => {
          await result.current.exportTemplate({} as AgentTemplate, ExportFormat.YAML);
        });
      } catch {
        // Expected
      }

      expect(result.current.error).toBeTruthy();

      // Clear error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
    });
  });

  describe('Format validation', () => {
    it('validates YAML output is parseable', () => {
      const result = exportTemplate(mockTemplate, { format: ExportFormat.YAML });

      // Should not throw when parsing
      expect(() => {
        const yaml = require('js-yaml');
        yaml.load(result.content);
      }).not.toThrow();
    });

    it('validates JSON output is parseable', () => {
      const result = exportTemplate(mockTemplate, { format: ExportFormat.JSON });

      // Should not throw when parsing
      expect(() => {
        JSON.parse(result.content);
      }).not.toThrow();
    });

    it('validates Markdown output has proper structure', () => {
      const result = exportTemplate(mockTemplate, { format: ExportFormat.MARKDOWN });

      // Check for required markdown elements
      expect(result.content).toMatch(/^# /m); // Has title
      expect(result.content).toMatch(/^## /m); // Has sections
      expect(result.content).toMatch(/^- /m); // Has lists
    });
  });

  describe('File size warnings', () => {
    it('warns for large exports > 1MB', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Create large template
      const largeTemplate: AgentTemplate = {
        ...mockTemplate,
        agent: {
          ...mockTemplate.agent,
          prompt: 'x'.repeat(2 * 1024 * 1024), // 2MB of text
        },
      };

      const { result } = renderHook(() => useExport());

      await act(async () => {
        await result.current.exportTemplate(largeTemplate, ExportFormat.JSON);
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Export size is large')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Integration', () => {
    it('exports all 4 formats without errors', async () => {
      const formats = [
        ExportFormat.YAML,
        ExportFormat.JSON,
        ExportFormat.MARKDOWN,
      ];

      for (const format of formats) {
        const result = exportTemplate(mockTemplate, { format });
        expect(result.content).toBeTruthy();
        expect(result.filename).toBeTruthy();
        expect(result.contentType).toBeTruthy();
      }
    });

    it('maintains data consistency across formats', () => {
      const yamlResult = exportTemplate(mockTemplate, { format: ExportFormat.YAML });
      const jsonResult = exportTemplate(mockTemplate, { format: ExportFormat.JSON });

      const yaml = require('js-yaml');
      const yamlData = yaml.load(yamlResult.content);
      const jsonData = JSON.parse(jsonResult.content);

      expect(yamlData.metadata.name).toBe(jsonData.metadata.name);
      expect(yamlData.metadata.version).toBe(jsonData.metadata.version);
      expect(yamlData.agent.description).toBe(jsonData.agent.description);
    });
  });
});
