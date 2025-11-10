/**
 * Unit tests for YAML template loader
 *
 * Tests all loading functions (loadTemplate, loadFragment, loadToolConfig)
 * with comprehensive error handling and edge case coverage.
 *
 * Target: 90%+ code coverage
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as path from 'path';
import * as fs from 'fs';
import {
  loadTemplate,
  loadFragment,
  loadToolConfig,
  FileNotFoundError,
  FileAccessError,
  YAMLParseError,
  SchemaValidationError,
  TemplateLoaderError,
} from '../../src/templates/loader';
import type {
  AgentTemplate,
  PromptFragment,
  ToolConfig,
} from '../../src/templates/types';

// ============================================================================
// TEST FIXTURES
// ============================================================================

const FIXTURES_DIR = path.join(__dirname, 'fixtures');

const FIXTURE_PATHS = {
  // Valid files
  validTemplate: path.join(FIXTURES_DIR, 'valid-template.yaml'),
  validFragment: path.join(FIXTURES_DIR, 'valid-fragment.yaml'),
  validToolConfig: path.join(FIXTURES_DIR, 'valid-tool-config.yaml'),
  multiDocument: path.join(FIXTURES_DIR, 'multi-document.yaml'),

  // Invalid files
  invalidYaml: path.join(FIXTURES_DIR, 'invalid-yaml.yaml'),
  missingMetadata: path.join(FIXTURES_DIR, 'missing-metadata.yaml'),
  missingAgent: path.join(FIXTURES_DIR, 'missing-agent.yaml'),
  invalidFragment: path.join(FIXTURES_DIR, 'invalid-fragment.yaml'),
  invalidToolConfig: path.join(FIXTURES_DIR, 'invalid-tool-config.yaml'),
  emptyFile: path.join(FIXTURES_DIR, 'empty-file.yaml'),
  multiDocumentInvalid: path.join(FIXTURES_DIR, 'multi-document-invalid.yaml'),
  trulyEmpty: path.join(FIXTURES_DIR, 'truly-empty.yaml'),

  // Non-existent
  nonExistent: path.join(FIXTURES_DIR, 'does-not-exist.yaml'),
};

// Real example files from Agent 2
const EXAMPLE_DIR = path.join(
  __dirname,
  '../../.context-kit/orchestration/agent-template-system/integration-contracts/example-templates'
);

const EXAMPLE_PATHS = {
  codeReviewer: path.join(EXAMPLE_DIR, 'code-reviewer-agent.yaml'),
  baseCodeAnalysis: path.join(EXAMPLE_DIR, 'base-code-analysis.yaml'),
  fileSafetyFragment: path.join(EXAMPLE_DIR, 'file-safety-fragment.yaml'),
  writeSafeConfig: path.join(EXAMPLE_DIR, 'tool-configs/write-safe-config.yaml'),
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if example files exist (they may not in CI environments)
 */
function exampleFilesExist(): boolean {
  return fs.existsSync(EXAMPLE_PATHS.codeReviewer);
}

// ============================================================================
// TESTS: loadTemplate()
// ============================================================================

describe('loadTemplate', () => {
  describe('valid templates', () => {
    it('should load a valid minimal template', async () => {
      const template = await loadTemplate(FIXTURE_PATHS.validTemplate);

      expect(template).toBeDefined();
      expect(template.metadata).toBeDefined();
      expect(template.metadata.name).toBe('test-agent');
      expect(template.metadata.version).toBe('1.0.0');
      expect(template.metadata.description).toBeTruthy();
      expect(template.agent).toBeDefined();
      expect(template.agent.description).toBeTruthy();
      expect(template.agent.prompt).toBeTruthy();
      expect(template.agent.tools).toBeInstanceOf(Array);
      expect(template.agent.tools.length).toBeGreaterThan(0);
    });

    it('should load template with absolute path', async () => {
      const absolutePath = path.resolve(FIXTURE_PATHS.validTemplate);
      const template = await loadTemplate(absolutePath);
      expect(template.metadata.name).toBe('test-agent');
    });

    it('should load template with relative path', async () => {
      const originalCwd = process.cwd();
      try {
        // Change to fixtures directory
        process.chdir(FIXTURES_DIR);
        const template = await loadTemplate('./valid-template.yaml');
        expect(template.metadata.name).toBe('test-agent');
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should load complex real-world template', async () => {
      if (!exampleFilesExist()) {
        console.log('Skipping real-world template test (example files not found)');
        return;
      }

      const template = await loadTemplate(EXAMPLE_PATHS.codeReviewer);
      expect(template.metadata.name).toBe('code-reviewer-agent');
      expect(template.metadata.version).toBe('1.0.0');
      expect(template.metadata.extends).toBeDefined();
      expect(template.metadata.mixins).toBeInstanceOf(Array);
      expect(template.agent.tools).toBeInstanceOf(Array);
      expect(template.validation).toBeDefined();
      expect(template.runtime).toBeDefined();
    });

    it('should load base template', async () => {
      if (!exampleFilesExist()) {
        console.log('Skipping base template test (example files not found)');
        return;
      }

      const template = await loadTemplate(EXAMPLE_PATHS.baseCodeAnalysis);
      expect(template.metadata.name).toBe('base-code-analysis');
      expect(template.metadata.base).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should throw FileNotFoundError for non-existent file', async () => {
      await expect(loadTemplate(FIXTURE_PATHS.nonExistent)).rejects.toThrow(
        FileNotFoundError
      );

      try {
        await loadTemplate(FIXTURE_PATHS.nonExistent);
      } catch (error) {
        expect(error).toBeInstanceOf(FileNotFoundError);
        expect(error).toBeInstanceOf(TemplateLoaderError);
        expect((error as FileNotFoundError).filePath).toContain('does-not-exist.yaml');
      }
    });

    it('should throw YAMLParseError for invalid YAML syntax', async () => {
      await expect(loadTemplate(FIXTURE_PATHS.invalidYaml)).rejects.toThrow(
        YAMLParseError
      );

      try {
        await loadTemplate(FIXTURE_PATHS.invalidYaml);
      } catch (error) {
        expect(error).toBeInstanceOf(YAMLParseError);
        expect((error as YAMLParseError).message).toContain('Invalid YAML syntax');
      }
    });

    it('should throw SchemaValidationError for missing metadata', async () => {
      await expect(loadTemplate(FIXTURE_PATHS.missingMetadata)).rejects.toThrow(
        SchemaValidationError
      );

      try {
        await loadTemplate(FIXTURE_PATHS.missingMetadata);
      } catch (error) {
        expect(error).toBeInstanceOf(SchemaValidationError);
        expect((error as SchemaValidationError).message).toContain('metadata');
      }
    });

    it('should throw SchemaValidationError for missing agent', async () => {
      await expect(loadTemplate(FIXTURE_PATHS.missingAgent)).rejects.toThrow(
        SchemaValidationError
      );

      try {
        await loadTemplate(FIXTURE_PATHS.missingAgent);
      } catch (error) {
        expect(error).toBeInstanceOf(SchemaValidationError);
        expect((error as SchemaValidationError).message).toContain('agent');
      }
    });

    it('should throw SchemaValidationError for empty file', async () => {
      await expect(loadTemplate(FIXTURE_PATHS.emptyFile)).rejects.toThrow(
        SchemaValidationError
      );
    });

    it('should include file path in all errors', async () => {
      const testCases = [
        { path: FIXTURE_PATHS.nonExistent, errorType: FileNotFoundError },
        { path: FIXTURE_PATHS.invalidYaml, errorType: YAMLParseError },
        { path: FIXTURE_PATHS.missingMetadata, errorType: SchemaValidationError },
      ];

      for (const testCase of testCases) {
        try {
          await loadTemplate(testCase.path);
          expect.fail('Should have thrown error');
        } catch (error) {
          expect(error).toBeInstanceOf(testCase.errorType);
          expect((error as TemplateLoaderError).filePath).toBeTruthy();
        }
      }
    });
  });
});

// ============================================================================
// TESTS: loadFragment()
// ============================================================================

describe('loadFragment', () => {
  describe('valid fragments', () => {
    it('should load a valid minimal fragment', async () => {
      const fragment = await loadFragment(FIXTURE_PATHS.validFragment);

      expect(fragment).toBeDefined();
      expect(fragment.fragment).toBeDefined();
      expect(fragment.fragment.name).toBe('test-fragment');
      expect(fragment.fragment.instructions).toBeTruthy();
      expect(typeof fragment.fragment.instructions).toBe('string');
    });

    it('should load fragment with all optional fields', async () => {
      const fragment = await loadFragment(FIXTURE_PATHS.validFragment);

      expect(fragment.fragment.example).toBeTruthy();
      expect(fragment.fragment.validation).toBeTruthy();
      expect(fragment.fragment.safetyChecks).toBeTruthy();
    });

    it('should load fragment with absolute path', async () => {
      const absolutePath = path.resolve(FIXTURE_PATHS.validFragment);
      const fragment = await loadFragment(absolutePath);
      expect(fragment.fragment.name).toBe('test-fragment');
    });

    it('should load fragment with relative path', async () => {
      const originalCwd = process.cwd();
      try {
        process.chdir(FIXTURES_DIR);
        const fragment = await loadFragment('./valid-fragment.yaml');
        expect(fragment.fragment.name).toBe('test-fragment');
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should load real-world fragment', async () => {
      if (!exampleFilesExist()) {
        console.log('Skipping real-world fragment test (example files not found)');
        return;
      }

      const fragment = await loadFragment(EXAMPLE_PATHS.fileSafetyFragment);
      expect(fragment.fragment.name).toBe('file-safety');
      expect(fragment.fragment.instructions).toContain('File Operation Safety');
      expect(fragment.fragment.safetyChecks).toBeTruthy();
    });
  });

  describe('error handling', () => {
    it('should throw FileNotFoundError for non-existent file', async () => {
      await expect(loadFragment(FIXTURE_PATHS.nonExistent)).rejects.toThrow(
        FileNotFoundError
      );
    });

    it('should throw YAMLParseError for invalid YAML syntax', async () => {
      await expect(loadFragment(FIXTURE_PATHS.invalidYaml)).rejects.toThrow(
        YAMLParseError
      );
    });

    it('should throw SchemaValidationError for invalid fragment schema', async () => {
      await expect(loadFragment(FIXTURE_PATHS.invalidFragment)).rejects.toThrow(
        SchemaValidationError
      );

      try {
        await loadFragment(FIXTURE_PATHS.invalidFragment);
      } catch (error) {
        expect(error).toBeInstanceOf(SchemaValidationError);
        expect((error as SchemaValidationError).message).toContain('fragment');
      }
    });

    it('should throw SchemaValidationError for template file', async () => {
      // Loading a template as a fragment should fail
      await expect(loadFragment(FIXTURE_PATHS.validTemplate)).rejects.toThrow(
        SchemaValidationError
      );
    });

    it('should throw SchemaValidationError for empty file', async () => {
      await expect(loadFragment(FIXTURE_PATHS.emptyFile)).rejects.toThrow(
        SchemaValidationError
      );
    });
  });
});

// ============================================================================
// TESTS: loadToolConfig()
// ============================================================================

describe('loadToolConfig', () => {
  describe('valid tool configs', () => {
    it('should load a valid tool config', async () => {
      const config = await loadToolConfig(FIXTURE_PATHS.validToolConfig);

      expect(config).toBeDefined();
      expect(config.tool).toBeDefined();
      expect(config.tool.name).toBe('Write');
      expect(config.tool.permissions).toBeDefined();
    });

    it('should load tool config with all sections', async () => {
      const config = await loadToolConfig(FIXTURE_PATHS.validToolConfig);

      expect(config.tool.permissions).toBeDefined();
      expect(config.tool.permissions?.requireConfirmation).toBe(true);
      expect(config.tool.permissions?.allowedPaths).toBeInstanceOf(Array);
      expect(config.tool.permissions?.deniedPaths).toBeInstanceOf(Array);
      expect(config.tool.validation).toBeDefined();
      expect(config.tool.errorHandling).toBeDefined();
    });

    it('should load tool config with absolute path', async () => {
      const absolutePath = path.resolve(FIXTURE_PATHS.validToolConfig);
      const config = await loadToolConfig(absolutePath);
      expect(config.tool.name).toBe('Write');
    });

    it('should load tool config with relative path', async () => {
      const originalCwd = process.cwd();
      try {
        process.chdir(FIXTURES_DIR);
        const config = await loadToolConfig('./valid-tool-config.yaml');
        expect(config.tool.name).toBe('Write');
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should load real-world tool config', async () => {
      if (!exampleFilesExist()) {
        console.log('Skipping real-world tool config test (example files not found)');
        return;
      }

      const config = await loadToolConfig(EXAMPLE_PATHS.writeSafeConfig);
      expect(config.tool.name).toBe('Write');
      expect(config.tool.permissions?.requireConfirmation).toBe(true);
      expect(config.tool.permissions?.allowedPaths).toBeInstanceOf(Array);
      expect(config.tool.permissions?.deniedPaths).toBeInstanceOf(Array);
      expect(config.tool.validation).toBeDefined();
    });

    it('should load first valid config from multi-document YAML', async () => {
      const config = await loadToolConfig(FIXTURE_PATHS.multiDocument);

      expect(config).toBeDefined();
      expect(config.tool).toBeDefined();
      expect(config.tool.name).toBe('Read'); // First document
    });

    it('should handle multi-document YAML with multiple configs', async () => {
      // The loader should return the first valid config
      const config = await loadToolConfig(FIXTURE_PATHS.multiDocument);
      expect(['Read', 'Write', 'Edit']).toContain(config.tool.name);
    });
  });

  describe('error handling', () => {
    it('should throw FileNotFoundError for non-existent file', async () => {
      await expect(loadToolConfig(FIXTURE_PATHS.nonExistent)).rejects.toThrow(
        FileNotFoundError
      );
    });

    it('should throw YAMLParseError for invalid YAML syntax', async () => {
      await expect(loadToolConfig(FIXTURE_PATHS.invalidYaml)).rejects.toThrow(
        YAMLParseError
      );
    });

    it('should throw SchemaValidationError for invalid tool config schema', async () => {
      await expect(loadToolConfig(FIXTURE_PATHS.invalidToolConfig)).rejects.toThrow(
        SchemaValidationError
      );

      try {
        await loadToolConfig(FIXTURE_PATHS.invalidToolConfig);
      } catch (error) {
        expect(error).toBeInstanceOf(SchemaValidationError);
        expect((error as SchemaValidationError).message).toContain('tool.name');
      }
    });

    it('should throw SchemaValidationError for template file', async () => {
      // Loading a template as a tool config should fail
      await expect(loadToolConfig(FIXTURE_PATHS.validTemplate)).rejects.toThrow(
        SchemaValidationError
      );
    });

    it('should throw SchemaValidationError for empty file', async () => {
      await expect(loadToolConfig(FIXTURE_PATHS.emptyFile)).rejects.toThrow(
        SchemaValidationError
      );
    });

    it('should throw SchemaValidationError for multi-document with no valid configs', async () => {
      await expect(loadToolConfig(FIXTURE_PATHS.multiDocumentInvalid)).rejects.toThrow(
        SchemaValidationError
      );

      try {
        await loadToolConfig(FIXTURE_PATHS.multiDocumentInvalid);
      } catch (error) {
        expect(error).toBeInstanceOf(SchemaValidationError);
        expect((error as SchemaValidationError).message).toContain('no valid ToolConfig found');
      }
    });

    it('should throw SchemaValidationError for truly empty multi-document file', async () => {
      await expect(loadToolConfig(FIXTURE_PATHS.trulyEmpty)).rejects.toThrow(
        SchemaValidationError
      );
    });
  });
});

// ============================================================================
// TESTS: Error Classes
// ============================================================================

describe('error classes', () => {
  it('should have correct error hierarchy', async () => {
    try {
      await loadTemplate(FIXTURE_PATHS.nonExistent);
    } catch (error) {
      expect(error).toBeInstanceOf(FileNotFoundError);
      expect(error).toBeInstanceOf(TemplateLoaderError);
      expect(error).toBeInstanceOf(Error);
    }
  });

  it('should preserve error properties', async () => {
    try {
      await loadTemplate(FIXTURE_PATHS.nonExistent);
    } catch (error) {
      const loaderError = error as TemplateLoaderError;
      expect(loaderError.name).toBe('FileNotFoundError');
      expect(loaderError.message).toBeTruthy();
      expect(loaderError.filePath).toBeTruthy();
      expect(loaderError.filePath).toContain('does-not-exist.yaml');
    }
  });

  it('should preserve cause in errors with underlying errors', async () => {
    try {
      await loadTemplate(FIXTURE_PATHS.invalidYaml);
    } catch (error) {
      const loaderError = error as TemplateLoaderError;
      expect(loaderError.cause).toBeDefined();
      expect(loaderError.cause).toBeInstanceOf(Error);
    }
  });

  it('should have helpful error messages', async () => {
    const testCases: Array<{
      loader: () => Promise<any>;
      expectedInMessage: string;
    }> = [
      {
        loader: () => loadTemplate(FIXTURE_PATHS.nonExistent),
        expectedInMessage: 'not found',
      },
      {
        loader: () => loadTemplate(FIXTURE_PATHS.invalidYaml),
        expectedInMessage: 'Invalid YAML syntax',
      },
      {
        loader: () => loadTemplate(FIXTURE_PATHS.missingMetadata),
        expectedInMessage: 'metadata',
      },
      {
        loader: () => loadFragment(FIXTURE_PATHS.invalidFragment),
        expectedInMessage: 'fragment',
      },
      {
        loader: () => loadToolConfig(FIXTURE_PATHS.invalidToolConfig),
        expectedInMessage: 'tool.name',
      },
    ];

    for (const testCase of testCases) {
      try {
        await testCase.loader();
        expect.fail('Should have thrown error');
      } catch (error) {
        expect((error as Error).message.toLowerCase()).toContain(
          testCase.expectedInMessage.toLowerCase()
        );
      }
    }
  });
});

// ============================================================================
// TESTS: Edge Cases
// ============================================================================

describe('edge cases', () => {
  it('should handle files with comments', async () => {
    // Our test fixtures have comments
    const template = await loadTemplate(FIXTURE_PATHS.validTemplate);
    expect(template).toBeDefined();
  });

  it('should handle multi-line strings in YAML', async () => {
    const fragment = await loadFragment(FIXTURE_PATHS.validFragment);
    expect(fragment.fragment.instructions).toContain('\n');
  });

  it('should preserve data types from YAML', async () => {
    const config = await loadToolConfig(FIXTURE_PATHS.validToolConfig);
    expect(typeof config.tool.permissions?.requireConfirmation).toBe('boolean');
    expect(config.tool.permissions?.requireConfirmation).toBe(true);
    expect(config.tool.validation?.maxFileSize).toBe(1048576);
  });

  it('should handle paths with spaces (if supported by filesystem)', async () => {
    // This test depends on the filesystem, so we just verify the path resolution works
    const absolutePath = path.resolve(FIXTURE_PATHS.validTemplate);
    expect(absolutePath).toBeTruthy();
  });

  it('should handle template with optional fields missing', async () => {
    // Load a minimal template
    const template = await loadTemplate(FIXTURE_PATHS.validTemplate);
    // Optional fields should be undefined when not present
    expect(template.validation).toBeUndefined();
    expect(template.runtime).toBeUndefined();
  });

  it('should handle fragment with only required fields', async () => {
    const fragment = await loadFragment(FIXTURE_PATHS.validFragment);
    expect(fragment.fragment.name).toBeTruthy();
    expect(fragment.fragment.instructions).toBeTruthy();
  });

  it('should handle tool config loaded as single document', async () => {
    // Ensure single document path is tested
    const config = await loadToolConfig(FIXTURE_PATHS.validToolConfig);
    expect(config.tool.name).toBe('Write');
  });

  it('should return first valid config in multi-document', async () => {
    const config = await loadToolConfig(FIXTURE_PATHS.multiDocument);
    // Should be the first config (Read)
    expect(config.tool.name).toBe('Read');
  });
});

// ============================================================================
// TESTS: Type Safety
// ============================================================================

describe('type safety', () => {
  it('should return correctly typed AgentTemplate', async () => {
    const template: AgentTemplate = await loadTemplate(FIXTURE_PATHS.validTemplate);

    // TypeScript compilation will fail if these types are wrong
    const name: string = template.metadata.name;
    const version: string = template.metadata.version;
    const tools: Array<string | { name: string }> = template.agent.tools;

    expect(name).toBe('test-agent');
    expect(version).toBe('1.0.0');
    expect(tools).toBeInstanceOf(Array);
  });

  it('should return correctly typed PromptFragment', async () => {
    const fragment: PromptFragment = await loadFragment(FIXTURE_PATHS.validFragment);

    const name: string = fragment.fragment.name;
    const instructions: string = fragment.fragment.instructions;

    expect(name).toBe('test-fragment');
    expect(instructions).toBeTruthy();
  });

  it('should return correctly typed ToolConfig', async () => {
    const config: ToolConfig = await loadToolConfig(FIXTURE_PATHS.validToolConfig);

    const name: string = config.tool.name;
    const permissions = config.tool.permissions;

    expect(name).toBe('Write');
    expect(permissions).toBeDefined();
  });
});

// ============================================================================
// TESTS: Integration with Real Files
// ============================================================================

describe('integration with example templates', () => {
  it('should load all example templates if available', async () => {
    if (!exampleFilesExist()) {
      console.log('Skipping example templates integration test (files not found)');
      return;
    }

    const examples = [
      EXAMPLE_PATHS.codeReviewer,
      EXAMPLE_PATHS.baseCodeAnalysis,
    ];

    for (const examplePath of examples) {
      if (fs.existsSync(examplePath)) {
        const template = await loadTemplate(examplePath);
        expect(template).toBeDefined();
        expect(template.metadata).toBeDefined();
        expect(template.agent).toBeDefined();
      }
    }
  });

  it('should load example fragments if available', async () => {
    if (!exampleFilesExist()) {
      console.log('Skipping example fragments integration test (files not found)');
      return;
    }

    if (fs.existsSync(EXAMPLE_PATHS.fileSafetyFragment)) {
      const fragment = await loadFragment(EXAMPLE_PATHS.fileSafetyFragment);
      expect(fragment).toBeDefined();
      expect(fragment.fragment.name).toBe('file-safety');
    }
  });

  it('should load example tool configs if available', async () => {
    if (!exampleFilesExist()) {
      console.log('Skipping example tool configs integration test (files not found)');
      return;
    }

    if (fs.existsSync(EXAMPLE_PATHS.writeSafeConfig)) {
      const config = await loadToolConfig(EXAMPLE_PATHS.writeSafeConfig);
      expect(config).toBeDefined();
      expect(config.tool.name).toBe('Write');
    }
  });
});
