/**
 * Tests for AgentFactory
 *
 * Validates the complete template → agent config pipeline.
 *
 * @module tests/templates/factory.test
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  AgentFactory,
  FactoryError,
  TemplateNotFoundError,
  MissingVariablesError,
  TemplateValidationError,
} from '../../src/templates/factory';
import type { ResolvedAgentConfig } from '../../src/templates/types';

// Test fixtures directory
const FIXTURES_DIR = path.join(__dirname, 'fixtures');

// Temporary directory for test templates
const TEST_TEMPLATE_DIR = path.join(__dirname, 'test-templates');

describe('AgentFactory', () => {
  // ============================================================================
  // SETUP AND TEARDOWN
  // ============================================================================

  beforeEach(async () => {
    // Create test template directory
    await fs.mkdir(TEST_TEMPLATE_DIR, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test directory
    await fs.rm(TEST_TEMPLATE_DIR, { recursive: true, force: true });
  });

  // ============================================================================
  // CONSTRUCTOR AND INITIALIZATION
  // ============================================================================

  describe('constructor', () => {
    it('should create factory with default config', () => {
      const factory = new AgentFactory();
      expect(factory).toBeDefined();
      expect(factory.getRegistry()).toBeDefined();
    });

    it('should create factory with custom template directory', () => {
      const factory = new AgentFactory({ templateDir: './custom-templates' });
      expect(factory).toBeDefined();
    });

    it('should create factory with all config options', () => {
      const factory = new AgentFactory({
        templateDir: './agent-templates',
        baseDir: '/custom/base',
        validateTemplates: false,
        cacheEnabled: true,
      });
      expect(factory).toBeDefined();
    });
  });

  describe('scan', () => {
    it('should scan template directory and build registry', async () => {
      // Copy test template to test directory
      const templatePath = path.join(FIXTURES_DIR, 'valid-template.yaml');
      const destPath = path.join(TEST_TEMPLATE_DIR, 'valid-template.yaml');
      await fs.copyFile(templatePath, destPath);

      const factory = new AgentFactory({ templateDir: TEST_TEMPLATE_DIR });
      await factory.scan();

      const catalog = factory.getRegistry().getCatalog();
      expect(catalog.count).toBe(1);
      expect(catalog.templates[0].name).toBe('test-agent');
    });

    it('should handle non-existent directory gracefully', async () => {
      const factory = new AgentFactory({ templateDir: '/nonexistent/path' });
      await factory.scan(); // Should not throw

      const catalog = factory.getRegistry().getCatalog();
      expect(catalog.count).toBe(0);
    });

    it('should discover templates recursively', async () => {
      // Create nested structure
      const subdir = path.join(TEST_TEMPLATE_DIR, 'subfolder');
      await fs.mkdir(subdir, { recursive: true });

      // Copy templates
      await fs.copyFile(
        path.join(FIXTURES_DIR, 'valid-template.yaml'),
        path.join(TEST_TEMPLATE_DIR, 'template1.yaml')
      );
      await fs.copyFile(
        path.join(FIXTURES_DIR, 'base-template.yaml'),
        path.join(subdir, 'template2.yaml')
      );

      const factory = new AgentFactory({ templateDir: TEST_TEMPLATE_DIR });
      await factory.scan();

      const catalog = factory.getRegistry().getCatalog();
      expect(catalog.count).toBe(2);
    });
  });

  // ============================================================================
  // CREATE FROM TEMPLATE NAME
  // ============================================================================

  describe('create', () => {
    it('should throw if not scanned', async () => {
      const factory = new AgentFactory({ templateDir: TEST_TEMPLATE_DIR });

      await expect(factory.create('test-agent', {})).rejects.toThrow(FactoryError);
      await expect(factory.create('test-agent', {})).rejects.toThrow(
        'Factory has not been scanned'
      );
    });

    it('should create agent from simple template', async () => {
      // Setup
      await fs.copyFile(
        path.join(FIXTURES_DIR, 'valid-template.yaml'),
        path.join(TEST_TEMPLATE_DIR, 'valid-template.yaml')
      );

      const factory = new AgentFactory({ templateDir: TEST_TEMPLATE_DIR });
      await factory.scan();

      // Execute
      const config = await factory.create('test-agent');

      // Verify
      expect(config).toBeDefined();
      expect(config.prompt).toContain('You are a test agent');
      expect(config.tools).toEqual(['Read', 'Write']);
      expect(config.settings.model).toBe('claude-sonnet-4-5-20250929');
      expect(config.runtime.workingDirectory).toBeTruthy();
    });

    it('should throw TemplateNotFoundError for non-existent template', async () => {
      await fs.copyFile(
        path.join(FIXTURES_DIR, 'valid-template.yaml'),
        path.join(TEST_TEMPLATE_DIR, 'valid-template.yaml')
      );

      const factory = new AgentFactory({ templateDir: TEST_TEMPLATE_DIR });
      await factory.scan();

      await expect(factory.create('nonexistent', {})).rejects.toThrow(
        TemplateNotFoundError
      );
      await expect(factory.create('nonexistent', {})).rejects.toThrow(
        'Template "nonexistent" not found'
      );
    });

    it('should list available templates in error message', async () => {
      await fs.copyFile(
        path.join(FIXTURES_DIR, 'valid-template.yaml'),
        path.join(TEST_TEMPLATE_DIR, 'valid-template.yaml')
      );
      await fs.copyFile(
        path.join(FIXTURES_DIR, 'base-template.yaml'),
        path.join(TEST_TEMPLATE_DIR, 'base-template.yaml')
      );

      const factory = new AgentFactory({ templateDir: TEST_TEMPLATE_DIR });
      await factory.scan();

      try {
        await factory.create('nonexistent', {});
        expect.fail('Should have thrown TemplateNotFoundError');
      } catch (error) {
        expect(error).toBeInstanceOf(TemplateNotFoundError);
        const err = error as TemplateNotFoundError;
        expect(err.availableTemplates).toContain('test-agent');
        expect(err.availableTemplates).toContain('base-template');
      }
    });

    it('should interpolate variables in prompt', async () => {
      // Setup
      await fs.copyFile(
        path.join(FIXTURES_DIR, 'template-with-variables.yaml'),
        path.join(TEST_TEMPLATE_DIR, 'variable-template.yaml')
      );

      const factory = new AgentFactory({ templateDir: TEST_TEMPLATE_DIR });
      await factory.scan();

      // Execute
      const config = await factory.create('variable-template', {
        targetFile: './src/index.ts',
        concern: 'security',
        outputPath: './custom-review.md',
      });

      // Verify
      expect(config.prompt).toContain('./src/index.ts');
      expect(config.prompt).toContain('security');
      expect(config.prompt).toContain('./custom-review.md');
      expect(config.prompt).not.toContain('{{');
    });

    it('should use default values for optional variables', async () => {
      await fs.copyFile(
        path.join(FIXTURES_DIR, 'template-with-variables.yaml'),
        path.join(TEST_TEMPLATE_DIR, 'variable-template.yaml')
      );

      const factory = new AgentFactory({ templateDir: TEST_TEMPLATE_DIR });
      await factory.scan();

      const config = await factory.create('variable-template', {
        targetFile: './src/index.ts',
        concern: 'security',
        // outputPath omitted - should use default
      });

      expect(config.prompt).toContain('./review.md'); // default value
    });

    it('should throw MissingVariablesError for missing required variables', async () => {
      await fs.copyFile(
        path.join(FIXTURES_DIR, 'template-with-variables.yaml'),
        path.join(TEST_TEMPLATE_DIR, 'variable-template.yaml')
      );

      const factory = new AgentFactory({ templateDir: TEST_TEMPLATE_DIR });
      await factory.scan();

      await expect(
        factory.create('variable-template', {
          targetFile: './src/index.ts',
          // concern missing
        })
      ).rejects.toThrow(MissingVariablesError);
    });

    it('should list missing variables in error message', async () => {
      await fs.copyFile(
        path.join(FIXTURES_DIR, 'template-with-variables.yaml'),
        path.join(TEST_TEMPLATE_DIR, 'variable-template.yaml')
      );

      const factory = new AgentFactory({ templateDir: TEST_TEMPLATE_DIR });
      await factory.scan();

      try {
        await factory.create('variable-template', {});
        expect.fail('Should have thrown MissingVariablesError');
      } catch (error) {
        expect(error).toBeInstanceOf(MissingVariablesError);
        const err = error as MissingVariablesError;
        expect(err.missingVariables).toContain('targetFile');
        expect(err.missingVariables).toContain('concern');
      }
    });

    it('should handle template inheritance', async () => {
      // Copy base and child templates
      await fs.copyFile(
        path.join(FIXTURES_DIR, 'base-template.yaml'),
        path.join(TEST_TEMPLATE_DIR, 'base-template.yaml')
      );
      await fs.copyFile(
        path.join(FIXTURES_DIR, 'child-template.yaml'),
        path.join(TEST_TEMPLATE_DIR, 'child-template.yaml')
      );

      const factory = new AgentFactory({ templateDir: TEST_TEMPLATE_DIR });
      await factory.scan();

      const config = await factory.create('child-template');

      // Verify inheritance
      expect(config.prompt).toContain('You are a code analysis agent'); // from base
      expect(config.prompt).toContain('Focus on code quality'); // from child
      expect(config.tools).toContain('Read'); // from base
      expect(config.tools).toContain('Write'); // from child
      expect(config.settings.maxTurns).toBe(5); // overridden in child
    });

    it('should throw TemplateValidationError for invalid template', async () => {
      // Create invalid template (forbidden tool)
      const invalidTemplate = `
metadata:
  name: invalid-agent
  version: 1.0.0
  description: Invalid agent

agent:
  description: Agent with forbidden tool
  prompt: Test
  tools:
    - WebSearch  # Forbidden network tool
`;

      await fs.writeFile(path.join(TEST_TEMPLATE_DIR, 'invalid.yaml'), invalidTemplate);

      const factory = new AgentFactory({ templateDir: TEST_TEMPLATE_DIR });
      await factory.scan();

      await expect(factory.create('invalid-agent', {})).rejects.toThrow(
        TemplateValidationError
      );
    });

    it('should skip validation when validateTemplates is false', async () => {
      // Create invalid template
      const invalidTemplate = `
metadata:
  name: invalid-agent
  version: 1.0.0
  description: Invalid agent

agent:
  description: Agent with forbidden tool
  prompt: Test
  tools:
    - WebSearch
`;

      await fs.writeFile(path.join(TEST_TEMPLATE_DIR, 'invalid.yaml'), invalidTemplate);

      const factory = new AgentFactory({
        templateDir: TEST_TEMPLATE_DIR,
        validateTemplates: false,
      });
      await factory.scan();

      // Should not throw - validation is disabled
      const config = await factory.create('invalid-agent', {});
      expect(config).toBeDefined();
    });
  });

  // ============================================================================
  // CREATE FROM PATH
  // ============================================================================

  describe('createFromPath', () => {
    it('should create agent from absolute path', async () => {
      const templatePath = path.join(FIXTURES_DIR, 'valid-template.yaml');

      const factory = new AgentFactory();
      const config = await factory.createFromPath(templatePath);

      expect(config).toBeDefined();
      expect(config.prompt).toContain('You are a test agent');
      expect(config.tools).toEqual(['Read', 'Write']);
    });

    it('should create agent from relative path', async () => {
      const factory = new AgentFactory({
        baseDir: __dirname,
      });

      const config = await factory.createFromPath('./fixtures/valid-template.yaml');

      expect(config).toBeDefined();
      expect(config.prompt).toContain('You are a test agent');
    });

    it('should work without scanning registry', async () => {
      const templatePath = path.join(FIXTURES_DIR, 'valid-template.yaml');

      const factory = new AgentFactory();
      // No scan() called

      const config = await factory.createFromPath(templatePath);
      expect(config).toBeDefined();
    });

    it('should interpolate variables from path', async () => {
      const templatePath = path.join(FIXTURES_DIR, 'template-with-variables.yaml');

      const factory = new AgentFactory();
      const config = await factory.createFromPath(templatePath, {
        targetFile: './src/index.ts',
        concern: 'security',
      });

      expect(config.prompt).toContain('./src/index.ts');
      expect(config.prompt).toContain('security');
    });

    it('should throw MissingVariablesError for missing variables', async () => {
      const templatePath = path.join(FIXTURES_DIR, 'template-with-variables.yaml');

      const factory = new AgentFactory();

      await expect(
        factory.createFromPath(templatePath, {
          targetFile: './src/index.ts',
          // concern missing
        })
      ).rejects.toThrow(MissingVariablesError);
    });

    it('should throw FactoryError for non-existent path', async () => {
      const factory = new AgentFactory();

      await expect(factory.createFromPath('/nonexistent/path.yaml', {})).rejects.toThrow(
        FactoryError
      );
    });

    it('should handle inheritance with relative paths', async () => {
      const childPath = path.join(FIXTURES_DIR, 'child-template.yaml');

      const factory = new AgentFactory();
      const config = await factory.createFromPath(childPath);

      // Verify inheritance
      expect(config.prompt).toContain('You are a code analysis agent'); // from base
      expect(config.prompt).toContain('Focus on code quality'); // from child
    });
  });

  // ============================================================================
  // REGISTRY ACCESS
  // ============================================================================

  describe('getRegistry', () => {
    it('should return the template registry', async () => {
      await fs.copyFile(
        path.join(FIXTURES_DIR, 'valid-template.yaml'),
        path.join(TEST_TEMPLATE_DIR, 'valid-template.yaml')
      );

      const factory = new AgentFactory({ templateDir: TEST_TEMPLATE_DIR });
      await factory.scan();

      const registry = factory.getRegistry();
      expect(registry).toBeDefined();
      expect(registry.hasTemplate('test-agent')).toBe(true);
    });

    it('should allow catalog access', async () => {
      await fs.copyFile(
        path.join(FIXTURES_DIR, 'valid-template.yaml'),
        path.join(TEST_TEMPLATE_DIR, 'valid-template.yaml')
      );

      const factory = new AgentFactory({ templateDir: TEST_TEMPLATE_DIR });
      await factory.scan();

      const catalog = factory.getRegistry().getCatalog();
      expect(catalog.count).toBe(1);
      expect(catalog.templates[0].name).toBe('test-agent');
    });

    it('should allow filtering by tag', async () => {
      // Create template with tags
      const templateWithTags = `
metadata:
  name: tagged-agent
  version: 1.0.0
  description: Agent with tags
  tags:
    - code-analysis
    - security

agent:
  description: Tagged agent
  prompt: Test
  tools:
    - Read
`;

      await fs.writeFile(
        path.join(TEST_TEMPLATE_DIR, 'tagged-agent.yaml'),
        templateWithTags
      );

      const factory = new AgentFactory({ templateDir: TEST_TEMPLATE_DIR });
      await factory.scan();

      const results = factory.getRegistry().filterByTag('code-analysis');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('tagged-agent');
    });
  });

  // ============================================================================
  // CACHING
  // ============================================================================

  describe('caching', () => {
    it('should cache results when caching is enabled', async () => {
      await fs.copyFile(
        path.join(FIXTURES_DIR, 'valid-template.yaml'),
        path.join(TEST_TEMPLATE_DIR, 'valid-template.yaml')
      );

      const factory = new AgentFactory({
        templateDir: TEST_TEMPLATE_DIR,
        cacheEnabled: true,
      });
      await factory.scan();

      const config1 = await factory.create('test-agent');
      const config2 = await factory.create('test-agent');

      // Should return same object (cached)
      expect(config1).toBe(config2);
    });

    it('should not cache when caching is disabled', async () => {
      await fs.copyFile(
        path.join(FIXTURES_DIR, 'valid-template.yaml'),
        path.join(TEST_TEMPLATE_DIR, 'valid-template.yaml')
      );

      const factory = new AgentFactory({
        templateDir: TEST_TEMPLATE_DIR,
        cacheEnabled: false,
      });
      await factory.scan();

      const config1 = await factory.create('test-agent');
      const config2 = await factory.create('test-agent');

      // Should return different objects (not cached)
      expect(config1).not.toBe(config2);
      expect(config1).toEqual(config2); // But content should be same
    });

    it('should cache separately for different variables', async () => {
      await fs.copyFile(
        path.join(FIXTURES_DIR, 'template-with-variables.yaml'),
        path.join(TEST_TEMPLATE_DIR, 'variable-template.yaml')
      );

      const factory = new AgentFactory({
        templateDir: TEST_TEMPLATE_DIR,
        cacheEnabled: true,
      });
      await factory.scan();

      const config1 = await factory.create('variable-template', {
        targetFile: './file1.ts',
        concern: 'security',
      });
      const config2 = await factory.create('variable-template', {
        targetFile: './file2.ts',
        concern: 'performance',
      });

      // Should be different objects (different variables)
      expect(config1).not.toBe(config2);
      expect(config1.prompt).toContain('./file1.ts');
      expect(config2.prompt).toContain('./file2.ts');
    });
  });

  // ============================================================================
  // REFRESH
  // ============================================================================

  describe('refresh', () => {
    it('should rescan templates and clear cache', async () => {
      await fs.copyFile(
        path.join(FIXTURES_DIR, 'valid-template.yaml'),
        path.join(TEST_TEMPLATE_DIR, 'valid-template.yaml')
      );

      const factory = new AgentFactory({
        templateDir: TEST_TEMPLATE_DIR,
        cacheEnabled: true,
      });
      await factory.scan();

      const config1 = await factory.create('test-agent');

      // Add another template
      await fs.copyFile(
        path.join(FIXTURES_DIR, 'base-template.yaml'),
        path.join(TEST_TEMPLATE_DIR, 'base-template.yaml')
      );

      // Refresh
      await factory.refresh();

      const catalog = factory.getRegistry().getCatalog();
      expect(catalog.count).toBe(2);

      // Cache should be cleared
      const config2 = await factory.create('test-agent');
      expect(config1).not.toBe(config2); // Different objects
    });
  });

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  describe('error handling', () => {
    it('should provide helpful error for template not found', async () => {
      const factory = new AgentFactory({ templateDir: TEST_TEMPLATE_DIR });
      await factory.scan();

      try {
        await factory.create('nonexistent');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(TemplateNotFoundError);
        expect((error as Error).message).toContain('Template "nonexistent" not found');
      }
    });

    it('should provide helpful error for missing variables', async () => {
      await fs.copyFile(
        path.join(FIXTURES_DIR, 'template-with-variables.yaml'),
        path.join(TEST_TEMPLATE_DIR, 'variable-template.yaml')
      );

      const factory = new AgentFactory({ templateDir: TEST_TEMPLATE_DIR });
      await factory.scan();

      try {
        await factory.create('variable-template', {});
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(MissingVariablesError);
        expect((error as Error).message).toContain('Missing required variables');
        expect((error as Error).message).toContain('targetFile');
        expect((error as Error).message).toContain('concern');
      }
    });

    it('should provide helpful error for validation failure', async () => {
      const invalidTemplate = `
metadata:
  name: invalid-agent
  version: bad-version
  description: Invalid

agent:
  description: Test
  prompt: Test
  tools:
    - WebSearch
`;

      await fs.writeFile(path.join(TEST_TEMPLATE_DIR, 'invalid.yaml'), invalidTemplate);

      const factory = new AgentFactory({ templateDir: TEST_TEMPLATE_DIR });
      await factory.scan();

      try {
        await factory.create('invalid-agent');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(TemplateValidationError);
        expect((error as Error).message).toContain('Template validation failed');
      }
    });
  });

  // ============================================================================
  // INTEGRATION TESTS
  // ============================================================================

  describe('integration', () => {
    it('should handle complex template with all features', async () => {
      // Create comprehensive template
      const complexTemplate = `
metadata:
  name: complex-agent
  version: 1.0.0
  description: Complex agent with all features
  tags:
    - code-analysis
    - security

agent:
  description: Comprehensive agent
  prompt: |
    You are analyzing {{ targetFile }}.
    Focus on {{ concern }}.
  tools:
    - Read
    - Write
    - Grep
  settings:
    model: sonnet
    temperature: 0.5
    maxTurns: 10

validation:
  required:
    - targetFile
    - concern
  types:
    targetFile:
      type: string
    concern:
      type: enum
      enum: [security, performance, style]

runtime:
  timeout: 60000
  logLevel: info
`;

      await fs.writeFile(
        path.join(TEST_TEMPLATE_DIR, 'complex-agent.yaml'),
        complexTemplate
      );

      const factory = new AgentFactory({ templateDir: TEST_TEMPLATE_DIR });
      await factory.scan();

      const config = await factory.create('complex-agent', {
        targetFile: './src/index.ts',
        concern: 'security',
      });

      // Verify all features
      expect(config.prompt).toContain('./src/index.ts');
      expect(config.prompt).toContain('security');
      expect(config.tools).toEqual(['Read', 'Write', 'Grep']);
      expect(config.settings.model).toBe('claude-sonnet-4-5-20250929');
      expect(config.settings.temperature).toBe(0.5);
      expect(config.settings.maxTurns).toBe(10);
      expect(config.runtime.timeout).toBe(60000);
    });

    it('should work end-to-end with realistic use case', async () => {
      // Realistic code review template
      const codeReviewTemplate = `
metadata:
  name: code-reviewer
  version: 1.0.0
  description: Automated code review agent
  tags:
    - code-review
    - quality

agent:
  description: Reviews code for quality and security
  prompt: |
    Review the file {{ targetFile }} for the following concerns:
    {{ concerns }}

    Provide specific feedback with line numbers where applicable.
    Save your review to {{ outputPath | default: ./code-review.md }}.
  tools:
    - Read
    - Grep
    - Write
  settings:
    model: sonnet
    temperature: 0.3
    maxTurns: 5

validation:
  required:
    - targetFile
    - concerns
  optional:
    - outputPath
  types:
    targetFile:
      type: string
    concerns:
      type: string
    outputPath:
      type: string
      default: ./code-review.md

runtime:
  timeout: 120000
  logLevel: info
`;

      await fs.writeFile(
        path.join(TEST_TEMPLATE_DIR, 'code-reviewer.yaml'),
        codeReviewTemplate
      );

      const factory = new AgentFactory({ templateDir: TEST_TEMPLATE_DIR });
      await factory.scan();

      // Create agent config
      const config = await factory.create('code-reviewer', {
        targetFile: './src/index.ts',
        concerns: 'security vulnerabilities, code duplication, error handling',
      });

      // Verify config is ready for LLMClient
      expect(config.prompt).toContain('./src/index.ts');
      expect(config.prompt).toContain('security vulnerabilities');
      expect(config.tools).toContain('Read');
      expect(config.tools).toContain('Write');
      expect(config.settings.model).toBe('claude-sonnet-4-5-20250929');
      expect(config.runtime.timeout).toBe(120000);

      // Verify it's a valid ResolvedAgentConfig
      const assertResolvedConfig = (c: ResolvedAgentConfig) => c;
      assertResolvedConfig(config);
    });
  });
});
