/**
 * Agent Factory Example
 *
 * Demonstrates how to use the AgentFactory to create agent configurations
 * from templates.
 */

import { AgentFactory } from '../src/templates';
import * as path from 'path';

async function main() {
  console.log('=== Agent Factory Example ===\n');

  // Initialize factory with template directory
  const factory = new AgentFactory({
    templateDir: path.join(__dirname, '../tests/templates/fixtures'),
    cacheEnabled: false, // Disable caching for demonstration
  });

  // Scan template directory
  console.log('Scanning templates...');
  await factory.scan();

  // Get catalog of available templates
  const catalog = factory.getRegistry().getCatalog();
  console.log(`\nFound ${catalog.count} templates:`);
  catalog.templates.forEach((template) => {
    console.log(`  - ${template.name}: ${template.description}`);
  });

  console.log('\n=== Creating Agent from Template ===\n');

  // Create agent configuration from template
  const config = await factory.create('code-reviewer', {
    targetFile: './src/index.ts',
    concerns: 'security vulnerabilities, error handling, code duplication',
  });

  console.log('Agent Configuration Created:');
  console.log(`  Model: ${config.settings.model}`);
  console.log(`  Tools: ${config.tools.join(', ')}`);
  console.log(`  Temperature: ${config.settings.temperature}`);
  console.log(`  Max Turns: ${config.settings.maxTurns}`);
  console.log('\nPrompt Preview:');
  console.log(config.prompt.substring(0, 200) + '...\n');

  console.log('=== Creating Agent from Path ===\n');

  // Create agent from file path (useful for templates outside template directory)
  const configFromPath = await factory.createFromPath(
    path.join(__dirname, '../tests/templates/fixtures/test-writer.yaml'),
    {
      targetFile: './src/utils/retry.ts',
      testFramework: 'vitest',
      testPath: './tests/utils/retry.test.ts',
    }
  );

  console.log('Agent Configuration Created from Path:');
  console.log(`  Model: ${configFromPath.settings.model}`);
  console.log(`  Tools: ${configFromPath.tools.join(', ')}`);
  console.log('\nPrompt Preview:');
  console.log(configFromPath.prompt.substring(0, 200) + '...\n');

  console.log('=== Error Handling ===\n');

  try {
    // Try to create agent with missing required variables
    await factory.create('code-reviewer', {
      // Missing required 'targetFile' and 'concerns'
    });
  } catch (error) {
    console.log('✓ Caught expected error:');
    console.log(`  ${error.constructor.name}: ${error.message}\n`);
  }

  try {
    // Try to create agent from non-existent template
    await factory.create('nonexistent-template');
  } catch (error) {
    console.log('✓ Caught expected error:');
    console.log(`  ${error.constructor.name}: ${error.message}\n`);
  }

  console.log('=== Template Filtering ===\n');

  // Filter templates by tag
  const codeAnalysisTemplates = factory.getRegistry().filterByTag('code-analysis');
  console.log(`Templates with tag 'code-analysis': ${codeAnalysisTemplates.length}`);
  codeAnalysisTemplates.forEach((template) => {
    console.log(`  - ${template.name}`);
  });

  // Filter templates by tool
  const writeToolTemplates = factory.getRegistry().filterByTool('Write');
  console.log(`\nTemplates using 'Write' tool: ${writeToolTemplates.length}`);
  writeToolTemplates.forEach((template) => {
    console.log(`  - ${template.name}`);
  });

  console.log('\n=== Example Complete ===');
}

// Run example
main().catch((error) => {
  console.error('Error running example:', error);
  process.exit(1);
});
