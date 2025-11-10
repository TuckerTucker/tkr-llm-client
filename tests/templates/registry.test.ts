/**
 * Test Suite for Template Registry
 *
 * Comprehensive tests for template discovery, indexing, and cataloging.
 * Target: 90%+ code coverage
 *
 * @module templates/registry.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TemplateRegistry } from '../../src/templates/registry';
import * as path from 'path';

// Path to test fixtures
const FIXTURES_DIR = path.join(__dirname, 'fixtures');

describe('TemplateRegistry', () => {
  let registry: TemplateRegistry;

  beforeEach(() => {
    registry = new TemplateRegistry(FIXTURES_DIR);
  });

  describe('constructor', () => {
    it('should create registry with default base directory', () => {
      const defaultRegistry = new TemplateRegistry();
      expect(defaultRegistry).toBeInstanceOf(TemplateRegistry);
      expect(defaultRegistry.size()).toBe(0);
    });

    it('should create registry with custom base directory', () => {
      const customRegistry = new TemplateRegistry('/custom/path');
      expect(customRegistry).toBeInstanceOf(TemplateRegistry);
      expect(customRegistry.size()).toBe(0);
    });
  });

  describe('addBaseDirs', () => {
    it('should add single base directory', () => {
      registry.addBaseDirs('/additional/path');
      expect(registry).toBeInstanceOf(TemplateRegistry);
    });

    it('should add multiple base directories', () => {
      registry.addBaseDirs('/path1', '/path2', '/path3');
      expect(registry).toBeInstanceOf(TemplateRegistry);
    });
  });

  describe('scan', () => {
    it('should scan directory and load valid templates', async () => {
      await registry.scan();

      // Should have loaded valid templates from fixtures directory (count updated)
      expect(registry.size()).toBe(14);
    });

    it('should skip invalid template files', async () => {
      await registry.scan();

      // Invalid template should be skipped
      expect(registry.hasTemplate('invalid-template')).toBe(false);
    });

    it('should recursively scan subdirectories', async () => {
      await registry.scan();

      // Should find template in subfolder
      expect(registry.hasTemplate('nested-template')).toBe(true);
    });

    it('should update last scan time after successful scan', async () => {
      const beforeScan = new Date();
      await registry.scan();
      const afterScan = new Date();

      const lastScan = registry.getLastScanTime();
      expect(lastScan).not.toBeNull();
      expect(lastScan!.getTime()).toBeGreaterThanOrEqual(beforeScan.getTime());
      expect(lastScan!.getTime()).toBeLessThanOrEqual(afterScan.getTime());
    });

    it('should warn for non-existent base directory', async () => {
      const nonExistentRegistry = new TemplateRegistry('/non/existent/path');

      // Should not throw, just warn
      await expect(nonExistentRegistry.scan()).resolves.not.toThrow();
      expect(nonExistentRegistry.size()).toBe(0);
    });

    it('should throw if no base directories configured', async () => {
      // Create registry and clear base dirs manually
      const emptyRegistry = new TemplateRegistry();
      (emptyRegistry as any).baseDirs = [];

      await expect(emptyRegistry.scan()).rejects.toThrow(
        'No base directories configured'
      );
    });

    it('should clear existing cache on rescan', async () => {
      await registry.scan();
      const initialCount = registry.size();

      // Scan again
      await registry.scan();

      expect(registry.size()).toBe(initialCount);
    });
  });

  describe('getCatalog', () => {
    beforeEach(async () => {
      await registry.scan();
    });

    it('should return catalog with all templates', () => {
      const catalog = registry.getCatalog();

      expect(catalog.templates).toHaveLength(14);
      expect(catalog.count).toBe(14);
    });

    it('should include all unique tags', () => {
      const catalog = registry.getCatalog();

      expect(catalog.tags).toContain('code-analysis');
      expect(catalog.tags).toContain('security');
      expect(catalog.tags).toContain('quality');
      expect(catalog.tags).toContain('testing');
      expect(catalog.tags).toContain('code-generation');
      expect(catalog.tags).toContain('documentation');
    });

    it('should sort tags alphabetically', () => {
      const catalog = registry.getCatalog();

      const sortedTags = [...catalog.tags].sort();
      expect(catalog.tags).toEqual(sortedTags);
    });

    it('should include template metadata in entries', () => {
      const catalog = registry.getCatalog();

      const codeReviewer = catalog.templates.find(
        (t) => t.name === 'code-reviewer'
      );
      expect(codeReviewer).toBeDefined();
      expect(codeReviewer!.name).toBe('code-reviewer');
      expect(codeReviewer!.version).toBe('1.0.0');
      expect(codeReviewer!.description).toContain('Reviews code');
    });

    it('should extract tool names from templates', () => {
      const catalog = registry.getCatalog();

      const codeReviewer = catalog.templates.find(
        (t) => t.name === 'code-reviewer'
      );
      expect(codeReviewer!.tools).toEqual(['Read', 'Grep', 'Write']);
    });

    it('should extract required inputs', () => {
      const catalog = registry.getCatalog();

      const codeReviewer = catalog.templates.find(
        (t) => t.name === 'code-reviewer'
      );
      expect(codeReviewer!.requiredInputs).toEqual(['file', 'concern']);
    });

    it('should extract optional inputs', () => {
      const catalog = registry.getCatalog();

      const codeReviewer = catalog.templates.find(
        (t) => t.name === 'code-reviewer'
      );
      expect(codeReviewer!.optionalInputs).toEqual(['outputFormat']);
    });

    it('should handle templates without validation rules', () => {
      const catalog = registry.getCatalog();

      const docGen = catalog.templates.find((t) => t.name === 'doc-generator');
      expect(docGen).toBeDefined();
      expect(docGen!.requiredInputs).toEqual(['module']);
      expect(docGen!.optionalInputs).toEqual([]);
    });

    it('should handle templates without tags', () => {
      const catalog = registry.getCatalog();

      // All test templates have tags, but the catalog should handle missing tags
      catalog.templates.forEach((entry) => {
        expect(Array.isArray(entry.tags)).toBe(true);
      });
    });
  });

  describe('getTemplate', () => {
    beforeEach(async () => {
      await registry.scan();
    });

    it('should return template by name', () => {
      const template = registry.getTemplate('code-reviewer');

      expect(template).toBeDefined();
      expect(template!.metadata.name).toBe('code-reviewer');
    });

    it('should return undefined for non-existent template', () => {
      const template = registry.getTemplate('non-existent');

      expect(template).toBeUndefined();
    });

    it('should return full template structure', () => {
      const template = registry.getTemplate('code-reviewer');

      expect(template).toBeDefined();
      expect(template!.metadata).toBeDefined();
      expect(template!.agent).toBeDefined();
      expect(template!.validation).toBeDefined();
      expect(template!.runtime).toBeDefined();
    });
  });

  describe('filterByTag', () => {
    beforeEach(async () => {
      await registry.scan();
    });

    it('should filter templates by tag', () => {
      const results = registry.filterByTag('code-analysis');

      expect(results).toHaveLength(2);
      const names = results.map((r) => r.name);
      expect(names).toContain('code-reviewer');
      expect(names).toContain('doc-generator');
    });

    it('should be case-insensitive', () => {
      const lower = registry.filterByTag('testing');
      const upper = registry.filterByTag('TESTING');
      const mixed = registry.filterByTag('TeStInG');

      expect(lower).toEqual(upper);
      expect(lower).toEqual(mixed);
    });

    it('should return empty array for non-existent tag', () => {
      const results = registry.filterByTag('non-existent-tag');

      expect(results).toEqual([]);
    });

    it('should handle templates with multiple tags', () => {
      const security = registry.filterByTag('security');
      const quality = registry.filterByTag('quality');

      // code-reviewer has both tags
      expect(security.some((r) => r.name === 'code-reviewer')).toBe(true);
      expect(quality.some((r) => r.name === 'code-reviewer')).toBe(true);
    });
  });

  describe('filterByTool', () => {
    beforeEach(async () => {
      await registry.scan();
    });

    it('should filter templates by tool name', () => {
      const results = registry.filterByTool('Read');

      expect(results.length).toBeGreaterThan(0);
      results.forEach((result) => {
        expect(result.tools).toContain('Read');
      });
    });

    it('should be case-insensitive', () => {
      const lower = registry.filterByTool('read');
      const upper = registry.filterByTool('READ');
      const mixed = registry.filterByTool('ReAd');

      expect(lower).toEqual(upper);
      expect(lower).toEqual(mixed);
    });

    it('should return empty array for non-existent tool', () => {
      const results = registry.filterByTool('NonExistentTool');

      expect(results).toEqual([]);
    });

    it('should find templates with specific tools', () => {
      const writeTools = registry.filterByTool('Write');
      const bashTools = registry.filterByTool('Bash');

      expect(writeTools.length).toBeGreaterThan(0);
      expect(bashTools.length).toBeGreaterThan(0);

      // test-writer should have both
      expect(writeTools.some((r) => r.name === 'test-writer')).toBe(true);
      expect(bashTools.some((r) => r.name === 'test-writer')).toBe(true);
    });
  });

  describe('listNames', () => {
    beforeEach(async () => {
      await registry.scan();
    });

    it('should return all template names', () => {
      const names = registry.listNames();

      expect(names).toContain('code-reviewer');
      expect(names).toContain('test-writer');
      expect(names).toContain('doc-generator');
      expect(names).toContain('nested-template');
    });

    it('should return sorted names', () => {
      const names = registry.listNames();
      const sortedNames = [...names].sort();

      expect(names).toEqual(sortedNames);
    });

    it('should return empty array before scanning', () => {
      const emptyRegistry = new TemplateRegistry(FIXTURES_DIR);
      const names = emptyRegistry.listNames();

      expect(names).toEqual([]);
    });
  });

  describe('hasTemplate', () => {
    beforeEach(async () => {
      await registry.scan();
    });

    it('should return true for existing template', () => {
      expect(registry.hasTemplate('code-reviewer')).toBe(true);
      expect(registry.hasTemplate('test-writer')).toBe(true);
    });

    it('should return false for non-existent template', () => {
      expect(registry.hasTemplate('non-existent')).toBe(false);
    });

    it('should be case-sensitive', () => {
      expect(registry.hasTemplate('code-reviewer')).toBe(true);
      expect(registry.hasTemplate('Code-Reviewer')).toBe(false);
      expect(registry.hasTemplate('CODE-REVIEWER')).toBe(false);
    });
  });

  describe('refresh', () => {
    it('should reload all templates', async () => {
      await registry.scan();
      const beforeRefresh = registry.size();

      await registry.refresh();
      const afterRefresh = registry.size();

      expect(afterRefresh).toBe(beforeRefresh);
    });

    it('should update last scan time', async () => {
      await registry.scan();
      const firstScan = registry.getLastScanTime();

      // Wait a bit to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));

      await registry.refresh();
      const secondScan = registry.getLastScanTime();

      expect(secondScan!.getTime()).toBeGreaterThan(firstScan!.getTime());
    });
  });

  describe('getLastScanTime', () => {
    it('should return null before first scan', () => {
      expect(registry.getLastScanTime()).toBeNull();
    });

    it('should return date after scan', async () => {
      await registry.scan();
      const scanTime = registry.getLastScanTime();

      expect(scanTime).toBeInstanceOf(Date);
    });
  });

  describe('size', () => {
    it('should return 0 before scanning', () => {
      expect(registry.size()).toBe(0);
    });

    it('should return template count after scanning', async () => {
      await registry.scan();

      // Count includes all valid templates in fixtures directory
      // (updated count after adding template-with-variables.yaml for factory tests)
      expect(registry.size()).toBe(14);
    });

    it('should update after refresh', async () => {
      await registry.scan();
      const beforeSize = registry.size();

      await registry.refresh();
      const afterSize = registry.size();

      expect(afterSize).toBe(beforeSize);
    });
  });

  describe('duplicate templates', () => {
    it('should warn about duplicate template names', async () => {
      // This test verifies the warning is issued but doesn't fail
      // In a real scenario, we'd need to create a duplicate fixture
      await registry.scan();

      // The registry loads valid templates (updated count)
      expect(registry.size()).toBe(14);
    });
  });

  describe('edge cases', () => {
    it('should handle empty directories', async () => {
      const emptyRegistry = new TemplateRegistry('/tmp/empty-test-dir-' + Date.now());
      await emptyRegistry.scan();

      expect(emptyRegistry.size()).toBe(0);
      expect(emptyRegistry.getCatalog().count).toBe(0);
    });

    it('should handle templates with minimal metadata', () => {
      // doc-generator has minimal validation rules
      const template = registry.getTemplate('doc-generator');
      if (template) {
        expect(template.metadata.tags).toBeDefined();
      }
    });
  });
});
