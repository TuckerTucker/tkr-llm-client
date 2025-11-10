/**
 * Unit Tests for Template Validator
 *
 * Comprehensive test suite for schema validation of templates, fragments,
 * and tool configurations. Tests security policies and error messaging.
 *
 * @module tests/templates/validator
 * @version 1.0.0
 */

import { describe, it, expect } from 'vitest';
import {
  validateTemplate,
  validateToolConfig,
  validateFragment,
  validateVariables,
} from '../../src/templates/validator';
import type {
  AgentTemplate,
  ToolConfig,
  PromptFragment,
} from '../../src/templates/types';

// ============================================================================
// TEMPLATE VALIDATION TESTS
// ============================================================================

describe('validateTemplate', () => {
  describe('Valid Templates', () => {
    it('should pass validation for a minimal valid template', () => {
      const template: AgentTemplate = {
        metadata: {
          name: 'test-agent',
          version: '1.0.0',
          description: 'Test agent for validation',
        },
        agent: {
          description: 'A test agent',
          prompt: 'Test prompt',
          tools: ['Read'],
        },
      };

      const result = validateTemplate(template);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should pass validation for a complete template with all fields', () => {
      const template: AgentTemplate = {
        metadata: {
          name: 'full-agent',
          version: '2.1.3',
          description: 'Complete test agent',
          author: 'Test Author',
          tags: ['test', 'validation'],
          extends: './base.yml',
          mixins: ['./fragment1.yml', './fragment2.yml'],
        },
        agent: {
          description: 'Full featured agent',
          prompt: 'Review {{ file }} for {{ concern }}',
          tools: ['Read', 'Write', 'Edit', 'Bash', 'Grep', 'Glob'],
          toolConfigs: ['./configs/safe-read.yml'],
          toolBundles: ['code-edit'],
          settings: {
            model: 'sonnet',
            temperature: 0.7,
            maxTurns: 5,
            permissionMode: 'ask',
          },
        },
        validation: {
          required: ['file', 'concern'],
          optional: ['outputFormat'],
          types: {
            file: { type: 'string' },
            concern: { type: 'enum', enum: ['security', 'performance'] },
            outputFormat: { type: 'string', default: 'markdown' },
          },
        },
        runtime: {
          workingDirectory: '{{ cwd }}',
          timeout: 30000,
          logLevel: 'info',
        },
      };

      const result = validateTemplate(template);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept all valid models', () => {
      const models = ['sonnet', 'opus', 'haiku'];

      models.forEach(model => {
        const template: AgentTemplate = {
          metadata: {
            name: 'test',
            version: '1.0.0',
            description: 'Test',
          },
          agent: {
            description: 'Test',
            prompt: 'Test',
            tools: ['Read'],
            settings: { model: model as any },
          },
        };

        const result = validateTemplate(template);
        expect(result.valid).toBe(true);
      });
    });

    it('should accept temperature in valid range', () => {
      const temps = [0.0, 0.5, 1.0];

      temps.forEach(temp => {
        const template: AgentTemplate = {
          metadata: {
            name: 'test',
            version: '1.0.0',
            description: 'Test',
          },
          agent: {
            description: 'Test',
            prompt: 'Test',
            tools: ['Read'],
            settings: { temperature: temp },
          },
        };

        const result = validateTemplate(template);
        expect(result.valid).toBe(true);
      });
    });

    it('should accept all local tools', () => {
      const localTools = ['Read', 'Write', 'Edit', 'Bash', 'Grep', 'Glob'];

      const template: AgentTemplate = {
        metadata: {
          name: 'test',
          version: '1.0.0',
          description: 'Test',
        },
        agent: {
          description: 'Test',
          prompt: 'Test',
          tools: localTools,
        },
      };

      const result = validateTemplate(template);
      expect(result.valid).toBe(true);
    });

    it('should accept tool references with config objects', () => {
      const template: AgentTemplate = {
        metadata: {
          name: 'test',
          version: '1.0.0',
          description: 'Test',
        },
        agent: {
          description: 'Test',
          prompt: 'Test',
          tools: [
            'Read',
            {
              name: 'Write',
              config: './configs/safe-write.yml',
              overrides: {
                permissions: { requireConfirmation: true },
              },
            },
          ],
        },
      };

      const result = validateTemplate(template);
      expect(result.valid).toBe(true);
    });
  });

  describe('Invalid Metadata', () => {
    it('should fail when name is missing', () => {
      const template: any = {
        metadata: {
          version: '1.0.0',
          description: 'Test',
        },
        agent: {
          description: 'Test',
          prompt: 'Test',
          tools: ['Read'],
        },
      };

      const result = validateTemplate(template);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'metadata.name')).toBe(true);
    });

    it('should fail when name is empty', () => {
      const template: AgentTemplate = {
        metadata: {
          name: '  ',
          version: '1.0.0',
          description: 'Test',
        },
        agent: {
          description: 'Test',
          prompt: 'Test',
          tools: ['Read'],
        },
      };

      const result = validateTemplate(template);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'metadata.name')).toBe(true);
    });

    it('should fail when version is not semver', () => {
      const invalidVersions = ['1.0', 'v1.0.0', '1', 'latest'];

      invalidVersions.forEach(version => {
        const template: AgentTemplate = {
          metadata: {
            name: 'test',
            version,
            description: 'Test',
          },
          agent: {
            description: 'Test',
            prompt: 'Test',
            tools: ['Read'],
          },
        };

        const result = validateTemplate(template);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.field === 'metadata.version')).toBe(true);
      });
    });

    it('should accept semver with pre-release and build metadata', () => {
      const validVersions = ['1.0.0-alpha', '1.0.0-beta.1', '1.0.0+build.123'];

      validVersions.forEach(version => {
        const template: AgentTemplate = {
          metadata: {
            name: 'test',
            version,
            description: 'Test',
          },
          agent: {
            description: 'Test',
            prompt: 'Test',
            tools: ['Read'],
          },
        };

        const result = validateTemplate(template);
        expect(result.valid).toBe(true);
      });
    });

    it('should fail when description is empty', () => {
      const template: AgentTemplate = {
        metadata: {
          name: 'test',
          version: '1.0.0',
          description: '',
        },
        agent: {
          description: 'Test',
          prompt: 'Test',
          tools: ['Read'],
        },
      };

      const result = validateTemplate(template);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'metadata.description')).toBe(true);
    });

    it('should fail when extends is empty string', () => {
      const template: AgentTemplate = {
        metadata: {
          name: 'test',
          version: '1.0.0',
          description: 'Test',
          extends: '  ',
        },
        agent: {
          description: 'Test',
          prompt: 'Test',
          tools: ['Read'],
        },
      };

      const result = validateTemplate(template);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'metadata.extends')).toBe(true);
    });

    it('should fail when mixins is not an array', () => {
      const template: any = {
        metadata: {
          name: 'test',
          version: '1.0.0',
          description: 'Test',
          mixins: './fragment.yml', // Should be array
        },
        agent: {
          description: 'Test',
          prompt: 'Test',
          tools: ['Read'],
        },
      };

      const result = validateTemplate(template);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'metadata.mixins')).toBe(true);
    });

    it('should fail when mixin path is empty', () => {
      const template: AgentTemplate = {
        metadata: {
          name: 'test',
          version: '1.0.0',
          description: 'Test',
          mixins: ['./valid.yml', '  ', './another.yml'],
        },
        agent: {
          description: 'Test',
          prompt: 'Test',
          tools: ['Read'],
        },
      };

      const result = validateTemplate(template);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field.includes('mixins[1]'))).toBe(true);
    });

    it('should fail when tags is not an array', () => {
      const template: any = {
        metadata: {
          name: 'test',
          version: '1.0.0',
          description: 'Test',
          tags: 'test,validation', // Should be array
        },
        agent: {
          description: 'Test',
          prompt: 'Test',
          tools: ['Read'],
        },
      };

      const result = validateTemplate(template);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'metadata.tags')).toBe(true);
    });
  });

  describe('Invalid Agent Configuration', () => {
    it('should fail when agent description is empty', () => {
      const template: AgentTemplate = {
        metadata: {
          name: 'test',
          version: '1.0.0',
          description: 'Test',
        },
        agent: {
          description: '',
          prompt: 'Test',
          tools: ['Read'],
        },
      };

      const result = validateTemplate(template);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'agent.description')).toBe(true);
    });

    it('should fail when prompt is empty', () => {
      const template: AgentTemplate = {
        metadata: {
          name: 'test',
          version: '1.0.0',
          description: 'Test',
        },
        agent: {
          description: 'Test',
          prompt: '  ',
          tools: ['Read'],
        },
      };

      const result = validateTemplate(template);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'agent.prompt')).toBe(true);
    });

    it('should fail when tools is not an array', () => {
      const template: any = {
        metadata: {
          name: 'test',
          version: '1.0.0',
          description: 'Test',
        },
        agent: {
          description: 'Test',
          prompt: 'Test',
          tools: 'Read', // Should be array
        },
      };

      const result = validateTemplate(template);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'agent.tools')).toBe(true);
    });

    it('should fail when tools array is empty', () => {
      const template: AgentTemplate = {
        metadata: {
          name: 'test',
          version: '1.0.0',
          description: 'Test',
        },
        agent: {
          description: 'Test',
          prompt: 'Test',
          tools: [],
        },
      };

      const result = validateTemplate(template);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'agent.tools')).toBe(true);
    });

    it('should fail when tool name is invalid', () => {
      const template: AgentTemplate = {
        metadata: {
          name: 'test',
          version: '1.0.0',
          description: 'Test',
        },
        agent: {
          description: 'Test',
          prompt: 'Test',
          tools: ['Read', 'InvalidTool'],
        },
      };

      const result = validateTemplate(template);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('InvalidTool'))).toBe(true);
    });

    it('should reject network tools - WebSearch', () => {
      const template: AgentTemplate = {
        metadata: {
          name: 'test',
          version: '1.0.0',
          description: 'Test',
        },
        agent: {
          description: 'Test',
          prompt: 'Test',
          tools: ['Read', 'WebSearch'],
        },
      };

      const result = validateTemplate(template);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('WebSearch'))).toBe(true);
      expect(result.errors.some(e => e.message.toLowerCase().includes('forbidden'))).toBe(true);
    });

    it('should reject network tools - WebFetch', () => {
      const template: AgentTemplate = {
        metadata: {
          name: 'test',
          version: '1.0.0',
          description: 'Test',
        },
        agent: {
          description: 'Test',
          prompt: 'Test',
          tools: ['Read', 'WebFetch'],
        },
      };

      const result = validateTemplate(template);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('WebFetch'))).toBe(true);
    });

    it('should reject MCP tools', () => {
      const template: AgentTemplate = {
        metadata: {
          name: 'test',
          version: '1.0.0',
          description: 'Test',
        },
        agent: {
          description: 'Test',
          prompt: 'Test',
          tools: ['Read', 'mcp__some_tool'],
        },
      };

      const result = validateTemplate(template);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('mcp__'))).toBe(true);
    });

    it('should fail when model is invalid', () => {
      const template: any = {
        metadata: {
          name: 'test',
          version: '1.0.0',
          description: 'Test',
        },
        agent: {
          description: 'Test',
          prompt: 'Test',
          tools: ['Read'],
          settings: {
            model: 'gpt-4', // Not a valid model
          },
        },
      };

      const result = validateTemplate(template);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'agent.settings.model')).toBe(true);
    });

    it('should fail when temperature is out of range', () => {
      const invalidTemps = [-0.1, 1.1, 2.0];

      invalidTemps.forEach(temp => {
        const template: AgentTemplate = {
          metadata: {
            name: 'test',
            version: '1.0.0',
            description: 'Test',
          },
          agent: {
            description: 'Test',
            prompt: 'Test',
            tools: ['Read'],
            settings: { temperature: temp },
          },
        };

        const result = validateTemplate(template);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.field === 'agent.settings.temperature')).toBe(true);
      });
    });

    it('should fail when maxTurns is not positive', () => {
      const template: AgentTemplate = {
        metadata: {
          name: 'test',
          version: '1.0.0',
          description: 'Test',
        },
        agent: {
          description: 'Test',
          prompt: 'Test',
          tools: ['Read'],
          settings: { maxTurns: 0 },
        },
      };

      const result = validateTemplate(template);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'agent.settings.maxTurns')).toBe(true);
    });

    it('should fail when permissionMode is invalid', () => {
      const template: any = {
        metadata: {
          name: 'test',
          version: '1.0.0',
          description: 'Test',
        },
        agent: {
          description: 'Test',
          prompt: 'Test',
          tools: ['Read'],
          settings: { permissionMode: 'auto' },
        },
      };

      const result = validateTemplate(template);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'agent.settings.permissionMode')).toBe(true);
    });

    it('should fail when tool config path is empty', () => {
      const template: AgentTemplate = {
        metadata: {
          name: 'test',
          version: '1.0.0',
          description: 'Test',
        },
        agent: {
          description: 'Test',
          prompt: 'Test',
          tools: ['Read'],
          toolConfigs: ['./valid.yml', '  '],
        },
      };

      const result = validateTemplate(template);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field.includes('toolConfigs'))).toBe(true);
    });

    it('should fail when tool reference object missing name', () => {
      const template: any = {
        metadata: {
          name: 'test',
          version: '1.0.0',
          description: 'Test',
        },
        agent: {
          description: 'Test',
          prompt: 'Test',
          tools: [
            'Read',
            { config: './config.yml' }, // Missing name
          ],
        },
      };

      const result = validateTemplate(template);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field.includes('tools[1]'))).toBe(true);
    });
  });

  describe('Invalid Runtime Configuration', () => {
    it('should fail when timeout is too small', () => {
      const template: AgentTemplate = {
        metadata: {
          name: 'test',
          version: '1.0.0',
          description: 'Test',
        },
        agent: {
          description: 'Test',
          prompt: 'Test',
          tools: ['Read'],
        },
        runtime: {
          timeout: 500, // Less than 1000ms minimum
        },
      };

      const result = validateTemplate(template);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'runtime.timeout')).toBe(true);
    });

    it('should fail when timeout is too large', () => {
      const template: AgentTemplate = {
        metadata: {
          name: 'test',
          version: '1.0.0',
          description: 'Test',
        },
        agent: {
          description: 'Test',
          prompt: 'Test',
          tools: ['Read'],
        },
        runtime: {
          timeout: 700000, // Greater than 600000ms (10 min)
        },
      };

      const result = validateTemplate(template);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'runtime.timeout')).toBe(true);
    });

    it('should fail when logLevel is invalid', () => {
      const template: any = {
        metadata: {
          name: 'test',
          version: '1.0.0',
          description: 'Test',
        },
        agent: {
          description: 'Test',
          prompt: 'Test',
          tools: ['Read'],
        },
        runtime: {
          logLevel: 'verbose', // Not valid
        },
      };

      const result = validateTemplate(template);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'runtime.logLevel')).toBe(true);
    });

    it('should fail when workingDirectory is empty', () => {
      const template: AgentTemplate = {
        metadata: {
          name: 'test',
          version: '1.0.0',
          description: 'Test',
        },
        agent: {
          description: 'Test',
          prompt: 'Test',
          tools: ['Read'],
        },
        runtime: {
          workingDirectory: '  ',
        },
      };

      const result = validateTemplate(template);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'runtime.workingDirectory')).toBe(true);
    });
  });

  describe('Invalid Validation Rules', () => {
    it('should fail when required is not an array', () => {
      const template: any = {
        metadata: {
          name: 'test',
          version: '1.0.0',
          description: 'Test',
        },
        agent: {
          description: 'Test',
          prompt: 'Test',
          tools: ['Read'],
        },
        validation: {
          required: 'file', // Should be array
        },
      };

      const result = validateTemplate(template);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'validation.required')).toBe(true);
    });

    it('should fail when type is invalid', () => {
      const template: any = {
        metadata: {
          name: 'test',
          version: '1.0.0',
          description: 'Test',
        },
        agent: {
          description: 'Test',
          prompt: 'Test',
          tools: ['Read'],
        },
        validation: {
          types: {
            file: { type: 'text' }, // Invalid type
          },
        },
      };

      const result = validateTemplate(template);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field.includes('validation.types.file'))).toBe(true);
    });

    it('should fail when enum type lacks enum values', () => {
      const template: any = {
        metadata: {
          name: 'test',
          version: '1.0.0',
          description: 'Test',
        },
        agent: {
          description: 'Test',
          prompt: 'Test',
          tools: ['Read'],
        },
        validation: {
          types: {
            concern: { type: 'enum' }, // Missing enum array
          },
        },
      };

      const result = validateTemplate(template);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field.includes('validation.types.concern.enum'))).toBe(true);
    });

    it('should fail when max is less than min', () => {
      const template: any = {
        metadata: {
          name: 'test',
          version: '1.0.0',
          description: 'Test',
        },
        agent: {
          description: 'Test',
          prompt: 'Test',
          tools: ['Read'],
        },
        validation: {
          types: {
            count: {
              type: 'number',
              min: 10,
              max: 5, // max < min
            },
          },
        },
      };

      const result = validateTemplate(template);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field.includes('validation.types.count.max'))).toBe(true);
    });

    it('should warn when min/max used with non-number type', () => {
      const template: any = {
        metadata: {
          name: 'test',
          version: '1.0.0',
          description: 'Test',
        },
        agent: {
          description: 'Test',
          prompt: 'Test',
          tools: ['Read'],
        },
        validation: {
          types: {
            name: {
              type: 'string',
              min: 5, // min only for numbers
            },
          },
        },
      };

      const result = validateTemplate(template);
      expect(result.errors.some(e => e.severity === 'warning')).toBe(true);
    });
  });
});

// ============================================================================
// TOOL CONFIG VALIDATION TESTS
// ============================================================================

describe('validateToolConfig', () => {
  describe('Valid Tool Configs', () => {
    it('should pass validation for minimal Read tool config', () => {
      const config: ToolConfig = {
        tool: {
          name: 'Read',
        },
      };

      const result = validateToolConfig(config);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should pass validation for complete Write tool config', () => {
      const config: ToolConfig = {
        tool: {
          name: 'Write',
          defaultSettings: {
            encoding: 'utf-8',
            createDirs: false,
          },
          permissions: {
            allowedPaths: ['src/**/*.ts', 'tests/**/*.test.ts'],
            deniedPaths: ['**/node_modules/**', '**/.env*'],
            requireConfirmation: ['**/*.config.*'],
            rateLimits: {
              requestsPerMinute: 10,
              requestsPerHour: 100,
            },
          },
          validation: {
            checkDiskSpace: true,
            minimumFreeSpace: 104857600,
            verifyWritePermissions: true,
            maxFileSize: 5242880,
            allowedExtensions: ['.ts', '.js', '.md'],
          },
          errorHandling: {
            retryAttempts: 2,
            retryDelayMs: 1000,
            fallbackBehavior: 'throw',
            onExisting: 'ask',
            onError: 'throw',
          },
          extends: './base-write.yml',
        },
      };

      const result = validateToolConfig(config);
      expect(result.valid).toBe(true);
      // Should have warnings but no errors
      expect(result.errors.filter(e => e.severity === 'error')).toHaveLength(0);
    });

    it('should accept all local tool names', () => {
      const localTools = ['Read', 'Write', 'Edit', 'Bash', 'Grep', 'Glob'];

      localTools.forEach(toolName => {
        const config: ToolConfig = {
          tool: { name: toolName },
        };

        const result = validateToolConfig(config);
        expect(result.valid).toBe(true);
      });
    });

    it('should accept Bash tool with command permissions', () => {
      const config: ToolConfig = {
        tool: {
          name: 'Bash',
          permissions: {
            allowedCommands: ['git status', 'npm test', 'ls'],
            deniedPatterns: ['rm -rf *', 'sudo *'],
            requireConfirmation: ['git push'],
          },
        },
      };

      const result = validateToolConfig(config);
      expect(result.valid).toBe(true);
    });

    it('should accept glob patterns in paths', () => {
      const config: ToolConfig = {
        tool: {
          name: 'Read',
          permissions: {
            allowedPaths: [
              '**/*.ts',
              'src/**',
              '*.json',
              'tests/**/*.test.ts',
            ],
            deniedPaths: [
              '**/node_modules/**',
              '**/.git/**',
              '**/.env*',
            ],
          },
        },
      };

      const result = validateToolConfig(config);
      expect(result.valid).toBe(true);
    });
  });

  describe('Invalid Tool Names', () => {
    it('should reject invalid tool name', () => {
      const config: ToolConfig = {
        tool: {
          name: 'InvalidTool',
        },
      };

      const result = validateToolConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'tool.name')).toBe(true);
      expect(result.errors.some(e => e.message.includes('InvalidTool'))).toBe(true);
    });

    it('should reject missing tool name', () => {
      const config: any = {
        tool: {},
      };

      const result = validateToolConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'tool.name')).toBe(true);
    });

    it('should reject network tool - WebSearch', () => {
      const config: any = {
        tool: {
          name: 'WebSearch',
        },
      };

      const result = validateToolConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.toLowerCase().includes('forbidden'))).toBe(true);
    });

    it('should reject network tool - WebFetch', () => {
      const config: any = {
        tool: {
          name: 'WebFetch',
        },
      };

      const result = validateToolConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('WebFetch'))).toBe(true);
    });

    it('should reject MCP tools', () => {
      const config: any = {
        tool: {
          name: 'mcp__context7__get-library-docs',
        },
      };

      const result = validateToolConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('mcp__'))).toBe(true);
    });
  });

  describe('Invalid Permissions', () => {
    it('should fail when allowedPaths is not an array', () => {
      const config: any = {
        tool: {
          name: 'Read',
          permissions: {
            allowedPaths: 'src/**/*.ts', // Should be array
          },
        },
      };

      const result = validateToolConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'tool.permissions.allowedPaths')).toBe(true);
    });

    it('should fail when deniedPaths contains empty string', () => {
      const config: ToolConfig = {
        tool: {
          name: 'Read',
          permissions: {
            deniedPaths: ['**/node_modules/**', '  '],
          },
        },
      };

      const result = validateToolConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field.includes('deniedPaths'))).toBe(true);
    });

    it('should warn when allowedCommands used with non-Bash tool', () => {
      const config: ToolConfig = {
        tool: {
          name: 'Read',
          permissions: {
            allowedCommands: ['ls'], // Only for Bash
          },
        },
      };

      const result = validateToolConfig(config);
      expect(result.errors.some(e => e.severity === 'warning')).toBe(true);
    });

    it('should warn when deniedPatterns used with non-Bash tool', () => {
      const config: ToolConfig = {
        tool: {
          name: 'Write',
          permissions: {
            deniedPatterns: ['sudo *'], // Only for Bash
          },
        },
      };

      const result = validateToolConfig(config);
      expect(result.errors.some(e => e.severity === 'warning')).toBe(true);
    });

    it('should fail when requireConfirmation is invalid type', () => {
      const config: any = {
        tool: {
          name: 'Write',
          permissions: {
            requireConfirmation: 'yes', // Should be boolean or array
          },
        },
      };

      const result = validateToolConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'tool.permissions.requireConfirmation')).toBe(true);
    });

    it('should fail when rate limit is not positive', () => {
      const config: ToolConfig = {
        tool: {
          name: 'Grep',
          permissions: {
            rateLimits: {
              requestsPerMinute: 0,
            },
          },
        },
      };

      const result = validateToolConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field.includes('rateLimits'))).toBe(true);
    });

    it('should warn when requestsPerMinute * 60 exceeds requestsPerHour', () => {
      const config: ToolConfig = {
        tool: {
          name: 'Grep',
          permissions: {
            rateLimits: {
              requestsPerMinute: 100,
              requestsPerHour: 100, // 100/min * 60 = 6000 > 100/hour
            },
          },
        },
      };

      const result = validateToolConfig(config);
      expect(result.errors.some(e => e.severity === 'warning')).toBe(true);
    });
  });

  describe('Invalid Validation Rules', () => {
    it('should fail when maxFileSize is not positive', () => {
      const config: ToolConfig = {
        tool: {
          name: 'Write',
          validation: {
            maxFileSize: 0,
          },
        },
      };

      const result = validateToolConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'tool.validation.maxFileSize')).toBe(true);
    });

    it('should warn when maxFileSize exceeds 100MB', () => {
      const config: ToolConfig = {
        tool: {
          name: 'Write',
          validation: {
            maxFileSize: 200000000, // 200MB
          },
        },
      };

      const result = validateToolConfig(config);
      expect(result.errors.some(e => e.severity === 'warning')).toBe(true);
    });

    it('should fail when minimumFreeSpace is not positive', () => {
      const config: ToolConfig = {
        tool: {
          name: 'Write',
          validation: {
            minimumFreeSpace: -1000,
          },
        },
      };

      const result = validateToolConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'tool.validation.minimumFreeSpace')).toBe(true);
    });

    it('should fail when allowedExtensions is not an array', () => {
      const config: any = {
        tool: {
          name: 'Read',
          validation: {
            allowedExtensions: '.ts,.js', // Should be array
          },
        },
      };

      const result = validateToolConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'tool.validation.allowedExtensions')).toBe(true);
    });

    it('should warn when extension does not start with dot', () => {
      const config: ToolConfig = {
        tool: {
          name: 'Read',
          validation: {
            allowedExtensions: ['.ts', 'js'], // Second one missing dot
          },
        },
      };

      const result = validateToolConfig(config);
      expect(result.errors.some(e => e.severity === 'warning')).toBe(true);
    });
  });

  describe('Invalid Error Handling', () => {
    it('should fail when retryAttempts is negative', () => {
      const config: ToolConfig = {
        tool: {
          name: 'Read',
          errorHandling: {
            retryAttempts: -1,
          },
        },
      };

      const result = validateToolConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'tool.errorHandling.retryAttempts')).toBe(true);
    });

    it('should warn when retryAttempts is excessive', () => {
      const config: ToolConfig = {
        tool: {
          name: 'Read',
          errorHandling: {
            retryAttempts: 20,
          },
        },
      };

      const result = validateToolConfig(config);
      expect(result.errors.some(e => e.severity === 'warning')).toBe(true);
    });

    it('should fail when retryDelayMs exceeds timeout', () => {
      const config: ToolConfig = {
        tool: {
          name: 'Read',
          errorHandling: {
            retryDelayMs: 700000, // > 600000ms max
          },
        },
      };

      const result = validateToolConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'tool.errorHandling.retryDelayMs')).toBe(true);
    });

    it('should fail when fallbackBehavior is invalid', () => {
      const config: any = {
        tool: {
          name: 'Read',
          errorHandling: {
            fallbackBehavior: 'retry', // Invalid
          },
        },
      };

      const result = validateToolConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'tool.errorHandling.fallbackBehavior')).toBe(true);
    });

    it('should fail when onExisting is invalid', () => {
      const config: any = {
        tool: {
          name: 'Write',
          errorHandling: {
            onExisting: 'replace', // Invalid
          },
        },
      };

      const result = validateToolConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'tool.errorHandling.onExisting')).toBe(true);
    });

    it('should fail when onError is invalid', () => {
      const config: any = {
        tool: {
          name: 'Read',
          errorHandling: {
            onError: 'warn', // Invalid
          },
        },
      };

      const result = validateToolConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'tool.errorHandling.onError')).toBe(true);
    });
  });
});

// ============================================================================
// FRAGMENT VALIDATION TESTS
// ============================================================================

describe('validateFragment', () => {
  describe('Valid Fragments', () => {
    it('should pass validation for minimal valid fragment', () => {
      const fragment: PromptFragment = {
        fragment: {
          name: 'safety-checks',
          instructions: 'Always verify file exists before writing',
        },
      };

      const result = validateFragment(fragment);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should pass validation for complete fragment', () => {
      const fragment: PromptFragment = {
        fragment: {
          name: 'error-handling',
          instructions: 'Handle errors gracefully',
          example: 'try { ... } catch (err) { ... }',
          validation: 'Ensure all errors are caught',
          safetyChecks: 'Never expose sensitive data in errors',
        },
      };

      const result = validateFragment(fragment);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Invalid Fragments', () => {
    it('should fail when fragment object is missing', () => {
      const fragment: any = {};

      const result = validateFragment(fragment);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'fragment')).toBe(true);
    });

    it('should fail when name is missing', () => {
      const fragment: any = {
        fragment: {
          instructions: 'Test instructions',
        },
      };

      const result = validateFragment(fragment);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'fragment.name')).toBe(true);
    });

    it('should fail when name is empty', () => {
      const fragment: PromptFragment = {
        fragment: {
          name: '  ',
          instructions: 'Test',
        },
      };

      const result = validateFragment(fragment);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'fragment.name')).toBe(true);
    });

    it('should fail when instructions are missing', () => {
      const fragment: any = {
        fragment: {
          name: 'test',
        },
      };

      const result = validateFragment(fragment);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'fragment.instructions')).toBe(true);
    });

    it('should fail when instructions are empty', () => {
      const fragment: PromptFragment = {
        fragment: {
          name: 'test',
          instructions: '',
        },
      };

      const result = validateFragment(fragment);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'fragment.instructions')).toBe(true);
    });

    it('should fail when optional fields have wrong type', () => {
      const fragment: any = {
        fragment: {
          name: 'test',
          instructions: 'Test',
          example: 123, // Should be string
        },
      };

      const result = validateFragment(fragment);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'fragment.example')).toBe(true);
    });
  });
});

// ============================================================================
// VARIABLE VALIDATION TESTS
// ============================================================================

describe('validateVariables', () => {
  describe('Valid Variables', () => {
    it('should pass when no validation rules defined', () => {
      const template: AgentTemplate = {
        metadata: {
          name: 'test',
          version: '1.0.0',
          description: 'Test',
        },
        agent: {
          description: 'Test',
          prompt: 'Test',
          tools: ['Read'],
        },
      };

      const result = validateVariables(template, {});
      expect(result.valid).toBe(true);
    });

    it('should pass when all required variables provided', () => {
      const template: AgentTemplate = {
        metadata: {
          name: 'test',
          version: '1.0.0',
          description: 'Test',
        },
        agent: {
          description: 'Test',
          prompt: 'Review {{ file }}',
          tools: ['Read'],
        },
        validation: {
          required: ['file'],
        },
      };

      const result = validateVariables(template, { file: 'src/index.ts' });
      expect(result.valid).toBe(true);
    });

    it('should pass when variable types match', () => {
      const template: AgentTemplate = {
        metadata: {
          name: 'test',
          version: '1.0.0',
          description: 'Test',
        },
        agent: {
          description: 'Test',
          prompt: 'Test',
          tools: ['Read'],
        },
        validation: {
          types: {
            file: { type: 'string' },
            count: { type: 'number' },
            enabled: { type: 'boolean' },
            items: { type: 'array' },
          },
        },
      };

      const result = validateVariables(template, {
        file: 'test.ts',
        count: 42,
        enabled: true,
        items: [1, 2, 3],
      });
      expect(result.valid).toBe(true);
    });

    it('should pass when enum value is valid', () => {
      const template: AgentTemplate = {
        metadata: {
          name: 'test',
          version: '1.0.0',
          description: 'Test',
        },
        agent: {
          description: 'Test',
          prompt: 'Test',
          tools: ['Read'],
        },
        validation: {
          types: {
            concern: {
              type: 'enum',
              enum: ['security', 'performance', 'quality'],
            },
          },
        },
      };

      const result = validateVariables(template, { concern: 'security' });
      expect(result.valid).toBe(true);
    });

    it('should pass when number is in range', () => {
      const template: AgentTemplate = {
        metadata: {
          name: 'test',
          version: '1.0.0',
          description: 'Test',
        },
        agent: {
          description: 'Test',
          prompt: 'Test',
          tools: ['Read'],
        },
        validation: {
          types: {
            count: {
              type: 'number',
              min: 1,
              max: 100,
            },
          },
        },
      };

      const result = validateVariables(template, { count: 50 });
      expect(result.valid).toBe(true);
    });
  });

  describe('Invalid Variables', () => {
    it('should fail when required variable is missing', () => {
      const template: AgentTemplate = {
        metadata: {
          name: 'test',
          version: '1.0.0',
          description: 'Test',
        },
        agent: {
          description: 'Test',
          prompt: 'Review {{ file }}',
          tools: ['Read'],
        },
        validation: {
          required: ['file', 'concern'],
        },
      };

      const result = validateVariables(template, { file: 'test.ts' });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('concern'))).toBe(true);
    });

    it('should fail when variable type does not match - string expected', () => {
      const template: AgentTemplate = {
        metadata: {
          name: 'test',
          version: '1.0.0',
          description: 'Test',
        },
        agent: {
          description: 'Test',
          prompt: 'Test',
          tools: ['Read'],
        },
        validation: {
          types: {
            file: { type: 'string' },
          },
        },
      };

      const result = validateVariables(template, { file: 123 });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'variables.file')).toBe(true);
    });

    it('should fail when variable type does not match - number expected', () => {
      const template: AgentTemplate = {
        metadata: {
          name: 'test',
          version: '1.0.0',
          description: 'Test',
        },
        agent: {
          description: 'Test',
          prompt: 'Test',
          tools: ['Read'],
        },
        validation: {
          types: {
            count: { type: 'number' },
          },
        },
      };

      const result = validateVariables(template, { count: 'five' });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'variables.count')).toBe(true);
    });

    it('should fail when enum value is not in allowed list', () => {
      const template: AgentTemplate = {
        metadata: {
          name: 'test',
          version: '1.0.0',
          description: 'Test',
        },
        agent: {
          description: 'Test',
          prompt: 'Test',
          tools: ['Read'],
        },
        validation: {
          types: {
            concern: {
              type: 'enum',
              enum: ['security', 'performance'],
            },
          },
        },
      };

      const result = validateVariables(template, { concern: 'quality' });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('quality'))).toBe(true);
    });

    it('should fail when number is below minimum', () => {
      const template: AgentTemplate = {
        metadata: {
          name: 'test',
          version: '1.0.0',
          description: 'Test',
        },
        agent: {
          description: 'Test',
          prompt: 'Test',
          tools: ['Read'],
        },
        validation: {
          types: {
            count: {
              type: 'number',
              min: 10,
            },
          },
        },
      };

      const result = validateVariables(template, { count: 5 });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('minimum'))).toBe(true);
    });

    it('should fail when number exceeds maximum', () => {
      const template: AgentTemplate = {
        metadata: {
          name: 'test',
          version: '1.0.0',
          description: 'Test',
        },
        agent: {
          description: 'Test',
          prompt: 'Test',
          tools: ['Read'],
        },
        validation: {
          types: {
            count: {
              type: 'number',
              max: 100,
            },
          },
        },
      };

      const result = validateVariables(template, { count: 150 });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('maximum'))).toBe(true);
    });

    it('should fail when array type does not match', () => {
      const template: AgentTemplate = {
        metadata: {
          name: 'test',
          version: '1.0.0',
          description: 'Test',
        },
        agent: {
          description: 'Test',
          prompt: 'Test',
          tools: ['Read'],
        },
        validation: {
          types: {
            items: { type: 'array' },
          },
        },
      };

      const result = validateVariables(template, { items: 'not-an-array' });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'variables.items')).toBe(true);
    });

    it('should fail when unknown type rule is used', () => {
      const template: any = {
        metadata: {
          name: 'test',
          version: '1.0.0',
          description: 'Test',
        },
        agent: {
          description: 'Test',
          prompt: 'Test',
          tools: ['Read'],
        },
        validation: {
          types: {
            value: { type: 'unknown-type' as any },
          },
        },
      };

      const result = validateVariables(template, { value: 'test' });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Unknown type rule'))).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should reject glob pattern with null byte', () => {
      const config: ToolConfig = {
        tool: {
          name: 'Read',
          permissions: {
            allowedPaths: ['src/**\0**'],
          },
        },
      };

      const result = validateToolConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Invalid glob pattern'))).toBe(true);
    });

    it('should pass for array variable type with array value', () => {
      const template: AgentTemplate = {
        metadata: {
          name: 'test',
          version: '1.0.0',
          description: 'Test',
        },
        agent: {
          description: 'Test',
          prompt: 'Test',
          tools: ['Read'],
        },
        validation: {
          types: {
            items: { type: 'array' },
          },
        },
      };

      const result = validateVariables(template, { items: [1, 2, 3] });
      expect(result.valid).toBe(true);
    });

    it('should accept empty glob pattern for deniedPaths', () => {
      const config: ToolConfig = {
        tool: {
          name: 'Read',
          permissions: {
            deniedPaths: [],
          },
        },
      };

      const result = validateToolConfig(config);
      expect(result.valid).toBe(true);
    });

    it('should validate requireConfirmation as boolean true', () => {
      const config: ToolConfig = {
        tool: {
          name: 'Write',
          permissions: {
            requireConfirmation: true,
          },
        },
      };

      const result = validateToolConfig(config);
      expect(result.valid).toBe(true);
    });

    it('should validate requireConfirmation as boolean false', () => {
      const config: ToolConfig = {
        tool: {
          name: 'Write',
          permissions: {
            requireConfirmation: false,
          },
        },
      };

      const result = validateToolConfig(config);
      expect(result.valid).toBe(true);
    });

    it('should fail when temperature is not a number', () => {
      const template: any = {
        metadata: {
          name: 'test',
          version: '1.0.0',
          description: 'Test',
        },
        agent: {
          description: 'Test',
          prompt: 'Test',
          tools: ['Read'],
          settings: {
            temperature: 'medium',
          },
        },
      };

      const result = validateTemplate(template);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'agent.settings.temperature')).toBe(true);
    });

    it('should fail when checkDiskSpace is not a boolean', () => {
      const config: any = {
        tool: {
          name: 'Write',
          validation: {
            checkDiskSpace: 'yes',
          },
        },
      };

      const result = validateToolConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'tool.validation.checkDiskSpace')).toBe(true);
    });

    it('should fail when verifyWritePermissions is not a boolean', () => {
      const config: any = {
        tool: {
          name: 'Write',
          validation: {
            verifyWritePermissions: 1,
          },
        },
      };

      const result = validateToolConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'tool.validation.verifyWritePermissions')).toBe(true);
    });

    it('should fail when retryDelayMs is negative', () => {
      const config: ToolConfig = {
        tool: {
          name: 'Read',
          errorHandling: {
            retryDelayMs: -100,
          },
        },
      };

      const result = validateToolConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'tool.errorHandling.retryDelayMs')).toBe(true);
    });

    it('should fail when timeout is not a number', () => {
      const template: any = {
        metadata: {
          name: 'test',
          version: '1.0.0',
          description: 'Test',
        },
        agent: {
          description: 'Test',
          prompt: 'Test',
          tools: ['Read'],
        },
        runtime: {
          timeout: '30s',
        },
      };

      const result = validateTemplate(template);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'runtime.timeout')).toBe(true);
    });

    it('should fail when rateLimits is not an object', () => {
      const config: any = {
        tool: {
          name: 'Grep',
          permissions: {
            rateLimits: 'limited',
          },
        },
      };

      const result = validateToolConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'tool.permissions.rateLimits')).toBe(true);
    });

    it('should fail when requestsPerHour is negative', () => {
      const config: ToolConfig = {
        tool: {
          name: 'Grep',
          permissions: {
            rateLimits: {
              requestsPerHour: -50,
            },
          },
        },
      };

      const result = validateToolConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field.includes('requestsPerHour'))).toBe(true);
    });

    it('should accept maxFileSize exactly at MAX_FILE_SIZE', () => {
      const config: ToolConfig = {
        tool: {
          name: 'Write',
          validation: {
            maxFileSize: 104857600, // Exactly 100MB
          },
        },
      };

      const result = validateToolConfig(config);
      expect(result.valid).toBe(true);
    });
  });
});

// ============================================================================
// ERROR MESSAGE QUALITY TESTS
// ============================================================================

describe('Error Message Quality', () => {
  it('should provide clear field paths', () => {
    const template: AgentTemplate = {
      metadata: {
        name: 'test',
        version: '1.0.0',
        description: 'Test',
      },
      agent: {
        description: 'Test',
        prompt: 'Test',
        tools: ['Read'],
        settings: {
          temperature: 2.0, // Invalid
        },
      },
    };

    const result = validateTemplate(template);
    expect(result.errors[0].field).toBe('agent.settings.temperature');
  });

  it('should include expected vs actual values', () => {
    const template: AgentTemplate = {
      metadata: {
        name: 'test',
        version: '1.0.0',
        description: 'Test',
      },
      agent: {
        description: 'Test',
        prompt: 'Test',
        tools: ['Read'],
        settings: {
          temperature: 1.5,
        },
      },
    };

    const result = validateTemplate(template);
    expect(result.errors[0].message).toContain('1.5');
    expect(result.errors[0].message).toContain('0.0');
    expect(result.errors[0].message).toContain('1.0');
  });

  it('should suggest fixes for common errors', () => {
    const config: ToolConfig = {
      tool: {
        name: 'Read',
        validation: {
          allowedExtensions: ['.ts', 'js'], // Missing dot on second
        },
      },
    };

    const result = validateToolConfig(config);
    const warning = result.errors.find(e => e.severity === 'warning');
    expect(warning?.message).toContain('should start with a dot');
  });

  it('should differentiate errors from warnings', () => {
    const config: ToolConfig = {
      tool: {
        name: 'Read',
        permissions: {
          allowedCommands: ['ls'], // Wrong tool - should be warning
        },
        errorHandling: {
          retryAttempts: 15, // Excessive - should be warning
        },
      },
    };

    const result = validateToolConfig(config);
    const warnings = result.errors.filter(e => e.severity === 'warning');
    expect(warnings.length).toBeGreaterThan(0);
  });

  it('should provide actionable error messages for forbidden tools', () => {
    const template: AgentTemplate = {
      metadata: {
        name: 'test',
        version: '1.0.0',
        description: 'Test',
      },
      agent: {
        description: 'Test',
        prompt: 'Test',
        tools: ['Read', 'WebSearch'],
      },
    };

    const result = validateTemplate(template);
    const error = result.errors.find(e => e.message.includes('WebSearch'));
    expect(error?.message).toContain('forbidden');
    expect(error?.message).toContain('Read, Write, Edit, Bash, Grep, Glob');
  });
});
