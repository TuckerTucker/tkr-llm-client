/**
 * Template System Usage Examples
 *
 * Demonstrates how to use the agent template system with LLMClient.queryFromTemplate()
 * and the AgentFactory for more advanced use cases.
 *
 * This example shows:
 * 1. Basic template usage with queryFromTemplate()
 * 2. Code review agent
 * 3. Test writer agent
 * 4. Documentation generator agent
 * 5. Error handling patterns
 * 6. Advanced usage with AgentFactory
 *
 * Run with:
 *   npx ts-node examples/template-usage.ts
 *   or
 *   npm run build && node dist/examples/template-usage.js
 */

import { LLMClient } from '../src';
import { AgentFactory } from '../src/templates';
import * as path from 'path';

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Templates are located in tests/templates/fixtures for this demo.
 * In production, you would use your own template directory.
 */
const TEMPLATE_DIR = path.join(__dirname, '../tests/templates/fixtures');

// ============================================================================
// EXAMPLE 1: Code Review Agent
// ============================================================================

/**
 * Demonstrates using queryFromTemplate() for code review.
 *
 * This is the simplest way to use the template system:
 * - LLMClient automatically loads and resolves the template
 * - Variables are interpolated into the prompt
 * - Agent streams response messages
 */
async function codeReviewExample() {
  console.log('\n=== Example 1: Code Review Agent ===\n');

  // Create LLM client (using Claude SDK in this example)
  const client = new LLMClient({
    claudeSDK: {
      enableFallback: true, // Fallback to cloud API if local server unavailable
    },
  });

  // Override the template directory for this demo
  // In production, templates would be in './agent-templates' by default
  (client as any).registry = undefined; // Clear any existing registry

  try {
    console.log('Running code review agent...');
    console.log('Template: code-reviewer');
    console.log('Target: ./src/client/LLMClient.ts');
    console.log('Concern: security\n');

    // Use queryFromTemplate() to execute the agent
    // This handles template loading, validation, and execution
    for await (const msg of client.queryFromTemplate(
      'code-reviewer',
      {
        file: './src/client/LLMClient.ts',
        concern: 'security',
        outputFormat: 'markdown',
      },
      {
        // Additional runtime options (optional)
        temperature: 0.7,
        maxTurns: 3,
      }
    )) {
      // Handle different message types
      if (msg.type === 'text') {
        console.log(`\n💬 [Response] ${msg.content || msg.text || ''}`);
      } else if (msg.type === 'tool_use') {
        console.log(`\n🔧 [Tool] ${msg.name || 'unknown'}`);
      } else if (msg.type === 'result') {
        console.log(`\n✅ [Result] ${msg.result || msg.content || ''}`);
      } else if (msg.type === 'error') {
        console.log(`\n❌ [Error] ${msg.content || ''}`);
      }
    }

    console.log('\n✅ Code review complete!');
  } catch (error) {
    console.error('❌ Code review failed:', error);
  } finally {
    client.shutdown();
  }
}

// ============================================================================
// EXAMPLE 2: Test Writer Agent
// ============================================================================

/**
 * Demonstrates using queryFromTemplate() for test generation.
 *
 * Shows how to:
 * - Provide required and optional variables
 * - Handle thinking blocks
 * - Track progress through message stream
 */
async function testWriterExample() {
  console.log('\n=== Example 2: Test Writer Agent ===\n');

  const client = new LLMClient({
    claudeSDK: {},
  });

  // Listen for thinking blocks (optional)
  client.on('thinking', (block) => {
    console.log(`\n🧠 Thinking: ${block.content.substring(0, 80)}...`);
  });

  try {
    console.log('Running test writer agent...');
    console.log('Template: test-writer');
    console.log('Source: ./src/utils/retry.ts');
    console.log('Coverage target: 90%\n');

    let messageCount = 0;

    for await (const msg of client.queryFromTemplate('test-writer', {
      sourceFile: './src/utils/retry.ts',
      coverage: 90, // Optional - has default value of 80
    })) {
      messageCount++;

      if (msg.type === 'text') {
        // Show first 200 chars of each text message
        const content = msg.content || msg.text || '';
        const preview = content.substring(0, 200);
        console.log(`\n💬 Message ${messageCount}: ${preview}...`);
      }
    }

    console.log(`\n✅ Test generation complete! (${messageCount} messages)`);
  } catch (error) {
    console.error('❌ Test generation failed:', error);
  } finally {
    client.shutdown();
  }
}

// ============================================================================
// EXAMPLE 3: Documentation Generator Agent
// ============================================================================

/**
 * Demonstrates using queryFromTemplate() for documentation generation.
 *
 * Shows how to:
 * - Use minimal template with only required variables
 * - Collect full response text
 * - Write output to file
 */
async function docGeneratorExample() {
  console.log('\n=== Example 3: Documentation Generator Agent ===\n');

  const client = new LLMClient({
    claudeSDK: {},
  });

  try {
    console.log('Running documentation generator agent...');
    console.log('Template: doc-generator');
    console.log('Module: ./src/templates/index.ts\n');

    // Collect all response text
    let fullResponse = '';

    for await (const msg of client.queryFromTemplate('doc-generator', {
      module: './src/templates/index.ts',
    })) {
      if (msg.type === 'text') {
        fullResponse += msg.content || msg.text || '';
        // Show progress
        process.stdout.write('.');
      }
    }

    console.log(`\n\n✅ Documentation generated! (${fullResponse.length} characters)`);
    console.log('\nPreview:');
    console.log(fullResponse.substring(0, 300) + '...');
  } catch (error) {
    console.error('❌ Documentation generation failed:', error);
  } finally {
    client.shutdown();
  }
}

// ============================================================================
// EXAMPLE 4: Error Handling
// ============================================================================

/**
 * Demonstrates error handling patterns.
 *
 * Shows how to handle:
 * - Missing required variables
 * - Template not found
 * - Invalid variable types
 * - Network errors
 */
async function errorHandlingExample() {
  console.log('\n=== Example 4: Error Handling ===\n');

  const client = new LLMClient({
    claudeSDK: {},
  });

  // Error 1: Missing required variables
  console.log('Test 1: Missing required variables');
  try {
    // code-reviewer requires 'file' and 'concern'
    for await (const msg of client.queryFromTemplate('code-reviewer', {
      // Missing both required variables
    })) {
      // Should not reach here
    }
  } catch (error: any) {
    console.log(`✓ Caught expected error: ${error.name}`);
    console.log(`  Message: ${error.message}\n`);
  }

  // Error 2: Template not found
  console.log('Test 2: Template not found');
  try {
    for await (const msg of client.queryFromTemplate('nonexistent-template', {})) {
      // Should not reach here
    }
  } catch (error: any) {
    console.log(`✓ Caught expected error: ${error.name}`);
    console.log(`  Message: ${error.message.split('\n')[0]}\n`);
  }

  // Error 3: Invalid variable type
  console.log('Test 3: Invalid variable type (enum violation)');
  try {
    // 'concern' must be one of: security, performance, style
    for await (const msg of client.queryFromTemplate('code-reviewer', {
      file: './src/index.ts',
      concern: 'invalid-concern', // Invalid enum value
    })) {
      // Should not reach here
    }
  } catch (error: any) {
    console.log(`✓ Caught expected error: ${error.name}`);
    console.log(`  Message: ${error.message.split('\n')[0]}\n`);
  }

  console.log('✅ Error handling examples complete!');
  client.shutdown();
}

// ============================================================================
// EXAMPLE 5: Advanced Usage with AgentFactory
// ============================================================================

/**
 * Demonstrates advanced usage with AgentFactory.
 *
 * Shows how to:
 * - Discover and filter templates
 * - Create configurations programmatically
 * - Use template catalog
 * - Create from file path
 */
async function advancedFactoryExample() {
  console.log('\n=== Example 5: Advanced Usage with AgentFactory ===\n');

  // Create factory
  const factory = new AgentFactory({
    templateDir: TEMPLATE_DIR,
    cacheEnabled: true, // Enable caching for performance
  });

  // Scan templates
  console.log('Scanning templates...');
  await factory.scan();

  // Get catalog
  const catalog = factory.getRegistry().getCatalog();
  console.log(`\nFound ${catalog.count} templates`);
  console.log(`Tags: ${catalog.tags.join(', ')}\n`);

  // Filter templates by tag
  console.log('Templates tagged "code-analysis":');
  const codeAnalysisTemplates = factory.getRegistry().filterByTag('code-analysis');
  codeAnalysisTemplates.forEach((t) => {
    console.log(`  - ${t.name}: ${t.description}`);
  });

  // Filter templates by tool
  console.log('\nTemplates using "Write" tool:');
  const writeTemplates = factory.getRegistry().filterByTool('Write');
  writeTemplates.forEach((t) => {
    console.log(`  - ${t.name}`);
  });

  // Create agent configuration
  console.log('\nCreating agent configuration from template...');
  const config = await factory.create('code-reviewer', {
    file: './src/index.ts',
    concern: 'performance',
  });

  console.log('\nResolved Configuration:');
  console.log(`  Model: ${config.settings.model}`);
  console.log(`  Temperature: ${config.settings.temperature}`);
  console.log(`  Max Turns: ${config.settings.maxTurns}`);
  console.log(`  Tools: ${config.tools.join(', ')}`);
  console.log(`  Working Directory: ${config.runtime.workingDirectory}`);
  console.log(`  Timeout: ${config.runtime.timeout}ms`);
  console.log('\nPrompt Preview:');
  console.log(config.prompt.substring(0, 150) + '...\n');

  // Create from file path (useful for templates outside template directory)
  console.log('Creating agent from file path...');
  const pathConfig = await factory.createFromPath(
    path.join(TEMPLATE_DIR, 'doc-generator.yaml'),
    {
      module: './src/templates/factory.ts',
    }
  );
  console.log(`✓ Loaded template: ${pathConfig.prompt.substring(0, 50)}...\n`);

  console.log('✅ Advanced factory examples complete!');
}

// ============================================================================
// EXAMPLE 6: Integration with LLMClient
// ============================================================================

/**
 * Demonstrates how to use AgentFactory with LLMClient.
 *
 * Shows the full workflow:
 * 1. Create configuration with factory
 * 2. Pass to LLMClient.query()
 * 3. Handle response stream
 */
async function factoryIntegrationExample() {
  console.log('\n=== Example 6: Factory Integration with LLMClient ===\n');

  // Create factory and scan
  const factory = new AgentFactory({
    templateDir: TEMPLATE_DIR,
  });
  await factory.scan();

  // Create agent configuration
  const config = await factory.create('test-writer', {
    sourceFile: './src/utils/streaming.ts',
    coverage: 85,
  });

  // Create client
  const client = new LLMClient({
    claudeSDK: {},
  });

  try {
    console.log('Executing agent with resolved configuration...\n');

    // Use the resolved config with LLMClient.query()
    for await (const msg of client.query(config.prompt, {
      allowedTools: config.tools,
      temperature: config.settings.temperature,
      maxTurns: config.settings.maxTurns,
      model: config.settings.model as any,
      timeout: config.runtime.timeout,
    })) {
      if (msg.type === 'text') {
        const content = msg.content || msg.text || '';
        console.log(`💬 ${content.substring(0, 100)}...`);
      }
    }

    console.log('\n✅ Integration example complete!');
  } catch (error) {
    console.error('❌ Execution failed:', error);
  } finally {
    client.shutdown();
  }
}

// ============================================================================
// MAIN - Run All Examples
// ============================================================================

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║         Agent Template System - Usage Examples                ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');

  console.log('\nThese examples demonstrate the tkr-llm-client template system.');
  console.log('Templates provide reusable, configurable agent configurations.');
  console.log('\nNote: Examples use test fixtures from tests/templates/fixtures/');
  console.log('In production, use your own templates in ./agent-templates/\n');

  try {
    // Run examples sequentially
    // Comment out examples you don't want to run

    // await codeReviewExample();
    // await testWriterExample();
    // await docGeneratorExample();
    await errorHandlingExample();
    await advancedFactoryExample();
    // await factoryIntegrationExample();

    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║                   All Examples Complete!                      ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
  } catch (error) {
    console.error('\n❌ Example execution failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

// Export for use in other scripts
export {
  codeReviewExample,
  testWriterExample,
  docGeneratorExample,
  errorHandlingExample,
  advancedFactoryExample,
  factoryIntegrationExample,
};
