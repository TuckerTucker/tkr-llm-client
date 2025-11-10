/**
 * Unit tests for template resolver
 *
 * Tests template resolution including inheritance, mixin composition,
 * tool configuration merging, and variable interpolation.
 *
 * Target: 90%+ code coverage
 */

import { describe, it, expect } from 'vitest';
import * as path from 'path';
import {
  resolveTemplate,
  resolveExtends,
  resolveFragments,
  resolveToolConfigs,
  TemplateResolutionError,
  CircularInheritanceError,
  MaxDepthExceededError,
} from '../../src/templates/resolver';
import { loadTemplate } from '../../src/templates/loader';
import type { AgentTemplate, ResolvedAgentConfig } from '../../src/templates/types';

// ============================================================================
// TEST FIXTURES
// ============================================================================

const FIXTURES_DIR = path.join(__dirname, 'fixtures');

const FIXTURE_PATHS = {
  // Inheritance fixtures
  baseTemplate: path.join(FIXTURES_DIR, 'base-template.yaml'),
  childTemplate: path.join(FIXTURES_DIR, 'child-template.yaml'),
  grandchildTemplate: path.join(FIXTURES_DIR, 'grandchild-template.yaml'),
  circularA: path.join(FIXTURES_DIR, 'circular-a.yaml'),
  circularB: path.join(FIXTURES_DIR, 'circular-b.yaml'),

  // Fragment fixtures
  fragmentMixin: path.join(FIXTURES_DIR, 'fragment-mixin.yaml'),
  validFragment: path.join(FIXTURES_DIR, 'valid-fragment.yaml'),

  // Tool config fixtures
  toolWithConfig: path.join(FIXTURES_DIR, 'tool-with-config.yaml'),
  toolWithInlineOverride: path.join(FIXTURES_DIR, 'tool-with-inline-override.yaml'),
  validToolConfig: path.join(FIXTURES_DIR, 'valid-tool-config.yaml'),

  // Simple templates
  codeReviewer: path.join(FIXTURES_DIR, 'code-reviewer.yaml'),
  validTemplate: path.join(FIXTURES_DIR, 'valid-template.yaml'),
};

// ============================================================================
// TESTS: resolveTemplate() - Full Pipeline
// ============================================================================

describe('resolveTemplate', () => {
  describe('simple templates (no inheritance)', () => {
    it('should resolve a simple template without inheritance', async () => {
      const template = await loadTemplate(FIXTURE_PATHS.validTemplate);
      const resolved = await resolveTemplate(template);

      expect(resolved).toBeDefined();
      expect(resolved.prompt).toBeTruthy();
      expect(resolved.tools).toBeInstanceOf(Array);
      expect(resolved.tools.length).toBeGreaterThan(0);
      expect(resolved.toolConfigs).toBeDefined();
      expect(resolved.settings).toBeDefined();
      expect(resolved.settings.model).toBeTruthy();
      expect(resolved.runtime).toBeDefined();
      expect(resolved.runtime.workingDirectory).toBeTruthy();
    });

    it('should resolve code-reviewer template with variables', async () => {
      const template = await loadTemplate(FIXTURE_PATHS.codeReviewer);
      const resolved = await resolveTemplate(template, {
        file: 'src/index.ts',
        concern: 'security',
      });

      expect(resolved.prompt).toContain('src/index.ts');
      expect(resolved.prompt).toContain('security');
      expect(resolved.tools).toEqual(['Read', 'Grep', 'Write']);
    });

    it('should apply default model if not specified', async () => {
      const template = await loadTemplate(FIXTURE_PATHS.validTemplate);
      const resolved = await resolveTemplate(template);

      expect(resolved.settings.model).toBe('claude-sonnet-4-5-20250929');
    });

    it('should resolve model shorthand to full model ID', async () => {
      const template = await loadTemplate(FIXTURE_PATHS.baseTemplate);
      const resolved = await resolveTemplate(template);

      expect(resolved.settings.model).toBe('claude-sonnet-4-5-20250929');
    });

    it('should include template metadata as built-in variables', async () => {
      const template = await loadTemplate(FIXTURE_PATHS.validTemplate);
      const resolved = await resolveTemplate(template, {
        greeting: 'Hello {{ templateName }} v{{ templateVersion }}',
      });

      // Variables are available during interpolation
      expect(template.metadata.name).toBe('test-agent');
      expect(template.metadata.version).toBe('1.0.0');
    });
  });

  describe('with variable interpolation', () => {
    it('should interpolate variables in prompt', async () => {
      const template = await loadTemplate(FIXTURE_PATHS.codeReviewer);
      const resolved = await resolveTemplate(template, {
        file: '/path/to/file.ts',
        concern: 'performance',
      });

      expect(resolved.prompt).toContain('/path/to/file.ts');
      expect(resolved.prompt).toContain('performance');
    });

    it('should interpolate variables in runtime workingDirectory', async () => {
      const template = await loadTemplate(FIXTURE_PATHS.codeReviewer);
      const cwd = process.cwd();
      const resolved = await resolveTemplate(template, {
        file: 'test.ts',
        concern: 'security',
      });

      expect(resolved.runtime.workingDirectory).toBe(cwd);
    });

    it('should handle missing optional variables gracefully', async () => {
      const template = await loadTemplate(FIXTURE_PATHS.codeReviewer);
      const resolved = await resolveTemplate(template, {
        file: 'test.ts',
        concern: 'security',
        // outputFormat is optional with default
      });

      expect(resolved).toBeDefined();
    });
  });
});

// ============================================================================
// TESTS: resolveExtends() - Inheritance
// ============================================================================

describe('resolveExtends', () => {
  describe('single-level inheritance', () => {
    it('should resolve child extending parent', async () => {
      const childTemplate = await loadTemplate(FIXTURE_PATHS.childTemplate);
      const resolved = await resolveExtends(childTemplate, FIXTURES_DIR);

      expect(resolved).toBeDefined();
      expect(resolved.metadata.extends).toBeUndefined(); // extends removed
    });

    it('should merge parent prompt with child prompt (append)', async () => {
      const childTemplate = await loadTemplate(FIXTURE_PATHS.childTemplate);
      const resolved = await resolveExtends(childTemplate, FIXTURES_DIR);

      expect(resolved.agent.prompt).toContain('You are a code analysis agent');
      expect(resolved.agent.prompt).toContain('Follow best practices');
      expect(resolved.agent.prompt).toContain('Focus on code quality and security');
    });

    it('should merge parent and child tools (union)', async () => {
      const childTemplate = await loadTemplate(FIXTURE_PATHS.childTemplate);
      const resolved = await resolveExtends(childTemplate, FIXTURES_DIR);

      // Parent has: Read, Grep
      // Child has: Write
      // Result should be: Read, Grep, Write
      const toolNames = resolved.agent.tools;
      expect(toolNames).toContain('Read');
      expect(toolNames).toContain('Grep');
      expect(toolNames).toContain('Write');
      expect(toolNames.length).toBe(3);
    });

    it('should merge settings (child overrides parent)', async () => {
      const childTemplate = await loadTemplate(FIXTURE_PATHS.childTemplate);
      const resolved = await resolveExtends(childTemplate, FIXTURES_DIR);

      // Parent has: model=sonnet, temperature=0.3, maxTurns=10
      // Child has: maxTurns=5
      // Result: model=sonnet, temperature=0.3, maxTurns=5
      expect(resolved.agent.settings?.model).toBe('sonnet');
      expect(resolved.agent.settings?.temperature).toBe(0.3);
      expect(resolved.agent.settings?.maxTurns).toBe(5);
    });

    it('should override child description over parent', async () => {
      const childTemplate = await loadTemplate(FIXTURE_PATHS.childTemplate);
      const resolved = await resolveExtends(childTemplate, FIXTURES_DIR);

      expect(resolved.agent.description).toBe('Child agent with additional tools');
    });
  });

  describe('multi-level inheritance (2-3 levels)', () => {
    it('should resolve grandchild -> child -> base chain', async () => {
      const grandchildTemplate = await loadTemplate(FIXTURE_PATHS.grandchildTemplate);
      const resolved = await resolveExtends(grandchildTemplate, FIXTURES_DIR);

      expect(resolved).toBeDefined();
      expect(resolved.metadata.extends).toBeUndefined();
    });

    it('should merge prompts across 3 levels', async () => {
      const grandchildTemplate = await loadTemplate(FIXTURE_PATHS.grandchildTemplate);
      const resolved = await resolveExtends(grandchildTemplate, FIXTURES_DIR);

      // Base prompt
      expect(resolved.agent.prompt).toContain('You are a code analysis agent');
      // Child prompt
      expect(resolved.agent.prompt).toContain('Focus on code quality and security');
      // Grandchild prompt
      expect(resolved.agent.prompt).toContain('Also check for performance issues');
    });

    it('should merge tools across 3 levels', async () => {
      const grandchildTemplate = await loadTemplate(FIXTURE_PATHS.grandchildTemplate);
      const resolved = await resolveExtends(grandchildTemplate, FIXTURES_DIR);

      // Base: Read, Grep
      // Child: Write
      // Grandchild: Edit
      // Result: Read, Grep, Write, Edit
      const toolNames = resolved.agent.tools;
      expect(toolNames).toContain('Read');
      expect(toolNames).toContain('Grep');
      expect(toolNames).toContain('Write');
      expect(toolNames).toContain('Edit');
      expect(toolNames.length).toBe(4);
    });

    it('should merge settings across 3 levels with proper override', async () => {
      const grandchildTemplate = await loadTemplate(FIXTURE_PATHS.grandchildTemplate);
      const resolved = await resolveExtends(grandchildTemplate, FIXTURES_DIR);

      // Base: model=sonnet, temperature=0.3, maxTurns=10
      // Child: maxTurns=5
      // Grandchild: temperature=0.5
      // Result: model=sonnet, temperature=0.5, maxTurns=5
      expect(resolved.agent.settings?.model).toBe('sonnet');
      expect(resolved.agent.settings?.temperature).toBe(0.5);
      expect(resolved.agent.settings?.maxTurns).toBe(5);
    });
  });

  describe('circular inheritance detection', () => {
    it('should detect circular inheritance (A -> B -> A)', async () => {
      const circularTemplate = await loadTemplate(FIXTURE_PATHS.circularA);

      await expect(async () => {
        await resolveExtends(circularTemplate, FIXTURES_DIR);
      }).rejects.toThrow(CircularInheritanceError);
    });

    it('should provide helpful error message for circular inheritance', async () => {
      const circularTemplate = await loadTemplate(FIXTURE_PATHS.circularA);

      try {
        await resolveExtends(circularTemplate, FIXTURES_DIR);
        expect.fail('Should have thrown CircularInheritanceError');
      } catch (error) {
        expect(error).toBeInstanceOf(CircularInheritanceError);
        expect((error as Error).message).toContain('Circular inheritance detected');
      }
    });
  });

  describe('templates without extends', () => {
    it('should return template as-is if no extends field', async () => {
      const template = await loadTemplate(FIXTURE_PATHS.baseTemplate);
      const resolved = await resolveExtends(template, FIXTURES_DIR);

      expect(resolved).toEqual(template);
    });
  });

  describe('error handling', () => {
    it('should throw error if parent template not found', async () => {
      const badTemplate: AgentTemplate = {
        metadata: {
          name: 'bad-template',
          version: '1.0.0',
          description: 'Bad template',
          extends: './non-existent-parent.yaml',
        },
        agent: {
          description: 'Bad',
          prompt: 'Bad',
          tools: ['Read'],
        },
      };

      await expect(async () => {
        await resolveExtends(badTemplate, FIXTURES_DIR);
      }).rejects.toThrow(TemplateResolutionError);
    });
  });
});

// ============================================================================
// TESTS: resolveFragments() - Mixin Composition
// ============================================================================

describe('resolveFragments', () => {
  describe('fragment mixing', () => {
    it('should mix fragment into template prompt', async () => {
      const template = await loadTemplate(FIXTURE_PATHS.fragmentMixin);
      const prompt = await resolveFragments(template, FIXTURES_DIR);

      expect(prompt).toContain('Main template prompt');
      expect(prompt).toContain('Test instructions for fragment loading');
    });

    it('should append fragment after template prompt', async () => {
      const template = await loadTemplate(FIXTURE_PATHS.fragmentMixin);
      const prompt = await resolveFragments(template, FIXTURES_DIR);

      // Main prompt should come first
      const mainIndex = prompt.indexOf('Main template prompt');
      const fragmentIndex = prompt.indexOf('Test instructions');
      expect(mainIndex).toBeLessThan(fragmentIndex);
    });

    it('should handle templates with no mixins', async () => {
      const template = await loadTemplate(FIXTURE_PATHS.validTemplate);
      const prompt = await resolveFragments(template, FIXTURES_DIR);

      expect(prompt).toBe(template.agent.prompt);
    });

    it('should handle templates with empty mixins array', async () => {
      const template = await loadTemplate(FIXTURE_PATHS.validTemplate);
      template.metadata.mixins = [];
      const prompt = await resolveFragments(template, FIXTURES_DIR);

      expect(prompt).toBe(template.agent.prompt);
    });
  });

  describe('error handling', () => {
    it('should throw error if fragment file not found', async () => {
      const badTemplate: AgentTemplate = {
        metadata: {
          name: 'bad-mixin',
          version: '1.0.0',
          description: 'Bad mixin',
          mixins: ['./non-existent-fragment.yaml'],
        },
        agent: {
          description: 'Bad',
          prompt: 'Bad',
          tools: ['Read'],
        },
      };

      await expect(async () => {
        await resolveFragments(badTemplate, FIXTURES_DIR);
      }).rejects.toThrow(TemplateResolutionError);
    });
  });
});

// ============================================================================
// TESTS: resolveToolConfigs() - Tool Configuration
// ============================================================================

describe('resolveToolConfigs', () => {
  describe('template-level configs', () => {
    it('should load tool configs from toolConfigs array', async () => {
      const template = await loadTemplate(FIXTURE_PATHS.toolWithConfig);
      const configs = await resolveToolConfigs(template, FIXTURES_DIR);

      expect(configs).toBeDefined();
      expect(configs.Write).toBeDefined();
      expect(configs.Write.tool.name).toBe('Write');
      expect(configs.Write.tool.permissions?.requireConfirmation).toBe(true);
    });

    it('should create empty config for tools without config', async () => {
      const template = await loadTemplate(FIXTURE_PATHS.toolWithConfig);
      const configs = await resolveToolConfigs(template, FIXTURES_DIR);

      // Read tool has no config file
      expect(configs.Read).toBeDefined();
      expect(configs.Read.tool.name).toBe('Read');
    });
  });

  describe('inline config overrides', () => {
    it('should apply inline overrides to tool config', async () => {
      const template = await loadTemplate(FIXTURE_PATHS.toolWithInlineOverride);
      const configs = await resolveToolConfigs(template, FIXTURES_DIR);

      expect(configs.Write).toBeDefined();
      // Base config has requireConfirmation: true
      // Inline override sets it to false
      expect(configs.Write.tool.permissions?.requireConfirmation).toBe(false);
      // Base config has maxFileSize: 1048576
      // Inline override sets it to 2097152
      expect(configs.Write.tool.validation?.maxFileSize).toBe(2097152);
    });

    it('should preserve base config values not overridden', async () => {
      const template = await loadTemplate(FIXTURE_PATHS.toolWithInlineOverride);
      const configs = await resolveToolConfigs(template, FIXTURES_DIR);

      // allowedPaths from base config should be preserved
      expect(configs.Write.tool.permissions?.allowedPaths).toEqual([
        'src/**',
        'tests/**',
      ]);
    });
  });

  describe('tool reference with config path', () => {
    it('should load config from tool reference config field', async () => {
      const template = await loadTemplate(FIXTURE_PATHS.toolWithInlineOverride);
      const configs = await resolveToolConfigs(template, FIXTURES_DIR);

      // Write tool has config: ./valid-tool-config.yaml
      expect(configs.Write).toBeDefined();
      expect(configs.Write.tool.name).toBe('Write');
    });
  });

  describe('composition priority', () => {
    it('should prioritize inline overrides over template configs', async () => {
      const template = await loadTemplate(FIXTURE_PATHS.toolWithInlineOverride);
      const configs = await resolveToolConfigs(template, FIXTURES_DIR);

      // Inline override should win
      expect(configs.Write.tool.permissions?.requireConfirmation).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should throw error if tool config file not found', async () => {
      const badTemplate: AgentTemplate = {
        metadata: {
          name: 'bad-config',
          version: '1.0.0',
          description: 'Bad config',
        },
        agent: {
          description: 'Bad',
          prompt: 'Bad',
          tools: ['Read'],
          toolConfigs: ['./non-existent-config.yaml'],
        },
      };

      await expect(async () => {
        await resolveToolConfigs(badTemplate, FIXTURES_DIR);
      }).rejects.toThrow(TemplateResolutionError);
    });
  });
});

// ============================================================================
// TESTS: Edge Cases and Error Handling
// ============================================================================

describe('edge cases', () => {
  describe('settings inheritance', () => {
    it('should handle inherit: base in child settings', async () => {
      const template: AgentTemplate = {
        metadata: {
          name: 'inherit-test',
          version: '1.0.0',
          description: 'Test inherit: base',
          extends: FIXTURE_PATHS.baseTemplate,
        },
        agent: {
          description: 'Test',
          prompt: 'Test',
          tools: ['Read'],
          settings: {
            inherit: 'base',
            maxTurns: 3,
          },
        },
      };

      const resolved = await resolveExtends(template, FIXTURES_DIR);

      // Should inherit from base and override maxTurns
      expect(resolved.agent.settings?.model).toBe('sonnet');
      expect(resolved.agent.settings?.temperature).toBe(0.3);
      expect(resolved.agent.settings?.maxTurns).toBe(3);
      expect(resolved.agent.settings?.inherit).toBeUndefined(); // inherit marker removed
    });
  });

  describe('tool deduplication', () => {
    it('should not duplicate tools when merging', async () => {
      const template: AgentTemplate = {
        metadata: {
          name: 'duplicate-tools',
          version: '1.0.0',
          description: 'Test tool deduplication',
          extends: FIXTURE_PATHS.baseTemplate,
        },
        agent: {
          description: 'Test',
          prompt: 'Test',
          tools: ['Read', 'Write'], // Read is already in parent
        },
      };

      const resolved = await resolveExtends(template, FIXTURES_DIR);

      // Should have each tool only once
      const toolNames = resolved.agent.tools as string[];
      const readCount = toolNames.filter(t => t === 'Read').length;
      expect(readCount).toBe(1);
    });
  });

  describe('missing optional fields', () => {
    it('should handle template with no validation rules', async () => {
      const template = await loadTemplate(FIXTURE_PATHS.validTemplate);
      const resolved = await resolveTemplate(template);

      expect(resolved).toBeDefined();
    });

    it('should handle template with no runtime config', async () => {
      const template = await loadTemplate(FIXTURE_PATHS.validTemplate);
      delete template.runtime;
      const resolved = await resolveTemplate(template);

      expect(resolved.runtime.workingDirectory).toBeTruthy();
    });

    it('should handle template with no settings', async () => {
      const template = await loadTemplate(FIXTURE_PATHS.validTemplate);
      delete template.agent.settings;
      const resolved = await resolveTemplate(template);

      expect(resolved.settings.model).toBe('claude-sonnet-4-5-20250929');
    });
  });

  describe('absolute vs relative paths', () => {
    it('should handle absolute paths in extends', async () => {
      const absolutePath = path.resolve(FIXTURE_PATHS.baseTemplate);
      const template: AgentTemplate = {
        metadata: {
          name: 'absolute-test',
          version: '1.0.0',
          description: 'Test absolute path',
          extends: absolutePath,
        },
        agent: {
          description: 'Test',
          prompt: 'Test',
          tools: ['Read'],
        },
      };

      const resolved = await resolveExtends(template);
      expect(resolved).toBeDefined();
    });

    it('should handle relative paths with baseDir', async () => {
      const childTemplate = await loadTemplate(FIXTURE_PATHS.childTemplate);
      const resolved = await resolveExtends(childTemplate, FIXTURES_DIR);

      expect(resolved).toBeDefined();
    });
  });
});

// ============================================================================
// TESTS: Integration with Full Pipeline
// ============================================================================

describe('full resolution pipeline integration', () => {
  it('should resolve template with inheritance + fragments + configs + variables', async () => {
    // Create a complex template that uses all features
    const complexTemplate: AgentTemplate = {
      metadata: {
        name: 'complex-test',
        version: '1.0.0',
        description: 'Complex integration test',
        extends: FIXTURE_PATHS.baseTemplate,
        mixins: [FIXTURE_PATHS.validFragment],
      },
      agent: {
        description: 'Complex agent',
        prompt: 'Analyze {{ file }}',
        tools: ['Write'],
        toolConfigs: [FIXTURE_PATHS.validToolConfig],
      },
    };

    const resolved = await resolveTemplate(complexTemplate, {
      file: 'test.ts',
    });

    // Check inheritance worked
    expect(resolved.prompt).toContain('You are a code analysis agent');
    // Check fragment mixed in
    expect(resolved.prompt).toContain('Test instructions for fragment loading');
    // Check variable interpolated
    expect(resolved.prompt).toContain('test.ts');
    // Check tools merged
    expect(resolved.tools).toContain('Read');
    expect(resolved.tools).toContain('Grep');
    expect(resolved.tools).toContain('Write');
    // Check config loaded
    expect(resolved.toolConfigs.Write).toBeDefined();
  });
});
