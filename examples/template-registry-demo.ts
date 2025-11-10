/**
 * Template Registry Demo
 *
 * Demonstrates how to use the TemplateRegistry to discover and manage templates.
 */

import { TemplateRegistry } from '../src/templates/registry';
import * as path from 'path';

async function main() {
  console.log('=== Template Registry Demo ===\n');

  // Create registry pointing to test fixtures
  const registry = new TemplateRegistry(
    path.join(__dirname, '../tests/templates/fixtures')
  );

  // Scan for templates
  console.log('Scanning for templates...');
  await registry.scan();
  console.log(`Found ${registry.size()} templates\n`);

  // Get full catalog
  const catalog = registry.getCatalog();
  console.log('=== Template Catalog ===');
  console.log(`Total templates: ${catalog.count}`);
  console.log(`Available tags: ${catalog.tags.join(', ')}\n`);

  // List all template names
  console.log('=== All Templates ===');
  registry.listNames().forEach((name) => {
    const template = registry.getTemplate(name);
    if (template) {
      console.log(`  - ${name} (v${template.metadata.version}): ${template.metadata.description}`);
    }
  });
  console.log();

  // Filter by tag
  console.log('=== Code Analysis Templates ===');
  const codeAnalysisTemplates = registry.filterByTag('code-analysis');
  codeAnalysisTemplates.forEach((entry) => {
    console.log(`  - ${entry.name}: ${entry.description}`);
    console.log(`    Tools: ${entry.tools.join(', ')}`);
  });
  console.log();

  // Filter by tool
  console.log('=== Templates Using Write Tool ===');
  const writeTemplates = registry.filterByTool('Write');
  writeTemplates.forEach((entry) => {
    console.log(`  - ${entry.name}: ${entry.description}`);
  });
  console.log();

  // Get specific template
  console.log('=== Code Reviewer Template Details ===');
  const codeReviewer = registry.getTemplate('code-reviewer');
  if (codeReviewer) {
    console.log(`Name: ${codeReviewer.metadata.name}`);
    console.log(`Version: ${codeReviewer.metadata.version}`);
    console.log(`Description: ${codeReviewer.metadata.description}`);
    console.log(`Tags: ${codeReviewer.metadata.tags?.join(', ')}`);
    console.log(`Tools: ${codeReviewer.agent.tools.join(', ')}`);
    console.log(`Required inputs: ${codeReviewer.validation?.required?.join(', ')}`);
    console.log(`Optional inputs: ${codeReviewer.validation?.optional?.join(', ')}`);
  }
  console.log();

  // Demonstrate refresh
  console.log('=== Refreshing Registry ===');
  await registry.refresh();
  console.log(`Templates after refresh: ${registry.size()}`);
  console.log(`Last scan: ${registry.getLastScanTime()?.toISOString()}`);
}

// Run demo
main().catch(console.error);
