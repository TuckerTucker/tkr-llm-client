/**
 * Comprehensive Unit Tests for Variable Interpolation Engine
 *
 * Tests all interpolation patterns:
 * - Simple variables
 * - Nested properties
 * - Default values
 * - Conditionals
 * - Built-in variables
 * - Error cases
 * - Edge cases
 *
 * Target: 90%+ code coverage
 *
 * @module tests/templates/interpolation
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  interpolate,
  hasVariables,
  extractVariables,
  validateVariables,
  InterpolationError,
} from '../../src/templates/interpolation';

// ============================================================================
// SIMPLE VARIABLE INTERPOLATION TESTS
// ============================================================================

describe('interpolate() - Simple Variables', () => {
  it('should interpolate a single variable', () => {
    const result = interpolate('Hello {{ name }}', { name: 'World' });
    expect(result).toBe('Hello World');
  });

  it('should interpolate multiple variables', () => {
    const result = interpolate('{{ greeting }} {{ name }}!', {
      greeting: 'Hello',
      name: 'World',
    });
    expect(result).toBe('Hello World!');
  });

  it('should handle variables with whitespace', () => {
    const result = interpolate('{{name}} and {{  city  }}', {
      name: 'Alice',
      city: 'NYC',
    });
    expect(result).toBe('Alice and NYC');
  });

  it('should interpolate numeric values', () => {
    const result = interpolate('Count: {{ count }}', { count: 42 });
    expect(result).toBe('Count: 42');
  });

  it('should interpolate boolean values', () => {
    const result = interpolate('Enabled: {{ enabled }}', { enabled: true });
    expect(result).toBe('Enabled: true');
  });

  it('should throw error for missing variable', () => {
    expect(() => {
      interpolate('Hello {{ name }}', {});
    }).toThrow(InterpolationError);
  });

  it('should throw error with variable name in error', () => {
    try {
      interpolate('Hello {{ name }}', {});
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(InterpolationError);
      expect((error as InterpolationError).variable).toBe('name');
    }
  });
});

// ============================================================================
// NESTED PROPERTY INTERPOLATION TESTS
// ============================================================================

describe('interpolate() - Nested Properties', () => {
  it('should interpolate nested properties (1 level)', () => {
    const result = interpolate('{{ user.name }}', {
      user: { name: 'Alice' },
    });
    expect(result).toBe('Alice');
  });

  it('should interpolate nested properties (2 levels)', () => {
    const result = interpolate('{{ project.owner.name }}', {
      project: { owner: { name: 'Tucker' } },
    });
    expect(result).toBe('Tucker');
  });

  it('should interpolate nested properties (3 levels)', () => {
    const result = interpolate('{{ a.b.c.d }}', {
      a: { b: { c: { d: 'deep' } } },
    });
    expect(result).toBe('deep');
  });

  it('should handle multiple nested properties', () => {
    const result = interpolate('{{ user.name }} in {{ project.name }}', {
      user: { name: 'Alice' },
      project: { name: 'tkr-llm-client' },
    });
    expect(result).toBe('Alice in tkr-llm-client');
  });

  it('should throw error for invalid nested path', () => {
    expect(() => {
      interpolate('{{ user.name }}', { user: {} });
    }).toThrow(InterpolationError);
  });

  it('should throw error when accessing property of null', () => {
    expect(() => {
      interpolate('{{ user.name }}', { user: null });
    }).toThrow(InterpolationError);
  });

  it('should throw error when accessing property of undefined', () => {
    expect(() => {
      interpolate('{{ user.name }}', { user: undefined });
    }).toThrow(InterpolationError);
  });

  it('should throw error when accessing property of non-object', () => {
    expect(() => {
      interpolate('{{ user.name }}', { user: 'string' });
    }).toThrow(InterpolationError);
  });
});

// ============================================================================
// DEFAULT VALUE TESTS
// ============================================================================

describe('interpolate() - Default Values', () => {
  it('should use provided value when available', () => {
    const result = interpolate('{{ name | default: World }}', { name: 'Alice' });
    expect(result).toBe('Alice');
  });

  it('should use default value when variable missing', () => {
    const result = interpolate('{{ name | default: World }}', {});
    expect(result).toBe('World');
  });

  it('should handle default values with spaces', () => {
    const result = interpolate('{{ output | default: ./review.md }}', {});
    expect(result).toBe('./review.md');
  });

  it('should handle multiple default values', () => {
    const result = interpolate(
      '{{ model | default: sonnet }} at {{ temp | default: 0.7 }}',
      {}
    );
    expect(result).toBe('sonnet at 0.7');
  });

  it('should handle default values with special characters', () => {
    const result = interpolate('{{ path | default: /tmp/file-123.txt }}', {});
    expect(result).toBe('/tmp/file-123.txt');
  });

  it('should handle whitespace around default syntax', () => {
    const result = interpolate('{{  name  |  default:  World  }}', {});
    expect(result).toBe('World');
  });

  it('should override default with provided value', () => {
    const result = interpolate('{{ model | default: sonnet }}', { model: 'opus' });
    expect(result).toBe('opus');
  });

  it('should handle nested property with default', () => {
    const result = interpolate('{{ user.name | default: Unknown }}', { user: {} });
    expect(result).toBe('Unknown');
  });
});

// ============================================================================
// CONDITIONAL TESTS
// ============================================================================

describe('interpolate() - Conditionals', () => {
  it('should include content when condition is truthy', () => {
    const result = interpolate(
      'Start{{ if includeTests }}\nInclude tests{{ endif }}\nEnd',
      { includeTests: true }
    );
    expect(result).toBe('Start\nInclude tests\nEnd');
  });

  it('should exclude content when condition is falsy', () => {
    const result = interpolate(
      'Start{{ if includeTests }}\nInclude tests{{ endif }}\nEnd',
      { includeTests: false }
    );
    expect(result).toBe('Start\nEnd');
  });

  it('should handle missing condition as falsy', () => {
    const result = interpolate(
      'Start{{ if includeTests }}\nInclude tests{{ endif }}\nEnd',
      {}
    );
    expect(result).toBe('Start\nEnd');
  });

  it('should handle multiple conditionals', () => {
    const result = interpolate(
      '{{ if a }}A{{ endif }}{{ if b }}B{{ endif }}',
      { a: true, b: true }
    );
    expect(result).toBe('AB');
  });

  it('should handle nested conditionals', () => {
    const result = interpolate(
      '{{ if outer }}Outer{{ if inner }}Inner{{ endif }}{{ endif }}',
      { outer: true, inner: true }
    );
    expect(result).toBe('OuterInner');
  });

  it('should handle conditional with variables inside', () => {
    const result = interpolate(
      '{{ if enabled }}Status: {{ status }}{{ endif }}',
      { enabled: true, status: 'Active' }
    );
    expect(result).toBe('Status: Active');
  });

  it('should handle truthy string values', () => {
    const result = interpolate('{{ if name }}Hello{{ endif }}', { name: 'Alice' });
    expect(result).toBe('Hello');
  });

  it('should handle falsy number zero', () => {
    const result = interpolate('{{ if count }}Has items{{ endif }}', { count: 0 });
    expect(result).toBe('');
  });

  it('should handle truthy number non-zero', () => {
    const result = interpolate('{{ if count }}Has items{{ endif }}', { count: 5 });
    expect(result).toBe('Has items');
  });

  it('should handle whitespace in conditionals', () => {
    const result = interpolate(
      '{{  if  enabled  }}Active{{  endif  }}',
      { enabled: true }
    );
    expect(result).toBe('Active');
  });
});

// ============================================================================
// BUILT-IN VARIABLES TESTS
// ============================================================================

describe('interpolate() - Built-in Variables', () => {
  it('should provide cwd built-in variable', () => {
    const result = interpolate('Working directory: {{ cwd }}', {});
    expect(result).toContain('Working directory: ');
    expect(result).toBe(`Working directory: ${process.cwd()}`);
  });

  it('should provide timestamp built-in variable', () => {
    const result = interpolate('Timestamp: {{ timestamp }}', {});
    expect(result).toMatch(/Timestamp: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('should provide date built-in variable', () => {
    const result = interpolate('Date: {{ date }}', {});
    expect(result).toMatch(/Date: \d{4}-\d{2}-\d{2}/);
  });

  it('should provide time built-in variable', () => {
    const result = interpolate('Time: {{ time }}', {});
    expect(result).toMatch(/Time: \d{2}:\d{2}:\d{2}/);
  });

  it('should allow overriding built-in variables', () => {
    const result = interpolate('{{ cwd }}', { cwd: '/custom/path' });
    expect(result).toBe('/custom/path');
  });

  it('should combine built-in and custom variables', () => {
    const result = interpolate('{{ name }} at {{ cwd }}', { name: 'Test' });
    expect(result).toBe(`Test at ${process.cwd()}`);
  });
});

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================

describe('interpolate() - Error Handling', () => {
  it('should throw InterpolationError for missing variable', () => {
    expect(() => {
      interpolate('{{ missing }}', {});
    }).toThrow(InterpolationError);
  });

  it('should throw InterpolationError for invalid nested path', () => {
    expect(() => {
      interpolate('{{ user.profile.name }}', { user: {} });
    }).toThrow(InterpolationError);
  });

  it('should include variable name in error', () => {
    try {
      interpolate('{{ missing }}', {});
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(InterpolationError);
      expect((error as InterpolationError).variable).toBe('missing');
    }
  });

  it('should include path in error for nested properties', () => {
    try {
      interpolate('{{ user.profile.name }}', { user: {} });
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(InterpolationError);
      expect((error as InterpolationError).variable).toBe('user.profile.name');
    }
  });

  it('should throw for circular reference', () => {
    expect(() => {
      interpolate('{{ a }}', { a: '{{ a }}' });
    }).toThrow(InterpolationError);
  });

  it('should detect circular reference in nested variables', () => {
    expect(() => {
      interpolate('{{ a }}{{ b }}', { a: '{{ b }}', b: '{{ a }}' });
    }).toThrow(InterpolationError);
  });
});

// ============================================================================
// EDGE CASES TESTS
// ============================================================================

describe('interpolate() - Edge Cases', () => {
  it('should handle empty template', () => {
    const result = interpolate('', {});
    expect(result).toBe('');
  });

  it('should handle template with no variables', () => {
    const result = interpolate('No variables here', {});
    expect(result).toBe('No variables here');
  });

  it('should handle empty string variable value', () => {
    const result = interpolate('{{ name }}', { name: '' });
    expect(result).toBe('');
  });

  it('should handle multiline templates', () => {
    const template = `Line 1: {{ a }}
Line 2: {{ b }}
Line 3: {{ c }}`;
    const result = interpolate(template, { a: 'A', b: 'B', c: 'C' });
    expect(result).toBe('Line 1: A\nLine 2: B\nLine 3: C');
  });

  it('should handle special characters in values', () => {
    const result = interpolate('{{ text }}', { text: 'Special: $@#%^&*()' });
    expect(result).toBe('Special: $@#%^&*()');
  });

  it('should handle unicode characters', () => {
    const result = interpolate('{{ emoji }}', { emoji: '🚀' });
    expect(result).toBe('🚀');
  });

  it('should handle variables at start and end of template', () => {
    const result = interpolate('{{ start }} middle {{ end }}', {
      start: 'Begin',
      end: 'Finish',
    });
    expect(result).toBe('Begin middle Finish');
  });

  it('should handle adjacent variables', () => {
    const result = interpolate('{{ a }}{{ b }}{{ c }}', { a: 'A', b: 'B', c: 'C' });
    expect(result).toBe('ABC');
  });

  it('should preserve spacing around variables', () => {
    const result = interpolate('  {{ name }}  ', { name: 'Test' });
    expect(result).toBe('  Test  ');
  });

  it('should handle null values', () => {
    const result = interpolate('{{ value }}', { value: null });
    expect(result).toBe('null');
  });

  it('should handle object values by stringifying', () => {
    const result = interpolate('{{ obj }}', { obj: { key: 'value' } });
    expect(result).toBe('[object Object]');
  });

  it('should handle array values by stringifying', () => {
    const result = interpolate('{{ arr }}', { arr: [1, 2, 3] });
    expect(result).toBe('1,2,3');
  });
});

// ============================================================================
// hasVariables() TESTS
// ============================================================================

describe('hasVariables()', () => {
  it('should return true for template with variables', () => {
    expect(hasVariables('Hello {{ name }}')).toBe(true);
  });

  it('should return true for template with conditionals', () => {
    expect(hasVariables('{{ if condition }}text{{ endif }}')).toBe(true);
  });

  it('should return false for template without variables', () => {
    expect(hasVariables('No variables here')).toBe(false);
  });

  it('should return false for empty template', () => {
    expect(hasVariables('')).toBe(false);
  });

  it('should detect multiple variables', () => {
    expect(hasVariables('{{ a }} and {{ b }}')).toBe(true);
  });

  it('should detect nested variables', () => {
    expect(hasVariables('{{ user.name }}')).toBe(true);
  });

  it('should detect default values', () => {
    expect(hasVariables('{{ name | default: World }}')).toBe(true);
  });
});

// ============================================================================
// extractVariables() TESTS
// ============================================================================

describe('extractVariables()', () => {
  it('should extract single variable', () => {
    const vars = extractVariables('Hello {{ name }}');
    expect(vars).toEqual(['name']);
  });

  it('should extract multiple variables', () => {
    const vars = extractVariables('{{ a }} and {{ b }}');
    expect(vars).toHaveLength(2);
    expect(vars).toContain('a');
    expect(vars).toContain('b');
  });

  it('should extract nested properties as single variable', () => {
    const vars = extractVariables('{{ user.name }}');
    expect(vars).toEqual(['user.name']);
  });

  it('should extract variable name from default syntax', () => {
    const vars = extractVariables('{{ name | default: World }}');
    expect(vars).toEqual(['name']);
  });

  it('should deduplicate repeated variables', () => {
    const vars = extractVariables('{{ name }} and {{ name }} again');
    expect(vars).toEqual(['name']);
  });

  it('should extract conditions from conditionals', () => {
    const vars = extractVariables('{{ if enabled }}Active{{ endif }}');
    expect(vars).toEqual(['enabled']);
  });

  it('should extract both variables and conditions', () => {
    const vars = extractVariables('{{ if enabled }}Status: {{ status }}{{ endif }}');
    expect(vars).toHaveLength(2);
    expect(vars).toContain('enabled');
    expect(vars).toContain('status');
  });

  it('should return empty array for no variables', () => {
    const vars = extractVariables('No variables');
    expect(vars).toEqual([]);
  });

  it('should handle whitespace in variables', () => {
    const vars = extractVariables('{{  name  }}');
    expect(vars).toEqual(['name']);
  });
});

// ============================================================================
// validateVariables() TESTS
// ============================================================================

describe('validateVariables()', () => {
  it('should return empty array when all variables provided', () => {
    const missing = validateVariables('{{ name }}', { name: 'Alice' });
    expect(missing).toEqual([]);
  });

  it('should return missing variable names', () => {
    const missing = validateVariables('{{ name }} and {{ city }}', { name: 'Alice' });
    expect(missing).toEqual(['city']);
  });

  it('should return all missing variables', () => {
    const missing = validateVariables('{{ a }} {{ b }} {{ c }}', {});
    expect(missing).toHaveLength(3);
  });

  it('should not require variables with defaults', () => {
    const missing = validateVariables('{{ name | default: World }}', {});
    expect(missing).toEqual([]);
  });

  it('should validate nested properties', () => {
    const missing = validateVariables('{{ user.name }}', { user: {} });
    expect(missing).toEqual(['user.name']);
  });

  it('should not require built-in variables', () => {
    const missing = validateVariables('{{ cwd }}', {});
    expect(missing).toEqual([]);
  });

  it('should allow overriding built-in variables', () => {
    const missing = validateVariables('{{ cwd }}', { cwd: '/custom' });
    expect(missing).toEqual([]);
  });

  it('should validate conditionals', () => {
    // Variables used only in conditionals are optional (they default to false if missing)
    const missing = validateVariables('{{ if enabled }}Active{{ endif }}', {});
    expect(missing).toEqual([]);
  });

  it('should handle mixed required and optional variables', () => {
    const template = '{{ required }} and {{ optional | default: value }}';
    const missing = validateVariables(template, {});
    expect(missing).toEqual(['required']);
  });
});

// ============================================================================
// COMPLEX INTEGRATION TESTS
// ============================================================================

describe('interpolate() - Integration Tests', () => {
  it('should handle complex template with all features', () => {
    const template = `
Working directory: {{ cwd }}
Date: {{ date }}

{{ if includeReview }}
Review file: {{ targetFile }}
Output: {{ outputPath | default: ./review.md }}
{{ endif }}

Project: {{ project.name }}
Owner: {{ project.owner }}
    `.trim();

    const result = interpolate(template, {
      includeReview: true,
      targetFile: 'src/index.ts',
      outputPath: './custom.md',
      project: {
        name: 'tkr-llm-client',
        owner: 'Tucker',
      },
    });

    expect(result).toContain(`Working directory: ${process.cwd()}`);
    expect(result).toContain('Review file: src/index.ts');
    expect(result).toContain('Output: ./custom.md');
    expect(result).toContain('Project: tkr-llm-client');
    expect(result).toContain('Owner: Tucker');
  });

  it('should handle real-world agent template', () => {
    const template = `
You are a code review agent.

Analyze the file at {{ targetFile }}.
{{ if concern }}
Focus on {{ concern }} issues.
{{ endif }}

Working directory: {{ cwd }}
{{ if outputPath }}
Save results to {{ outputPath }}.
{{ endif }}
{{ if !outputPath }}
Save results to {{ defaultOutput | default: ./review.md }}.
{{ endif }}
    `.trim();

    const result = interpolate(template, {
      targetFile: '/src/main.ts',
      concern: 'security',
    });

    expect(result).toContain('Analyze the file at /src/main.ts.');
    expect(result).toContain('Focus on security issues.');
    expect(result).toContain(`Working directory: ${process.cwd()}`);
  });
});
