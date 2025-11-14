/**
 * Template Export/Import
 *
 * Utilities for exporting and importing templates in various formats.
 *
 * @module lib/export/template-export
 * @version 1.0.0
 * @author Advanced Features Engineer - Wave 3
 */

import * as yaml from 'js-yaml';
import type { AgentTemplate } from '../../templates/types';
import type { Node, Edge } from '../types/reactflow';
import type { NodeData, EdgeData } from '../types/ui-types';

// ============================================================================
// EXPORT FORMATS
// ============================================================================

/**
 * Export format enumeration
 */
export enum ExportFormat {
  YAML = 'yaml',
  JSON = 'json',
  MARKDOWN = 'markdown',
  CANVAS = 'canvas', // Canvas state (nodes + edges)
}

/**
 * Export options
 */
export interface ExportOptions {
  /** Export format */
  format: ExportFormat;

  /** Include metadata */
  includeMetadata?: boolean;

  /** Include variable values */
  includeVariables?: boolean;

  /** Pretty print (JSON/YAML) */
  prettyPrint?: boolean;

  /** Include canvas layout */
  includeLayout?: boolean;
}

/**
 * Export result
 */
export interface ExportResult {
  /** Exported content */
  content: string;

  /** Content type for download */
  contentType: string;

  /** Suggested filename */
  filename: string;
}

// ============================================================================
// EXPORT FUNCTIONS
// ============================================================================

/**
 * Export template to specified format
 */
export function exportTemplate(
  template: AgentTemplate,
  options: ExportOptions = { format: ExportFormat.YAML }
): ExportResult {
  switch (options.format) {
    case ExportFormat.YAML:
      return exportAsYAML(template, options);
    case ExportFormat.JSON:
      return exportAsJSON(template, options);
    case ExportFormat.MARKDOWN:
      return exportAsMarkdown(template, options);
    default:
      throw new Error(`Unsupported export format: ${options.format}`);
  }
}

/**
 * Export canvas state (nodes + edges)
 */
export function exportCanvas(
  nodes: Node<NodeData>[],
  edges: Edge<EdgeData>[],
  options: ExportOptions = { format: ExportFormat.JSON }
): ExportResult {
  const canvasState = {
    nodes: nodes.map((node) => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: node.data,
      width: node.width,
      height: node.height,
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.type,
      data: edge.data,
    })),
    metadata: {
      exportedAt: new Date().toISOString(),
      nodeCount: nodes.length,
      edgeCount: edges.length,
    },
  };

  const content =
    options.format === ExportFormat.YAML
      ? yaml.dump(canvasState, { indent: 2 })
      : JSON.stringify(canvasState, null, options.prettyPrint ? 2 : 0);

  const extension = options.format === ExportFormat.YAML ? 'yaml' : 'json';
  const contentType = options.format === ExportFormat.YAML ? 'application/x-yaml' : 'application/json';

  return {
    content,
    contentType,
    filename: `canvas-state.${extension}`,
  };
}

/**
 * Export as YAML
 */
function exportAsYAML(template: AgentTemplate, _options: ExportOptions): ExportResult {
  const content = yaml.dump(template, {
    indent: 2,
    lineWidth: 120,
    noRefs: true,
  });

  return {
    content,
    contentType: 'application/x-yaml',
    filename: `${template.metadata.name}.yaml`,
  };
}

/**
 * Export as JSON
 */
function exportAsJSON(template: AgentTemplate, _options: ExportOptions): ExportResult {
  const content = JSON.stringify(template, null, 2);

  return {
    content,
    contentType: 'application/json',
    filename: `${template.metadata.name}.json`,
  };
}

/**
 * Export as Markdown
 */
function exportAsMarkdown(template: AgentTemplate, _options: ExportOptions): ExportResult {
  const lines: string[] = [];

  // Title
  lines.push(`# ${template.metadata.name}\n`);

  // Metadata
  lines.push(`## Metadata\n`);
  lines.push(`- **Name:** ${template.metadata.name}`);
  lines.push(`- **Description:** ${template.metadata.description}`);
  lines.push(`- **Version:** ${template.metadata.version}`);
  if (template.metadata.author) {
    lines.push(`- **Author:** ${template.metadata.author}`);
  }
  if (template.metadata.tags && template.metadata.tags.length > 0) {
    lines.push(`- **Tags:** ${template.metadata.tags.join(', ')}`);
  }
  lines.push('');

  // Agent configuration
  lines.push(`## Agent Configuration\n`);
  lines.push(`**Description:** ${template.agent.description}\n`);

  // Prompt
  lines.push(`## Prompt\n`);
  lines.push('```');
  lines.push(template.agent.prompt);
  lines.push('```\n');

  // Tools
  if (template.agent.tools && template.agent.tools.length > 0) {
    lines.push(`## Tools\n`);
    template.agent.tools.forEach((tool) => {
      const toolStr = typeof tool === 'string' ? tool : tool.name;
      lines.push(`- ${toolStr}`);
    });
    lines.push('');
  }

  // Settings
  if (template.agent.settings) {
    lines.push(`## Settings\n`);
    if (template.agent.settings.model) {
      lines.push(`- **Model:** ${template.agent.settings.model}`);
    }
    if (template.agent.settings.maxTurns) {
      lines.push(`- **Max Turns:** ${template.agent.settings.maxTurns}`);
    }
    lines.push('');
  }

  // Inheritance
  if (template.metadata.extends) {
    lines.push(`## Inheritance\n`);
    lines.push(`Extends: \`${template.metadata.extends}\`\n`);
  }

  // Mixins
  if (template.metadata.mixins && template.metadata.mixins.length > 0) {
    lines.push(`## Mixins\n`);
    template.metadata.mixins.forEach((mixin: string) => {
      lines.push(`- ${mixin}`);
    });
    lines.push('');
  }

  const content = lines.join('\n');

  return {
    content,
    contentType: 'text/markdown',
    filename: `${template.metadata.name}.md`,
  };
}

// ============================================================================
// IMPORT FUNCTIONS
// ============================================================================

/**
 * Import template from file content
 */
export function importTemplate(content: string, format: ExportFormat): AgentTemplate {
  switch (format) {
    case ExportFormat.YAML:
      return yaml.load(content) as AgentTemplate;
    case ExportFormat.JSON:
      return JSON.parse(content) as AgentTemplate;
    default:
      throw new Error(`Import not supported for format: ${format}`);
  }
}

/**
 * Import canvas state
 */
export function importCanvas(
  content: string,
  format: ExportFormat
): {
  nodes: Node<NodeData>[];
  edges: Edge<EdgeData>[];
} {
  const data = format === ExportFormat.YAML ? yaml.load(content) : JSON.parse(content);

  if (!data || typeof data !== 'object') {
    throw new Error('Invalid canvas state format');
  }

  const canvasState = data as any;

  if (!Array.isArray(canvasState.nodes) || !Array.isArray(canvasState.edges)) {
    throw new Error('Canvas state must contain nodes and edges arrays');
  }

  return {
    nodes: canvasState.nodes,
    edges: canvasState.edges,
  };
}

// ============================================================================
// DOWNLOAD HELPERS
// ============================================================================

/**
 * Trigger browser download
 */
export function downloadExport(result: ExportResult): void {
  const blob = new Blob([result.content], { type: result.contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = result.filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Copy export to clipboard
 */
export async function copyExportToClipboard(result: ExportResult): Promise<void> {
  try {
    await navigator.clipboard.writeText(result.content);
  } catch (error) {
    throw new Error('Failed to copy to clipboard');
  }
}

// ============================================================================
// BATCH EXPORT
// ============================================================================

/**
 * Export multiple templates as a bundle
 */
export function exportTemplateBundle(
  templates: AgentTemplate[],
  options: ExportOptions = { format: ExportFormat.YAML }
): ExportResult {
  const bundle = {
    metadata: {
      exportedAt: new Date().toISOString(),
      templateCount: templates.length,
      version: '1.0.0',
    },
    templates,
  };

  const content =
    options.format === ExportFormat.YAML
      ? yaml.dump(bundle, { indent: 2, lineWidth: 120 })
      : JSON.stringify(bundle, null, options.prettyPrint ? 2 : 0);

  const extension = options.format === ExportFormat.YAML ? 'yaml' : 'json';
  const contentType = options.format === ExportFormat.YAML ? 'application/x-yaml' : 'application/json';

  return {
    content,
    contentType,
    filename: `template-bundle.${extension}`,
  };
}

/**
 * Import template bundle
 */
export function importTemplateBundle(content: string, format: ExportFormat): AgentTemplate[] {
  const data = format === ExportFormat.YAML ? yaml.load(content) : JSON.parse(content);

  if (!data || typeof data !== 'object') {
    throw new Error('Invalid bundle format');
  }

  const bundle = data as any;

  if (!Array.isArray(bundle.templates)) {
    throw new Error('Bundle must contain templates array');
  }

  return bundle.templates as AgentTemplate[];
}
