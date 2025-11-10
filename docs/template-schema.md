# Agent Template YAML Schema Reference

Complete reference for the Agent Template YAML schema.

## Table of Contents

- [Schema Overview](#schema-overview)
- [Metadata](#metadata)
- [Agent Configuration](#agent-configuration)
- [Tool Reference](#tool-reference)
- [Tool Configuration](#tool-configuration)
- [Validation Rules](#validation-rules)
- [Runtime Configuration](#runtime-configuration)
- [Prompt Fragments](#prompt-fragments)
- [Complete Examples](#complete-examples)
- [Validation Rules Summary](#validation-rules-summary)

## Schema Overview

A template file contains four top-level sections:

```yaml
metadata:        # Required - Template identification and composition
  ...

agent:           # Required - Agent behavior and tools
  ...

validation:      # Optional - Input validation rules
  ...

runtime:         # Optional - Execution configuration
  ...
```

## Metadata

Template identification and composition information.

### Schema

```yaml
metadata:
  name: string              # Required - Unique template identifier
  version: string           # Required - Semantic version (X.Y.Z)
  description: string       # Required - Human-readable description
  author: string            # Optional - Author or organization
  tags: string[]            # Optional - Searchable tags
  base: boolean             # Optional - Mark as base template
  extends: string           # Optional - Path to parent template
  mixins: string[]          # Optional - Paths to prompt fragments
```

### Fields

#### `name` (required)

Unique identifier for the template. Used when creating agents via `factory.create()`.

**Type**: `string`

**Validation**:
- Cannot be empty
- Recommended: Use kebab-case (e.g., `code-reviewer-agent`)

**Example**:
```yaml
metadata:
  name: code-reviewer-agent
```

#### `version` (required)

Semantic version following MAJOR.MINOR.PATCH format.

**Type**: `string`

**Validation**:
- Must follow semver format: `X.Y.Z`
- Optional pre-release: `X.Y.Z-alpha.1`
- Optional build metadata: `X.Y.Z+build.123`

**Example**:
```yaml
metadata:
  version: 1.2.3
  # version: 2.0.0-beta.1
  # version: 1.0.0+20231201
```

#### `description` (required)

Human-readable description of the template's purpose.

**Type**: `string`

**Validation**: Cannot be empty

**Example**:
```yaml
metadata:
  description: Reviews code for security vulnerabilities and best practices
```

#### `author` (optional)

Author or organization name.

**Type**: `string`

**Example**:
```yaml
metadata:
  author: Tucker Tucker
  # author: Security Team
  # author: github.com/username
```

#### `tags` (optional)

Searchable tags for template discovery.

**Type**: `string[]`

**Example**:
```yaml
metadata:
  tags:
    - code-analysis
    - security
    - typescript
```

**Usage**:
```typescript
const securityAgents = registry.filterByTag('security');
```

#### `base` (optional)

Marks this template as a base template for inheritance.

**Type**: `boolean`

**Default**: `false`

**Example**:
```yaml
metadata:
  name: base-code-analyzer
  base: true
```

#### `extends` (optional)

Path to parent template for inheritance.

**Type**: `string`

**Validation**:
- Cannot be empty
- Path can be relative (to template file) or absolute
- Must point to valid template file
- Cannot create circular inheritance

**Example**:
```yaml
metadata:
  extends: ./base-code-analyzer.yaml
  # extends: ../shared/base-template.yaml
  # extends: /absolute/path/to/base.yaml
```

#### `mixins` (optional)

Array of paths to prompt fragment files to mix into the template.

**Type**: `string[]`

**Validation**:
- Each path must be non-empty
- Paths can be relative or absolute
- Must point to valid fragment files

**Example**:
```yaml
metadata:
  mixins:
    - ./fragments/file-safety.yaml
    - ./fragments/code-style.yaml
```

Fragments are mixed in order: template prompt + fragment1 + fragment2 + ...

## Agent Configuration

Agent behavior, tools, and settings.

### Schema

```yaml
agent:
  description: string                # Required - Agent capability description
  prompt: string                     # Required - System prompt (supports {{ variables }})
  tools: ToolReference[]             # Required - Tool list (min 1)
  toolConfigs: string[]              # Optional - Paths to shared tool configs
  toolBundles: string[]              # Optional - Named tool groups
  settings:                          # Optional - Model and inference settings
    model: string                    # sonnet | opus | haiku
    temperature: number              # 0.0 - 1.0
    maxTurns: number                 # Positive integer
    permissionMode: string           # ask | allow-all | reject-all
    inherit: string                  # 'base' to inherit from parent
```

### Fields

#### `description` (required)

User-facing description of agent capabilities.

**Type**: `string`

**Validation**: Cannot be empty

**Example**:
```yaml
agent:
  description: Analyzes TypeScript code for security vulnerabilities and suggests fixes
```

#### `prompt` (required)

System prompt with optional variable interpolation.

**Type**: `string` (multiline recommended)

**Validation**: Cannot be empty

**Features**:
- Variable interpolation: `{{ variable }}`
- Default values: `{{ var | default: value }}`
- Conditionals: `{{ if condition }}...{{ endif }}`
- Built-in variables: `{{ cwd }}`, `{{ timestamp }}`, etc.

**Example**:
```yaml
agent:
  prompt: |
    You are a code reviewer specializing in {{ language }}.

    Task: Review {{ targetFile }} for {{ concern }} issues.

    {{ if verbose }}
    Provide detailed explanations for each finding.
    {{ endif }}

    Save results to {{ outputPath | default: ./review.md }}.

    Current directory: {{ cwd }}
    Review timestamp: {{ timestamp }}
```

#### `tools` (required)

List of tools available to the agent.

**Type**: `ToolReference[]` (minimum 1 tool)

**Allowed Tools** (local only, for security):
- `Read` - Read files
- `Write` - Write files
- `Edit` - Edit files
- `Bash` - Execute shell commands
- `Grep` - Search file contents
- `Glob` - File pattern matching

**Forbidden Tools** (network access):
- `WebSearch`, `WebFetch`
- MCP tools (starting with `mcp__`)
- Any tool containing `http`, `fetch`, `curl`, `wget`

**Format**: String or object

**Examples**:

```yaml
agent:
  # Simple tool references (strings)
  tools:
    - Read
    - Write
    - Grep

  # Tools with configuration
  tools:
    - Read
    - name: Write
      config: ./tool-configs/safe-write.yaml
    - name: Bash
      overrides:
        permissions:
          allowedCommands:
            - git status
            - npm test
```

#### `toolConfigs` (optional)

Paths to shared tool configuration files.

**Type**: `string[]`

**Example**:
```yaml
agent:
  toolConfigs:
    - ./tool-configs/read-restricted.yaml
    - ./tool-configs/write-safe.yaml
```

These configs apply to all instances of the specified tool.

#### `toolBundles` (optional)

Named tool groups for common patterns.

**Type**: `string[]`

**Example**:
```yaml
agent:
  toolBundles:
    - file-operations    # Read + Write + Edit
    - code-analysis      # Read + Grep + Glob
```

**Note**: Implementation-specific bundles must be configured separately.

#### `settings` (optional)

Model and inference configuration.

##### `model` (optional)

Model size selection.

**Type**: `'sonnet' | 'opus' | 'haiku'`

**Default**: `'sonnet'`

**Mapping**:
- `sonnet` → `claude-sonnet-4-5-20250929`
- `opus` → `claude-opus-4-20250514`
- `haiku` → `claude-haiku-4-20250514`

**Example**:
```yaml
agent:
  settings:
    model: sonnet
```

##### `temperature` (optional)

Sampling temperature for response randomness.

**Type**: `number`

**Range**: `0.0` - `1.0`
- `0.0` = Deterministic, focused
- `1.0` = Creative, varied

**Default**: Model default

**Example**:
```yaml
agent:
  settings:
    temperature: 0.3  # More deterministic for code analysis
```

##### `maxTurns` (optional)

Maximum conversation turns before termination.

**Type**: `number` (positive integer)

**Default**: System default

**Example**:
```yaml
agent:
  settings:
    maxTurns: 5
```

##### `permissionMode` (optional)

Tool permission behavior.

**Type**: `'ask' | 'allow-all' | 'reject-all'`

**Options**:
- `ask` - Ask user before each tool use
- `allow-all` - Automatically allow all tools
- `reject-all` - Reject all tool use

**Default**: System default

**Example**:
```yaml
agent:
  settings:
    permissionMode: ask
```

##### `inherit` (optional)

Inherit settings from parent template.

**Type**: `'base'`

**Usage**: Only valid in templates with `extends`

**Example**:
```yaml
metadata:
  extends: ./base.yaml

agent:
  settings:
    inherit: base       # Keep parent settings
    temperature: 0.5    # Override this one field
```

## Tool Reference

Tools can be specified as strings or objects with configuration.

### Simple Reference

```yaml
agent:
  tools:
    - Read
    - Write
    - Grep
```

### Object Reference

```yaml
agent:
  tools:
    - name: Write                                      # Required
      config: ./tool-configs/safe-write.yaml           # Optional
      overrides:                                       # Optional
        permissions:
          requireConfirmation: true
          allowedPaths:
            - src/**/*.ts
        validation:
          maxFileSize: 1048576
```

#### `name` (required)

Tool name (must be one of the allowed tools).

**Type**: `string`

#### `config` (optional)

Path to tool configuration file.

**Type**: `string`

#### `overrides` (optional)

Inline configuration overrides.

**Type**: Partial `ToolConfig`

Accepts both wrapped and unwrapped syntax:

```yaml
# Unwrapped (user-friendly)
overrides:
  permissions:
    requireConfirmation: true

# Wrapped (full schema)
overrides:
  tool:
    permissions:
      requireConfirmation: true
```

## Tool Configuration

Fine-grained control over tool behavior.

### Schema

```yaml
tool:
  name: string                      # Required - Tool name
  defaultSettings: object           # Optional - Default parameters
  permissions:                      # Optional - Access control
    requireConfirmation: boolean | string[]
    allowedPaths: string[]          # Glob patterns
    deniedPaths: string[]           # Glob patterns
    allowedCommands: string[]       # Bash only
    deniedPatterns: string[]        # Bash only
    rateLimits:
      requestsPerMinute: number
      requestsPerHour: number
  validation:                       # Optional - Input validation
    checkDiskSpace: boolean
    minimumFreeSpace: number        # Bytes
    verifyWritePermissions: boolean
    maxFileSize: number             # Bytes
    allowedExtensions: string[]     # e.g., ['.ts', '.js']
  errorHandling:                    # Optional - Error behavior
    retryAttempts: number
    retryDelayMs: number
    fallbackBehavior: string        # throw | return-partial | skip
    onExisting: string              # ask | overwrite | skip | append
    onError: string                 # throw | log | ignore
  extends: string                   # Optional - Parent config path
```

### Example: Safe Write Configuration

```yaml
# tool-configs/safe-write.yaml
tool:
  name: Write

  permissions:
    requireConfirmation: true
    allowedPaths:
      - src/**/*.ts
      - tests/**/*.ts
      - docs/**/*.md
    deniedPaths:
      - node_modules/**
      - .env*
      - dist/**
    rateLimits:
      requestsPerMinute: 30
      requestsPerHour: 500

  validation:
    checkDiskSpace: true
    minimumFreeSpace: 10485760      # 10 MB
    verifyWritePermissions: true
    maxFileSize: 1048576            # 1 MB
    allowedExtensions:
      - .ts
      - .js
      - .md
      - .json

  errorHandling:
    retryAttempts: 3
    retryDelayMs: 1000
    fallbackBehavior: throw
    onExisting: ask                 # Ask before overwriting
    onError: log
```

### Example: Restricted Bash Configuration

```yaml
# tool-configs/safe-bash.yaml
tool:
  name: Bash

  permissions:
    requireConfirmation: true
    allowedCommands:
      - git status
      - git diff
      - npm test
      - npm run build
      - ls
      - cat
    deniedPatterns:
      - rm -rf
      - sudo
      - chmod
      - dd
      - mkfs
    rateLimits:
      requestsPerMinute: 10

  errorHandling:
    retryAttempts: 0                # No retries for shell commands
    fallbackBehavior: throw
    onError: throw
```

## Validation Rules

Input variable validation for template variables.

### Schema

```yaml
validation:
  required: string[]                # Required variable names
  optional: string[]                # Optional variable names
  types:                            # Type constraints
    variableName:
      type: string                  # string | number | boolean | enum | array
      enum: string[]                # For enum type
      min: number                   # For number type
      max: number                   # For number type
      default: any                  # Default value
```

### Examples

#### Basic Validation

```yaml
validation:
  required:
    - targetFile
    - concern
  optional:
    - outputPath
```

#### Type Constraints

```yaml
validation:
  types:
    targetFile:
      type: string

    concern:
      type: enum
      enum:
        - security
        - performance
        - style
        - maintainability

    outputPath:
      type: string
      default: ./review.md

    maxLines:
      type: number
      min: 1
      max: 10000
      default: 1000

    verbose:
      type: boolean
      default: false

    tags:
      type: array
```

### Type Rules

#### `string`

```yaml
variableName:
  type: string
  default: optional-default-value
```

#### `number`

```yaml
variableName:
  type: number
  min: 0          # Optional minimum
  max: 100        # Optional maximum
  default: 50     # Optional default
```

#### `boolean`

```yaml
variableName:
  type: boolean
  default: false
```

#### `enum`

```yaml
variableName:
  type: enum
  enum:
    - value1
    - value2
    - value3
  default: value1  # Optional
```

#### `array`

```yaml
variableName:
  type: array
  default: []      # Optional
```

## Runtime Configuration

Execution environment settings.

### Schema

```yaml
runtime:
  workingDirectory: string          # Working directory (supports {{ variables }})
  timeout: number                   # Timeout in milliseconds
  logLevel: string                  # debug | info | warn | error
```

### Fields

#### `workingDirectory` (optional)

Working directory for agent execution.

**Type**: `string` (supports variable interpolation)

**Default**: `process.cwd()`

**Example**:
```yaml
runtime:
  workingDirectory: {{ cwd }}/src
  # workingDirectory: /absolute/path
  # workingDirectory: ./relative/path
```

#### `timeout` (optional)

Operation timeout in milliseconds.

**Type**: `number`

**Range**: `1000` (1 second) - `600000` (10 minutes)

**Example**:
```yaml
runtime:
  timeout: 60000  # 1 minute
```

#### `logLevel` (optional)

Logging verbosity.

**Type**: `'debug' | 'info' | 'warn' | 'error'`

**Default**: `'info'`

**Example**:
```yaml
runtime:
  logLevel: debug
```

## Prompt Fragments

Reusable prompt pieces for composition via mixins.

### Schema

```yaml
fragment:
  name: string                      # Required - Fragment identifier
  instructions: string              # Required - Main content
  example: string                   # Optional - Usage example
  validation: string                # Optional - Validation guidance
  safetyChecks: string              # Optional - Safety guidelines
```

### Example

```yaml
# fragments/file-safety.yaml
fragment:
  name: file-safety

  instructions: |
    Before modifying any files:

    1. Verify the file exists and is readable
    2. Check you have appropriate write permissions
    3. Consider the impact of changes on dependent code
    4. Never modify files in protected directories

  example: |
    # Good
    if file_exists("./src/index.ts"):
        modify_file("./src/index.ts")

    # Bad
    modify_file("./src/index.ts")  # No existence check

  validation: |
    Always validate file paths before operations.
    Use Read tool to verify file contents first.

  safetyChecks: |
    NEVER modify:
    - System files (/etc, /sys, /var)
    - Dependencies (node_modules, vendor)
    - Generated files (dist, build)
    - Environment files (.env, .env.*)
```

## Complete Examples

### Minimal Template

```yaml
metadata:
  name: minimal-agent
  version: 1.0.0
  description: Minimal working template

agent:
  description: Simple file reader
  prompt: Read {{ file }} and summarize its contents
  tools:
    - Read
```

### Full-Featured Template

```yaml
metadata:
  name: advanced-code-reviewer
  version: 2.1.0
  description: Advanced code reviewer with security focus
  author: Security Team
  tags:
    - code-analysis
    - security
    - typescript
  extends: ./base-code-analyzer.yaml
  mixins:
    - ./fragments/file-safety.yaml
    - ./fragments/security-checks.yaml

agent:
  description: |
    Performs comprehensive code review with focus on:
    - Security vulnerabilities
    - Code quality
    - Best practices

  prompt: |
    You are an expert {{ language }} code reviewer.

    Task: Review {{ targetFile }} for {{ concern }} issues.

    {{ if comprehensive }}
    Perform a thorough analysis including:
    - Static analysis
    - Security scanning
    - Performance review
    - Style checking
    {{ endif }}

    Output format: {{ format | default: markdown }}
    Save to: {{ outputPath | default: ./review.md }}

  tools:
    - Read
    - name: Write
      config: ./tool-configs/safe-write.yaml
    - Grep
    - Glob

  toolConfigs:
    - ./tool-configs/read-restricted.yaml

  toolBundles:
    - code-analysis

  settings:
    model: sonnet
    temperature: 0.3
    maxTurns: 10
    permissionMode: ask

validation:
  required:
    - targetFile
    - concern
    - language
  optional:
    - outputPath
    - format
    - comprehensive
  types:
    targetFile:
      type: string
    concern:
      type: enum
      enum:
        - security
        - performance
        - quality
        - all
    language:
      type: enum
      enum:
        - typescript
        - javascript
        - python
    outputPath:
      type: string
      default: ./review.md
    format:
      type: enum
      enum:
        - markdown
        - json
        - html
      default: markdown
    comprehensive:
      type: boolean
      default: false

runtime:
  workingDirectory: {{ cwd }}
  timeout: 120000
  logLevel: info
```

## Validation Rules Summary

### Required Fields

- `metadata.name` - Non-empty string
- `metadata.version` - Semver format
- `metadata.description` - Non-empty string
- `agent.description` - Non-empty string
- `agent.prompt` - Non-empty string
- `agent.tools` - Array with at least 1 tool

### Constraints

- **Tools**: Must be one of 6 allowed local tools
- **Network tools**: Explicitly forbidden
- **Temperature**: 0.0 - 1.0
- **Timeout**: 1000ms - 600000ms (1s - 10min)
- **Model**: `sonnet`, `opus`, or `haiku`
- **Inheritance depth**: Maximum 10 levels
- **Circular inheritance**: Detected and prevented

### File Path Rules

- Can be relative or absolute
- Relative paths resolved from template file location
- Must point to existing files (checked at runtime)

### Variable Interpolation

- Syntax: `{{ variable }}`
- Default: `{{ var | default: value }}`
- Conditional: `{{ if var }}...{{ endif }}`
- Nested: `{{ project.name }}`

---

For usage examples and best practices, see [Template System Guide](./templates.md).
