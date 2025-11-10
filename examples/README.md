# Examples

This directory contains usage examples for the tkr-llm-client library, demonstrating various features and usage patterns.

## Available Examples

### 1. Simple Query (`simple-query.ts`)

Basic usage of LLMClient without the template system.

**Features:**
- Starting the local LLM server
- Direct queries with `queryDirect()`
- Listening for thinking blocks
- Server lifecycle management

**Run:**
```bash
npx ts-node examples/simple-query.ts
```

---

### 2. Template Registry Demo (`template-registry-demo.ts`)

Demonstrates template discovery and management using TemplateRegistry.

**Features:**
- Scanning template directories
- Getting template catalogs
- Filtering templates by tag or tool
- Accessing template metadata

**Run:**
```bash
npx ts-node examples/template-registry-demo.ts
```

---

### 3. Agent Factory Example (`agent-factory-example.ts`)

Shows how to use AgentFactory to create agent configurations from templates.

**Features:**
- Initializing the factory
- Creating agents from template names
- Creating agents from file paths
- Error handling (missing variables, invalid templates)
- Template filtering and discovery

**Run:**
```bash
npx ts-node examples/agent-factory-example.ts
```

---

### 4. Template Usage Examples (`template-usage.ts`) ⭐ NEW

**Comprehensive examples of the agent template system**, demonstrating real-world usage patterns.

**Features:**
- **Code Review Agent** - Review code for security, performance, or style issues
- **Test Writer Agent** - Generate unit tests with configurable coverage targets
- **Documentation Generator** - Create documentation from source code
- **Error Handling** - Handle missing variables, invalid templates, and type errors
- **Advanced Factory Usage** - Template discovery, filtering, and configuration
- **LLMClient Integration** - Full workflow from template to execution

**Run all examples:**
```bash
npx ts-node examples/template-usage.ts
```

**Run specific examples:**
Edit the `main()` function in `template-usage.ts` to uncomment the examples you want to run.

---

## Template System Overview

The template system provides reusable, configurable agent definitions stored as YAML files.

### Quick Start

```typescript
import { LLMClient } from 'tkr-llm-client';

const client = new LLMClient({ claudeSDK: {} });

// Use a template with variables
for await (const msg of client.queryFromTemplate('code-reviewer', {
  file: './src/index.ts',
  concern: 'security'
})) {
  console.log(msg.content);
}
```

### Template Structure

Templates are YAML files with this structure:

```yaml
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
    Review the code in {{ file }} for {{ concern }}.
  tools:
    - Read
    - Grep
    - Write

validation:
  required:
    - file
    - concern
  types:
    concern:
      type: enum
      enum: [security, performance, style]

runtime:
  workingDirectory: "{{ cwd }}"
  timeout: 30000
```

### Available Templates (Test Fixtures)

The examples use templates from `tests/templates/fixtures/` for demonstration:

| Template | Description | Required Variables | Optional Variables |
|----------|-------------|-------------------|-------------------|
| **code-reviewer** | Reviews code for quality and security | `file`, `concern` | `outputFormat` |
| **test-writer** | Generates unit tests | `sourceFile` | `coverage` (default: 80) |
| **doc-generator** | Generates documentation | `module` | - |

### Creating Your Own Templates

1. Create a template directory:
```bash
mkdir -p agent-templates
```

2. Create a template file (e.g., `agent-templates/my-agent.yaml`):
```yaml
metadata:
  name: my-agent
  version: 1.0.0
  description: My custom agent

agent:
  description: Does something useful
  prompt: |
    Do something with {{ input }}.
  tools:
    - Read
    - Write

validation:
  required:
    - input
```

3. Use your template:
```typescript
const client = new LLMClient({ claudeSDK: {} });

for await (const msg of client.queryFromTemplate('my-agent', {
  input: 'some value'
})) {
  console.log(msg.content);
}
```

### Two Ways to Use Templates

#### Method 1: Direct with `queryFromTemplate()` (Recommended)

Simplest approach - LLMClient handles everything:

```typescript
const client = new LLMClient({ claudeSDK: {} });

for await (const msg of client.queryFromTemplate('code-reviewer', {
  file: './src/index.ts',
  concern: 'security'
})) {
  console.log(msg.content);
}
```

#### Method 2: Factory Pattern (Advanced)

For more control over template discovery and configuration:

```typescript
import { AgentFactory } from 'tkr-llm-client/templates';

// 1. Create factory and scan templates
const factory = new AgentFactory({
  templateDir: './agent-templates'
});
await factory.scan();

// 2. Create configuration
const config = await factory.create('code-reviewer', {
  file: './src/index.ts',
  concern: 'security'
});

// 3. Use with LLMClient
const client = new LLMClient({ claudeSDK: {} });
for await (const msg of client.query(config.prompt, {
  allowedTools: config.tools,
  temperature: config.settings.temperature,
  maxTurns: config.settings.maxTurns
})) {
  console.log(msg.content);
}
```

### Error Handling

The template system provides detailed error messages:

```typescript
try {
  for await (const msg of client.queryFromTemplate('code-reviewer', {
    // Missing required 'file' and 'concern'
  })) {
    console.log(msg.content);
  }
} catch (error) {
  // MissingVariablesError: Missing required variables for template "code-reviewer": file, concern
  console.error(error.message);
}
```

**Common Errors:**
- `TemplateNotFoundError` - Template doesn't exist in registry
- `MissingVariablesError` - Required variables not provided
- `TemplateValidationError` - Template schema validation failed
- `FactoryError` - General template processing error

### Template Discovery

Find templates by tag or tool:

```typescript
const factory = new AgentFactory();
await factory.scan();

// Find all code analysis templates
const codeTemplates = factory.getRegistry().filterByTag('code-analysis');

// Find all templates using the Write tool
const writeTemplates = factory.getRegistry().filterByTool('Write');

// Get full catalog
const catalog = factory.getRegistry().getCatalog();
console.log(`Found ${catalog.count} templates`);
console.log(`Tags: ${catalog.tags.join(', ')}`);
```

## Running Examples

### Prerequisites

1. **Install dependencies:**
```bash
npm install
```

2. **Build the project (if not using ts-node):**
```bash
npm run build
```

3. **For local LLM examples, ensure server is configured:**
```bash
export LLM_PYTHON_PATH=./venv/bin/python
# or set in .env file
```

### Run with ts-node (TypeScript)

```bash
npx ts-node examples/template-usage.ts
```

### Run with compiled JavaScript

```bash
npm run build
node dist/examples/template-usage.js
```

### Run with npm scripts

Add to `package.json`:
```json
{
  "scripts": {
    "example:templates": "ts-node examples/template-usage.ts",
    "example:simple": "ts-node examples/simple-query.ts",
    "example:registry": "ts-node examples/template-registry-demo.ts",
    "example:factory": "ts-node examples/agent-factory-example.ts"
  }
}
```

Then run:
```bash
npm run example:templates
```

## Expected Output

### Template Usage Example

```
╔════════════════════════════════════════════════════════════════╗
║         Agent Template System - Usage Examples                ║
╚════════════════════════════════════════════════════════════════╝

=== Example 4: Error Handling ===

Test 1: Missing required variables
✓ Caught expected error: MissingVariablesError
  Message: Missing required variables for template "code-reviewer": file, concern

Test 2: Template not found
✓ Caught expected error: Error
  Message: Template not found: nonexistent-template.

Test 3: Invalid variable type (enum violation)
✓ Caught expected error: MissingVariablesError
  Message: Missing required variables for template "code-reviewer": file, concern

✅ Error handling examples complete!

=== Example 5: Advanced Usage with AgentFactory ===

Scanning templates...

Found 8 templates
Tags: code-analysis, security, quality, testing, code-generation, documentation

Templates tagged "code-analysis":
  - code-reviewer: Reviews code for quality and security issues
  - doc-generator: Generates documentation from source code

Templates using "Write" tool:
  - code-reviewer
  - test-writer
  - doc-generator

Creating agent configuration from template...

Resolved Configuration:
  Model: claude-sonnet-4-5-20250929
  Temperature: undefined
  Max Turns: undefined
  Tools: Read, Grep, Write
  Working Directory: /current/working/directory
  Timeout: 30000ms

Prompt Preview:
Review the code in ./src/index.ts for performance.
Provide detailed feedback on potential issues....

✅ Advanced factory examples complete!

╔════════════════════════════════════════════════════════════════╗
║                   All Examples Complete!                      ║
╚════════════════════════════════════════════════════════════════╝
```

## Template Development Workflow

1. **Create template:**
```bash
# Create template file
cat > agent-templates/my-agent.yaml << 'EOF'
metadata:
  name: my-agent
  version: 1.0.0
  description: My agent
agent:
  prompt: "{{ task }}"
  tools: [Read]
validation:
  required: [task]
EOF
```

2. **Test template:**
```typescript
// test-my-agent.ts
import { LLMClient } from 'tkr-llm-client';

const client = new LLMClient({ claudeSDK: {} });

for await (const msg of client.queryFromTemplate('my-agent', {
  task: 'List files in ./src'
})) {
  console.log(msg.content);
}
```

3. **Validate and iterate:**
```bash
npx ts-node test-my-agent.ts
```

## Additional Resources

- **Template Type System:** See `src/templates/types.ts` for complete type definitions
- **Template Validation:** See `src/templates/validator.ts` for validation rules
- **Template Resolution:** See `src/templates/resolver.ts` for inheritance and composition
- **LLMClient Integration:** See `src/client/LLMClient.ts` for `queryFromTemplate()` implementation

## Tips

1. **Use descriptive template names:** `code-reviewer` is better than `reviewer`
2. **Define validation rules:** Catch errors early with `validation.required` and `validation.types`
3. **Provide defaults:** Use `default` values in validation rules for optional variables
4. **Tag your templates:** Use `metadata.tags` for easy discovery
5. **Document variables:** Include variable descriptions in template descriptions
6. **Start simple:** Begin with basic templates and add complexity as needed
7. **Test error cases:** Verify your templates handle missing/invalid variables gracefully

## Troubleshooting

**Template not found:**
- Check template directory path (`./agent-templates` by default)
- Ensure template file has `.yaml` or `.yml` extension
- Verify `metadata.name` matches the name you're using

**Missing variables:**
- Check template's `validation.required` list
- Provide all required variables in the second argument to `queryFromTemplate()`

**Invalid variable type:**
- Check template's `validation.types` for type constraints
- Ensure enum values match exactly (case-sensitive)

**Template validation errors:**
- Run `validateTemplate()` to check schema
- Verify template has required fields: `metadata`, `agent`, `agent.prompt`, `agent.tools`

## Contributing

When adding new examples:
1. Follow the existing code style
2. Include comprehensive comments
3. Add error handling
4. Update this README with the new example
5. Test with both `ts-node` and compiled JavaScript
