# Agent Templates

Production-ready agent templates for the Claude Agent SDK template system. These templates demonstrate inheritance, mixins, tool configurations, and variable interpolation.

## Directory Structure

```
agent-templates/
├── base-templates/           # Inheritable base templates
│   └── code-analysis-base.yaml
├── prompt-fragments/         # Reusable prompt pieces
│   ├── file-safety.yaml
│   └── code-quality.yaml
├── tool-configs/             # Shared tool configurations
│   └── bash-safe-config.yaml
├── templates/                # Complete agent definitions
│   ├── code-reviewer-agent.yaml
│   ├── refactor-agent.yaml
│   ├── documentation-agent.yaml
│   └── log-analyzer-agent.yaml
└── README.md                 # This file
```

## Quick Start

### Using a Template

```typescript
import { AgentTemplateFactory } from '@tkr/agent-template-system';

const factory = new AgentTemplateFactory();

// Load and instantiate a template
const agent = await factory.create('code-reviewer-agent', {
  targetFile: '/path/to/src/index.ts',
  outputPath: '/path/to/review-report.md',
  language: 'typescript'
});

// Execute the agent
await agent.execute();
```

### Command Line Usage

```bash
# Using the agent template CLI (if implemented)
agent-template run code-reviewer-agent \
  --targetFile=/path/to/src/index.ts \
  --outputPath=/path/to/review.md \
  --language=typescript
```

## Available Templates

### 1. Code Reviewer Agent
**File**: `templates/code-reviewer-agent.yaml`

Reviews code files for quality, security, performance, and best practices.

**Required Variables**:
- `targetFile` (string): Path to file to review

**Optional Variables**:
- `language` (enum): Programming language (typescript, javascript, python, go, rust, etc.)
- `outputPath` (string): Where to save report (default: `./code-review.md`)
- `contextFiles` (array): Related files for context
- `focusArea` (enum): Specific focus area (all, critical, quality, performance, security, testing)

**Tools**: Read, Grep, Glob, Write

**Example**:
```typescript
const reviewer = await factory.create('code-reviewer-agent', {
  targetFile: '/src/services/UserService.ts',
  language: 'typescript',
  focusArea: 'security',
  outputPath: '/reports/user-service-review.md'
});
```

---

### 2. Refactor Agent
**File**: `templates/refactor-agent.yaml`

Refactors code following best practices and design patterns.

**Required Variables**:
- `targetFile` (string): File to refactor
- `style` (enum): Refactoring style (ioc, solid, clean-code, performance)

**Optional Variables**:
- `runTests` (boolean): Run tests after refactoring (default: true)
- `testCommand` (string): Command to run tests (default: `npm test`)

**Tools**: Read, Grep, Glob, Edit, Bash

**Example**:
```typescript
const refactor = await factory.create('refactor-agent', {
  targetFile: '/src/legacy/OldService.ts',
  style: 'ioc',
  runTests: true,
  testCommand: 'npm run test:unit'
});
```

**Refactoring Styles**:
- `ioc`: Inversion of Control - dependency injection, interface extraction
- `solid`: SOLID principles - SRP, OCP, LSP, ISP, DIP
- `clean-code`: Clean Code - naming, simplicity, readability
- `performance`: Performance optimization - algorithms, caching, efficiency

---

### 3. Documentation Agent
**File**: `templates/documentation-agent.yaml`

Generates comprehensive documentation from source code.

**Required Variables**:
- `sourceDir` (string): Directory containing source code
- `outputPath` (string): Where to save documentation

**Optional Variables**:
- `format` (enum): Output format (markdown, html) - default: markdown
- `filePattern` (string): Files to document (glob) - default: `**/*.{ts,js,py,go}`
- `includePrivate` (boolean): Document private APIs - default: false

**Tools**: Read, Grep, Glob, Write

**Example**:
```typescript
const docGen = await factory.create('documentation-agent', {
  sourceDir: '/src/api',
  outputPath: '/docs/api-reference.md',
  format: 'markdown',
  filePattern: '**/*.ts'
});
```

---

### 4. Log Analyzer Agent
**File**: `templates/log-analyzer-agent.yaml`

Analyzes log files to identify errors, patterns, and anomalies.

**Required Variables**:
- `logPath` (string): Path to log file or directory

**Optional Variables**:
- `reportPath` (string): Where to save report (default: `./log-analysis-report.md`)
- `timeRange` (string): Time range to analyze
- `focusArea` (enum): Specific focus (all, errors, performance, patterns, health)
- `slowQueryThreshold` (number): Threshold for slow queries in ms (default: 1000)
- `slowApiThreshold` (number): Threshold for slow APIs in ms (default: 2000)
- `slowIoThreshold` (number): Threshold for slow I/O in ms (default: 500)

**Tools**: Read, Grep, Write

**Example**:
```typescript
const analyzer = await factory.create('log-analyzer-agent', {
  logPath: '/var/log/app.log',
  reportPath: '/reports/log-analysis.md',
  focusArea: 'errors',
  slowQueryThreshold: 500
});
```

---

## Base Templates

### Code Analysis Base
**File**: `base-templates/code-analysis-base.yaml`

Foundation template for all code analysis agents. Provides common tools (Read, Grep, Glob) and settings optimized for code analysis.

**Inherit From**:
```yaml
metadata:
  extends: ../base-templates/code-analysis-base.yaml
```

**Provides**:
- Common code analysis tools
- Standard settings (model: sonnet, temperature: 0.3)
- Base prompt with analysis framework
- Default validation rules

---

## Prompt Fragments

### File Safety Fragment
**File**: `prompt-fragments/file-safety.yaml`

Reusable safety guidelines for file operations.

**Mix In**:
```yaml
metadata:
  mixins:
    - ../prompt-fragments/file-safety.yaml
```

**Provides**:
- Safe file reading guidelines
- Safe file writing guidelines
- Safe editing guidelines
- Bash command safety rules
- Path best practices
- Forbidden operations list

---

### Code Quality Fragment
**File**: `prompt-fragments/code-quality.yaml`

Reusable code quality evaluation criteria.

**Mix In**:
```yaml
metadata:
  mixins:
    - ../prompt-fragments/code-quality.yaml
```

**Provides**:
- Code quality assessment framework
- Design principles (SOLID, DRY, KISS, YAGNI)
- Error handling guidelines
- Testing and testability criteria
- Performance considerations
- Security best practices
- Language-specific conventions
- Quality scoring rubric

---

## Tool Configurations

### Bash Safe Config
**File**: `tool-configs/bash-safe-config.yaml`

Conservative Bash configuration with whitelist approach.

**Apply To**:
```yaml
agent:
  tools:
    - name: Bash
      config: ../tool-configs/bash-safe-config.yaml
```

**Features**:
- Whitelist of safe commands (git, npm, ls, pwd, etc.)
- Blacklist of dangerous patterns (rm -rf, sudo, curl | bash, etc.)
- Required confirmation for destructive operations
- Rate limiting (15/min, 100/hour)
- 2-minute timeout

**Allowed Commands**:
- Git: status, diff, log, add, commit, push, pull
- NPM: install, test, run, build
- File operations: ls, pwd, cat, grep, find, mkdir
- Version checking: node --version, npm --version, etc.

**Blocked Patterns**:
- Destructive: rm -rf, mkfs, dd
- Privilege escalation: sudo, su
- Network: curl | bash, wget | sh
- File redirection: >, >>
- Package publishing: npm publish

---

## Variable Interpolation

Templates support variable substitution using `{{ variable }}` syntax.

### Basic Usage
```yaml
prompt: |
  Analyze the file at {{ targetFile }}.
```

### Default Values
```yaml
prompt: |
  Output path: {{ outputPath | default: ./output.md }}
```

### Conditional Logic
```yaml
prompt: |
  {{ if runTests }}
  Run tests after refactoring.
  {{ endif }}
```

### Built-in Variables
- `{{ cwd }}`: Current working directory
- `{{ timestamp }}`: Current ISO timestamp
- `{{ templateName }}`: Name of the template
- `{{ templateVersion }}`: Template version

---

## Creating Custom Templates

### 1. Standalone Template

```yaml
metadata:
  name: my-custom-agent
  version: 1.0.0
  description: Custom agent for specific task

agent:
  description: Agent description
  prompt: |
    [Your prompt here]
  tools:
    - Read
    - Write

validation:
  required:
    - myVariable

runtime:
  timeout: 300000
```

### 2. Template with Inheritance

```yaml
metadata:
  name: specialized-analyzer
  extends: ../base-templates/code-analysis-base.yaml

agent:
  prompt: |
    [Additional prompt appended to base]
  tools:
    - Edit  # Merged with base tools (Read, Grep, Glob)

validation:
  required:
    - targetFile
```

### 3. Template with Mixins

```yaml
metadata:
  name: safe-editor
  mixins:
    - ../prompt-fragments/file-safety.yaml
    - ../prompt-fragments/code-quality.yaml

agent:
  prompt: |
    [Your prompt]
    [Mixin instructions appended here]
```

---

## Best Practices

### Template Organization
- **Base templates**: Shared configuration and prompts
- **Fragments**: Small, reusable prompt pieces
- **Tool configs**: Standardized tool permissions
- **Complete templates**: Full agent definitions

### Naming Conventions
- Templates: `{purpose}-agent.yaml`
- Base templates: `base-{category}.yaml`
- Fragments: `{topic}.yaml`
- Tool configs: `{tool}-{variant}-config.yaml`

### Composition Strategy

**Use `extends:` when**:
- Building specialized variants of a base agent
- Sharing complete agent configurations
- Creating agent families with common behavior

**Use `mixins:` when**:
- Adding optional capabilities
- Sharing small prompt guidelines
- Composing multiple concerns (safety + quality + testing)

**Use `toolConfigs:` when**:
- Enforcing consistent tool permissions
- Sharing validation rules
- Standardizing error handling

---

## Testing Templates

### Validate Template Syntax
```typescript
import { validateTemplate } from '@tkr/agent-template-system';

const result = await validateTemplate('templates/code-reviewer-agent.yaml');
if (!result.valid) {
  console.error('Validation errors:', result.errors);
}
```

### Test Template with Variables
```typescript
const agent = await factory.create('code-reviewer-agent', {
  targetFile: '/test/fixtures/sample.ts',
  outputPath: '/tmp/test-review.md'
});

const result = await agent.execute();
console.log('Agent output:', result);
```

---

## Troubleshooting

### Template Not Found
```
Error: Template not found: code-reviewer-agent
```
**Solution**: Ensure the template file exists and the path is correct.

### Missing Required Variable
```
Error: Missing required variable: targetFile
```
**Solution**: Provide all required variables when creating the agent.

### Circular Dependency
```
Error: Circular dependency detected: A extends B extends A
```
**Solution**: Check your `extends:` chain for circular references.

### Invalid Tool Name
```
Error: Invalid tool name: WebSearch
```
**Solution**: Use only local tools: Read, Write, Edit, Bash, Grep, Glob.

---

## Contributing

### Adding New Templates
1. Create template file in appropriate directory
2. Follow naming conventions
3. Include comprehensive documentation in prompt
4. Add validation rules
5. Test with real data
6. Update this README

### Template Checklist
- [ ] Valid YAML syntax
- [ ] All required fields present
- [ ] Clear, actionable prompt
- [ ] Appropriate tool selection
- [ ] Validation rules defined
- [ ] Examples in prompt
- [ ] README entry added

---

## License

See main project LICENSE file.

---

## Support

For issues, questions, or contributions:
- GitHub: https://github.com/TuckerTucker/tkr-llm-client
- Author: Tucker (@TuckerTucker)

---

**Last Updated**: 2025-11-09
**Version**: 1.0.0
