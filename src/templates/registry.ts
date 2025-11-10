/**
 * Template Registry for Agent Template System
 *
 * Discovers, indexes, and catalogs agent templates from the filesystem.
 * Provides fast lookups, filtering, and caching for template discovery.
 *
 * @module templates/registry
 * @version 1.0.0
 * @author Registry & Catalog Builder (Agent 7)
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'js-yaml';
import {
  AgentTemplate,
  TemplateCatalog,
  TemplateCatalogEntry,
  isAgentTemplate,
} from './types';

/**
 * Template registry for discovering and managing agent templates.
 *
 * Scans directories for .yaml/.yml files, loads and caches templates,
 * builds a searchable catalog, and provides filtering capabilities.
 *
 * @example
 * ```typescript
 * const registry = new TemplateRegistry('./agent-templates');
 * await registry.scan();
 *
 * const catalog = registry.getCatalog();
 * console.log(`Found ${catalog.count} templates`);
 *
 * const codeAgents = registry.filterByTag('code-analysis');
 * const writeAgents = registry.filterByTool('Write');
 * ```
 */
export class TemplateRegistry {
  /**
   * Base directories to scan for templates.
   */
  private baseDirs: string[];

  /**
   * Cached parsed templates keyed by template name.
   */
  private templates: Map<string, AgentTemplate>;

  /**
   * File paths for templates keyed by template name.
   */
  private templatePaths: Map<string, string>;

  /**
   * Cached catalog entries for fast filtering.
   */
  private catalogEntries: Map<string, TemplateCatalogEntry>;

  /**
   * Timestamp of last successful scan.
   */
  private lastScanTime: Date | null;

  /**
   * Set of all unique tags across templates.
   */
  private allTags: Set<string>;

  /**
   * Creates a new template registry.
   *
   * @param baseDir - Base directory to scan (defaults to './agent-templates')
   */
  constructor(baseDir: string = './agent-templates') {
    this.baseDirs = [baseDir];
    this.templates = new Map();
    this.templatePaths = new Map();
    this.catalogEntries = new Map();
    this.lastScanTime = null;
    this.allTags = new Set();
  }

  /**
   * Adds additional base directories to scan.
   *
   * @param dirs - Additional directories to include in scans
   */
  public addBaseDirs(...dirs: string[]): void {
    this.baseDirs.push(...dirs);
  }

  /**
   * Scans all base directories for template files and loads them.
   *
   * Recursively searches for .yaml and .yml files, attempts to load
   * and parse each as an AgentTemplate, and builds the catalog.
   * Invalid files are skipped with a warning.
   *
   * @throws {Error} If no base directories are configured
   */
  public async scan(): Promise<void> {
    if (this.baseDirs.length === 0) {
      throw new Error('No base directories configured for template scanning');
    }

    // Clear existing cache
    this.templates.clear();
    this.templatePaths.clear();
    this.catalogEntries.clear();
    this.allTags.clear();

    // Scan all base directories
    for (const baseDir of this.baseDirs) {
      try {
        await this.scanDirectory(baseDir);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          console.warn(`Warning: Base directory not found: ${baseDir}`);
        } else {
          throw error;
        }
      }
    }

    this.lastScanTime = new Date();
  }

  /**
   * Recursively scans a directory for template files.
   *
   * @param dir - Directory to scan
   */
  private async scanDirectory(dir: string): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Recursively scan subdirectories
        await this.scanDirectory(fullPath);
      } else if (entry.isFile() && this.isTemplateFile(entry.name)) {
        // Try to load template file
        await this.loadTemplateFile(fullPath);
      }
    }
  }

  /**
   * Checks if a filename is a template file.
   *
   * @param filename - Filename to check
   * @returns True if file is .yaml or .yml
   */
  private isTemplateFile(filename: string): boolean {
    return filename.endsWith('.yaml') || filename.endsWith('.yml');
  }

  /**
   * Loads and parses a template file.
   *
   * @param filePath - Absolute path to template file
   */
  private async loadTemplateFile(filePath: string): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const parsed = yaml.load(content);

      if (isAgentTemplate(parsed)) {
        const template = parsed as AgentTemplate;
        const name = template.metadata.name;

        // Check for duplicate template names
        if (this.templates.has(name)) {
          console.warn(
            `Warning: Duplicate template name '${name}' found at ${filePath}. Skipping.`
          );
          return;
        }

        // Cache template
        this.templates.set(name, template);

        // Cache template file path
        this.templatePaths.set(name, filePath);

        // Build catalog entry
        const entry = this.buildCatalogEntry(template);
        this.catalogEntries.set(name, entry);

        // Collect tags
        if (template.metadata.tags) {
          template.metadata.tags.forEach((tag) => this.allTags.add(tag));
        }
      } else {
        console.warn(
          `Warning: Invalid template structure in ${filePath}. Skipping.`
        );
      }
    } catch (error) {
      console.warn(
        `Warning: Failed to load template from ${filePath}: ${(error as Error).message}`
      );
    }
  }

  /**
   * Builds a catalog entry from a template.
   *
   * @param template - Template to extract metadata from
   * @returns Catalog entry with extracted metadata
   */
  private buildCatalogEntry(template: AgentTemplate): TemplateCatalogEntry {
    // Extract tool names
    const tools = template.agent.tools.map((tool) =>
      typeof tool === 'string' ? tool : tool.name
    );

    // Extract required/optional inputs
    const requiredInputs = template.validation?.required || [];
    const optionalInputs = template.validation?.optional || [];

    return {
      name: template.metadata.name,
      version: template.metadata.version,
      description: template.metadata.description,
      tags: template.metadata.tags || [],
      tools,
      requiredInputs,
      optionalInputs,
    };
  }

  /**
   * Gets the complete template catalog.
   *
   * @returns Catalog with all templates and metadata
   */
  public getCatalog(): TemplateCatalog {
    return {
      templates: Array.from(this.catalogEntries.values()),
      count: this.catalogEntries.size,
      tags: Array.from(this.allTags).sort(),
    };
  }

  /**
   * Gets a template by name.
   *
   * @param name - Template name
   * @returns Template if found, undefined otherwise
   */
  public getTemplate(name: string): AgentTemplate | undefined {
    return this.templates.get(name);
  }

  /**
   * Gets the file path for a template.
   *
   * @param name - Template name
   * @returns File path if found, undefined otherwise
   */
  public getTemplatePath(name: string): string | undefined {
    return this.templatePaths.get(name);
  }

  /**
   * Filters templates by tag (case-insensitive).
   *
   * @param tag - Tag to filter by
   * @returns Catalog entries matching the tag
   */
  public filterByTag(tag: string): TemplateCatalogEntry[] {
    const normalizedTag = tag.toLowerCase();
    return Array.from(this.catalogEntries.values()).filter((entry) =>
      entry.tags.some((t) => t.toLowerCase() === normalizedTag)
    );
  }

  /**
   * Filters templates by tool (case-insensitive).
   *
   * @param tool - Tool name to filter by
   * @returns Catalog entries that use the specified tool
   */
  public filterByTool(tool: string): TemplateCatalogEntry[] {
    const normalizedTool = tool.toLowerCase();
    return Array.from(this.catalogEntries.values()).filter((entry) =>
      entry.tools.some((t) => t.toLowerCase() === normalizedTool)
    );
  }

  /**
   * Lists all template names.
   *
   * @returns Array of template names (sorted)
   */
  public listNames(): string[] {
    return Array.from(this.templates.keys()).sort();
  }

  /**
   * Checks if a template exists.
   *
   * @param name - Template name
   * @returns True if template exists
   */
  public hasTemplate(name: string): boolean {
    return this.templates.has(name);
  }

  /**
   * Refreshes the registry by rescanning all directories.
   *
   * Clears the cache and reloads all templates. Useful for
   * picking up changes to template files.
   */
  public async refresh(): Promise<void> {
    await this.scan();
  }

  /**
   * Gets the timestamp of the last successful scan.
   *
   * @returns Last scan time, or null if never scanned
   */
  public getLastScanTime(): Date | null {
    return this.lastScanTime;
  }

  /**
   * Gets the number of cached templates.
   *
   * @returns Template count
   */
  public size(): number {
    return this.templates.size;
  }
}
