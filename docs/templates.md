# Agent Template System

A complete template system for creating reusable, composable AI agents with inheritance, mixins, and variable interpolation.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Template Anatomy](#template-anatomy)
- [Inheritance](#inheritance)
- [Mixins](#mixins)
- [Variable Interpolation](#variable-interpolation)
- [Tool Configuration](#tool-configuration)
- [Agent Factory](#agent-factory)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

The Agent Template System provides a YAML-based configuration format for defining reusable AI agents. Templates support:

- **Inheritance**: Extend base templates to create specialized agents
- **Mixins**: Compose prompt fragments for modular functionality
- **Variable Interpolation**: Dynamic prompt generation with `{{ variable }}` syntax
- **Tool Configuration**: Fine-grained control over tool permissions and behavior
- **Validation**: Schema validation for both templates and user inputs
- **Type Safety**: Full TypeScript support with comprehensive type definitions

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Agent Template System                      │
└─────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┴───────────────┐
                │                               │
        ┌───────▼────────┐            ┌────────▼────────┐
        │  YAML Templates │            │  AgentFactory   │
        │  (.yaml files)  │            │  (Orchestrator) │
        └───────┬────────┘            └────────┬────────┘
                │                               │
    ┌───────────┼───────────┐                  │
    │           │           │                  │
┌───▼───┐  ┌───▼───┐  ┌───▼────┐              │
│ Base  │  │ Child │  │ Mixins │              │
│ Tmpl  │  │ Tmpl  │  │ Frag   │              │
└───────┘  └───────┘  └────────┘              │
                                               │
                ┌──────────────────────────────┘
                │
    ┌───────────┴───────────┐
    │                       │
┌───▼─────┐       ┌─────────▼──────┐
│ Loader  │       │   Validator    │
│ (YAML)  │       │  (Schema)      │
└───┬─────┘       └─────────┬──────┘
    │                       │
    └───────────┬───────────┘
                │
        ┌───────▼────────┐
        │   Resolver     │
        │  (Inheritance, │
        │   Composition) │
        └───────┬────────┘
                │
        ┌───────▼────────┐
        │ Interpolation  │
        │  (Variables)   │
        └───────┬────────┘
                │
        ┌───────▼────────┐
        │ ResolvedAgent  │
        │   Config       │
        └────────────────┘
                │
                ▼
        Ready for LLMClient
```

## Quick Start

### 1. Create a Template

Create a YAML template file in your templates directory:

```yaml
# agent-templates/code-reviewer.yaml
metadata:
  name: code-reviewer
  version: 1.0.0
  description: Reviews code for quality and security issues
  tags:
    - code-analysis
    - security

agent:
  description: Code review specialist
  prompt: |
    You are a code reviewer. Review the file at {{ targetFile }}
    for {{ concern }} issues. Save your findings to {{ outputPath | default: ./review.md }}.

  tools:
    - Read
    - Write
    - Grep

  settings:
    model: sonnet
    temperature: 0.3
    maxTurns: 5

validation:
  required:
    - targetFile
    - concern
  optional:
    - outputPath
  types:
    targetFile:
      type: string
    concern:
      type: enum
      enum:
        - security
        - performance
        - style
    outputPath:
      type: string
      default: ./review.md

runtime:
  timeout: 60000
  logLevel: info
```

### 2. Use with AgentFactory

```typescript
import { AgentFactory } from '@tkr/llm-client/templates';

// Initialize factory
const factory = new AgentFactory({
  templateDir: './agent-templates'
});

// Scan for templates
await factory.scan();

// Create agent configuration
const config = await factory.create('code-reviewer', {
  targetFile: './src/index.ts',
  concern: 'security'
});

// Use with LLMClient
const client = new LLMClient({ claudeSDK: sdk });
for await (const msg of client.query(config.prompt, {
  allowedTools: config.tools,
  maxTurns: config.settings.maxTurns,
  temperature: config.settings.temperature
})) {
  console.log(msg.content);
}
```

### 3. Browse Available Templates

```typescript
// Get catalog of all templates
const catalog = factory.getRegistry().getCatalog();
console.log(`Found ${catalog.count} templates`);

// Filter by tag
const securityAgents = factory.getRegistry().filterByTag('security');

// Filter by tool
const writeAgents = factory.getRegistry().filterByTool('Write');
```

## Template Anatomy

A template consists of four main sections:

### 1. Metadata

```yaml
metadata:
  name: my-agent              # Required: Unique identifier
  version: 1.0.0              # Required: Semantic version
  description: My agent       # Required: Human-readable description
  author: Your Name           # Optional: Author/organization
  tags:                       # Optional: Searchable tags
    - tag1
    - tag2
  base: true                  # Optional: Mark as base template
  extends: ./base.yaml        # Optional: Inherit from parent
  mixins:                     # Optional: Prompt fragments to mix in
    - ./fragments/safety.yaml
```

### 2. Agent Configuration

```yaml
agent:
  description: Agent capability description

  prompt: |
    Your system prompt here.
    Use {{ variables }} for interpolation.

  tools:                      # Required: At least one tool
    - Read                    # Simple tool reference
    - name: Write             # Tool with configuration
      config: ./tool-configs/safe-write.yaml
      overrides:
        permissions:
          requireConfirmation: true

  toolConfigs:                # Optional: Shared tool configs
    - ./tool-configs/read-restricted.yaml

  toolBundles:                # Optional: Named tool groups
    - file-operations

  settings:                   # Optional: Model and inference settings
    model: sonnet             # sonnet | opus | haiku
    temperature: 0.7
    maxTurns: 10
    permissionMode: ask       # ask | allow-all | reject-all
```

### 3. Validation Rules

```yaml
validation:
  required:                   # Required variable names
    - targetFile
    - concern

  optional:                   # Optional variable names
    - outputPath

  types:                      # Type constraints
    targetFile:
      type: string
    concern:
      type: enum
      enum:
        - security
        - performance
    outputPath:
      type: string
      default: ./review.md
    maxLines:
      type: number
      min: 1
      max: 1000
```

### 4. Runtime Configuration

```yaml
runtime:
  workingDirectory: {{ cwd }}/src
  timeout: 60000              # Milliseconds
  logLevel: info              # debug | info | warn | error
```

## Inheritance

Inheritance allows you to create specialized agents by extending base templates.

### Creating a Base Template

```yaml
# base-template.yaml
metadata:
  name: base-code-analyzer
  version: 1.0.0
  description: Base template for code analysis agents
  base: true                  # Mark as base template

agent:
  description: Code analysis specialist
  prompt: |
    You are a code analyzer.
    Follow best practices.

  tools:
    - Read
    - Grep

  settings:
    model: sonnet
    temperature: 0.3
    maxTurns: 10

runtime:
  timeout: 60000
```

### Extending the Base

```yaml
# security-analyzer.yaml
metadata:
  name: security-analyzer
  version: 1.0.0
  description: Security-focused code analyzer
  extends: ./base-code-analyzer.yaml

agent:
  description: Security analysis specialist
  prompt: |
    # Additional security-specific instructions
    Focus on identifying security vulnerabilities.

  tools:
    - Write                   # Adds to parent tools

  settings:
    maxTurns: 5               # Overrides parent setting
```

### Merge Rules

When a child extends a parent:

1. **Metadata**: Child overrides parent (except `extends` and `mixins`)
2. **Prompt**: Child prompt is **appended** to parent prompt
3. **Tools**: **Union** of parent and child tools (no duplicates)
4. **Tool Configs**: Union of parent and child configs
5. **Settings**: **Deep merge** - child overrides specific fields only
6. **Validation**: Deep merge
7. **Runtime**: Deep merge

### Multi-Level Inheritance

```yaml
# grandchild-template.yaml
metadata:
  name: security-auditor
  version: 1.0.0
  description: Advanced security auditor
  extends: ./security-analyzer.yaml  # Which extends base-code-analyzer.yaml

agent:
  prompt: |
    # Even more specific instructions
    Perform comprehensive security audit.

  tools:
    - Edit                    # Adds to parent's parent tools
```

Result: `grandchild` gets tools from `base` + `child` + itself.

### Circular Inheritance Protection

The system detects and prevents circular inheritance:

```yaml
# ❌ This will fail
# template-a.yaml extends template-b.yaml
# template-b.yaml extends template-a.yaml
```

**Error**: `CircularInheritanceError: Circular inheritance detected: template-a → template-b → template-a`

### Depth Limits

Maximum inheritance depth: **10 levels**

Exceeding this will throw `MaxDepthExceededError`.

## Mixins

Mixins allow you to compose prompts from reusable fragments.

### Creating a Fragment

```yaml
# fragments/file-safety.yaml
fragment:
  name: file-safety

  instructions: |
    Before modifying files:
    1. Always verify the file exists
    2. Check you have write permissions
    3. Consider backing up important files

  validation: |
    Validate file paths before operations

  safetyChecks: |
    Never modify files in /etc or /sys
```

### Using Mixins

```yaml
# code-modifier.yaml
metadata:
  name: code-modifier
  version: 1.0.0
  description: Modifies code with safety checks
  mixins:
    - ./fragments/file-safety.yaml
    - ./fragments/code-style.yaml

agent:
  prompt: |
    You modify code files.

    {{ targetFile }} needs refactoring.

  tools:
    - Read
    - Edit
```

### Mixin Order

Fragments are mixed in **order**:

```
Final Prompt =
  Template Prompt +
  Fragment 1 Instructions +
  Fragment 2 Instructions +
  ...
```

## Variable Interpolation

Templates support dynamic variable substitution using `{{ variable }}` syntax.

### Simple Variables

```yaml
agent:
  prompt: |
    Review {{ file }} for issues.
```

```typescript
await factory.create('my-template', {
  file: './src/index.ts'
});
// Result: "Review ./src/index.ts for issues."
```

### Nested Properties

```yaml
agent:
  prompt: |
    Project: {{ project.name }}
    Version: {{ project.version }}
```

```typescript
await factory.create('my-template', {
  project: {
    name: 'my-app',
    version: '1.0.0'
  }
});
```

### Default Values

```yaml
agent:
  prompt: |
    Output to {{ outputPath | default: ./output.md }}
```

If `outputPath` is not provided, uses `./output.md`.

### Conditionals

```yaml
agent:
  prompt: |
    Review the code.
    {{ if verbose }}
    Provide detailed explanations for each finding.
    {{ endif }}
```

```typescript
// With verbose = true
await factory.create('my-template', { verbose: true });
// Includes detailed instructions

// With verbose = false or undefined
await factory.create('my-template', { verbose: false });
// Omits detailed instructions
```

### Built-in Variables

Available in all templates:

- `{{ cwd }}` - Current working directory
- `{{ timestamp }}` - ISO 8601 timestamp
- `{{ date }}` - YYYY-MM-DD
- `{{ time }}` - HH:MM:SS
- `{{ templateName }}` - Template name (injected during resolution)
- `{{ templateVersion }}` - Template version (injected during resolution)

Example:

```yaml
runtime:
  workingDirectory: {{ cwd }}/output
```

### Variable Validation

Ensure required variables are provided:

```yaml
validation:
  required:
    - targetFile
    - concern
```

Missing variables throw `MissingVariablesError`:

```typescript
// ❌ This will fail
await factory.create('code-reviewer', {
  targetFile: './src/index.ts'
  // Missing: concern
});
// Throws: MissingVariablesError: Missing required variables: concern
```

## Tool Configuration

Control tool behavior through configurations.

### Allowed Tools

Only **local tools** are permitted for security:

- `Read` - Read files
- `Write` - Write files
- `Edit` - Edit files
- `Bash` - Execute shell commands
- `Grep` - Search file contents
- `Glob` - File pattern matching

Network tools (`WebSearch`, `WebFetch`, MCP tools) are **forbidden**.

### Simple Tool Reference

```yaml
agent:
  tools:
    - Read
    - Write
```

### Tool with Configuration

```yaml
agent:
  tools:
    - name: Write
      config: ./tool-configs/safe-write.yaml
    - name: Bash
      overrides:
        permissions:
          allowedCommands:
            - git status
            - npm test
          deniedPatterns:
            - rm -rf
```

### Tool Configuration Files

```yaml
# tool-configs/safe-write.yaml
tool:
  name: Write

  permissions:
    requireConfirmation: true
    allowedPaths:
      - src/**/*.ts
      - tests/**/*.ts
    deniedPaths:
      - node_modules/**
      - .env*

  validation:
    checkDiskSpace: true
    minimumFreeSpace: 10485760  # 10 MB
    verifyWritePermissions: true
    maxFileSize: 1048576        # 1 MB
    allowedExtensions:
      - .ts
      - .js
      - .md

  errorHandling:
    retryAttempts: 3
    retryDelayMs: 1000
    fallbackBehavior: throw
    onExisting: ask
    onError: log
```

### Permission Modes

Three modes for tool permissions:

```yaml
agent:
  settings:
    permissionMode: ask         # Ask user before each tool use
    # permissionMode: allow-all  # Allow all tools automatically
    # permissionMode: reject-all # Reject all tool use
```

### Rate Limiting

```yaml
tool:
  permissions:
    rateLimits:
      requestsPerMinute: 30
      requestsPerHour: 1000
```

## Agent Factory

The `AgentFactory` orchestrates the complete template pipeline.

### Initialization

```typescript
import { AgentFactory } from '@tkr/llm-client/templates';

const factory = new AgentFactory({
  templateDir: './agent-templates',  // Where to find templates
  baseDir: process.cwd(),            // Base for relative paths
  validateTemplates: true,           // Validate during scan
  cacheEnabled: false                // Enable caching
});

await factory.scan();
```

### Creating Agents by Name

```typescript
// Create from template name
const config = await factory.create('code-reviewer', {
  targetFile: './src/index.ts',
  concern: 'security'
});
```

### Creating from File Path

```typescript
// Create from file path (skips registry)
const config = await factory.createFromPath(
  './custom-templates/my-agent.yaml',
  { file: './src/app.ts' }
);
```

### Browsing Templates

```typescript
// Get full catalog
const catalog = factory.getRegistry().getCatalog();
console.log(`Total templates: ${catalog.count}`);
console.log(`Available tags: ${catalog.tags.join(', ')}`);

// List all template names
const names = factory.getRegistry().listNames();

// Filter by tag
const codeAgents = factory.getRegistry().filterByTag('code-analysis');

// Filter by tool
const bashAgents = factory.getRegistry().filterByTool('Bash');
```

### Refreshing Templates

```typescript
// Refresh when templates change on disk
await factory.refresh();
```

### Error Handling

```typescript
import {
  TemplateNotFoundError,
  MissingVariablesError,
  TemplateValidationError,
  FactoryError
} from '@tkr/llm-client/templates';

try {
  const config = await factory.create('my-agent', variables);
} catch (error) {
  if (error instanceof TemplateNotFoundError) {
    console.error('Template not found');
    console.error('Available:', error.availableTemplates);
  } else if (error instanceof MissingVariablesError) {
    console.error('Missing:', error.missingVariables);
  } else if (error instanceof TemplateValidationError) {
    console.error('Validation errors:', error.validationErrors);
  } else {
    console.error('Factory error:', error.message);
  }
}
```

## Best Practices

### 1. Template Organization

```
agent-templates/
├── base/
│   ├── base-analyzer.yaml
│   └── base-modifier.yaml
├── specialized/
│   ├── security-analyzer.yaml
│   └── performance-analyzer.yaml
├── fragments/
│   ├── file-safety.yaml
│   └── code-style.yaml
└── tool-configs/
    ├── safe-write.yaml
    └── restricted-bash.yaml
```

### 2. Naming Conventions

- Template names: `kebab-case` (e.g., `code-reviewer-agent`)
- File names: Match template names (e.g., `code-reviewer-agent.yaml`)
- Fragment names: Descriptive (e.g., `file-safety`, `security-checks`)

### 3. Versioning

Use semantic versioning:

```yaml
metadata:
  version: 1.0.0  # MAJOR.MINOR.PATCH
```

- **MAJOR**: Breaking changes to template interface
- **MINOR**: New features, backward compatible
- **PATCH**: Bug fixes

### 4. Variable Naming

- Use clear, descriptive names: `targetFile` not `f`
- Document in validation rules
- Provide defaults when sensible

### 5. Tool Safety

```yaml
# ✅ Good: Restrict tool access
agent:
  tools:
    - name: Write
      overrides:
        permissions:
          allowedPaths:
            - src/**
          deniedPaths:
            - node_modules/**

# ❌ Bad: Unrestricted access
agent:
  tools:
    - Write
```

### 6. Prompt Engineering

```yaml
# ✅ Good: Clear, specific instructions
agent:
  prompt: |
    You are a TypeScript code reviewer.

    Task: Review {{ targetFile }} for:
    1. Type safety issues
    2. Potential bugs
    3. Code style violations

    Output format: Markdown with severity levels

# ❌ Bad: Vague instructions
agent:
  prompt: Review the file
```

### 7. Template Reusability

Create base templates for common patterns:

```yaml
# base-file-processor.yaml
metadata:
  name: base-file-processor
  base: true

agent:
  tools:
    - Read
    - Write
  settings:
    model: sonnet
```

Extend for specific use cases:

```yaml
# json-formatter.yaml
metadata:
  extends: ./base-file-processor.yaml

agent:
  prompt: Format {{ file }} as pretty JSON
```

## Troubleshooting

### Template Not Found

**Error**: `TemplateNotFoundError: Template "my-agent" not found`

**Solutions**:
1. Verify template file exists in `templateDir`
2. Check template name in `metadata.name` matches
3. Call `await factory.scan()` before `create()`

### Missing Variables

**Error**: `MissingVariablesError: Missing required variables: targetFile`

**Solutions**:
1. Provide all required variables
2. Add default values: `{{ targetFile | default: ./file.ts }}`
3. Mark variables as optional in validation rules

### Circular Inheritance

**Error**: `CircularInheritanceError: Circular inheritance detected`

**Solutions**:
1. Review `extends` chain
2. Remove circular references
3. Restructure template hierarchy

### Invalid Tool

**Error**: `Invalid tool "WebSearch". Only local tools are allowed`

**Solutions**:
1. Use only allowed tools: `Read`, `Write`, `Edit`, `Bash`, `Grep`, `Glob`
2. Remove network tools for security

### YAML Syntax Error

**Error**: `YAMLParseError: Invalid YAML syntax at line 15`

**Solutions**:
1. Check YAML indentation (use spaces, not tabs)
2. Validate YAML syntax with a linter
3. Ensure strings with special characters are quoted

### File Not Found (extends/mixins)

**Error**: `FileNotFoundError: Template file not found: ./fragments/missing.yaml`

**Solutions**:
1. Verify file path is correct (relative to template file)
2. Check file exists
3. Use absolute paths if needed

### Validation Errors

**Error**: `TemplateValidationError: Template validation failed`

**Solutions**:
1. Review validation errors in error object
2. Fix schema violations (missing required fields, wrong types)
3. Disable validation temporarily: `validateTemplates: false` (not recommended)

### Type Mismatch

**Error**: `Expected string, got number`

**Solutions**:
1. Check variable types in validation rules
2. Convert variables to correct type before passing
3. Update type rule to accept actual type

### Inheritance Depth Exceeded

**Error**: `MaxDepthExceededError: Maximum inheritance depth (10) exceeded`

**Solutions**:
1. Reduce inheritance chain depth
2. Flatten template hierarchy
3. Use mixins instead of deep inheritance

### Template Changes Not Reflected

**Issue**: Changes to template files not appearing

**Solutions**:
1. Call `await factory.refresh()` to rescan
2. Disable caching: `cacheEnabled: false`
3. Restart application

---

## Related Documentation

- [Template Schema Reference](./template-schema.md) - Complete YAML schema
- [API Reference](../README.md) - Library API documentation

## Support

For issues, questions, or contributions:

- GitHub: [tkr-llm-client](https://github.com/TuckerTucker/tkr-llm-client)
- Documentation: This guide
