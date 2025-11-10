#!/usr/bin/env tsx
/**
 * Export Verification Script
 *
 * Verifies that all expected exports from the template system are available
 * in the built library. This ensures the build process correctly exports
 * all modules and types.
 *
 * Usage: npx tsx scripts/verify-exports.ts
 */

import * as path from 'path';

// Track verification results
interface VerificationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
}

const result: VerificationResult = {
  success: true,
  errors: [],
  warnings: [],
};

/**
 * Verifies that a module can be imported and contains expected exports.
 */
function verifyExports(modulePath: string, expectedExports: string[]): void {
  console.log(`\nVerifying exports from: ${modulePath}`);

  try {
    // Dynamic import to check if module loads
    const module = require(modulePath);

    // Check each expected export
    const missing: string[] = [];
    const present: string[] = [];

    for (const exportName of expectedExports) {
      if (exportName in module) {
        present.push(exportName);
      } else {
        missing.push(exportName);
      }
    }

    // Report results
    if (missing.length > 0) {
      result.success = false;
      result.errors.push(`Missing exports from ${modulePath}: ${missing.join(', ')}`);
      console.error(`  ❌ Missing exports: ${missing.join(', ')}`);
    }

    if (present.length > 0) {
      console.log(`  ✅ Found ${present.length} exports`);
    }

  } catch (error) {
    result.success = false;
    const errorMsg = error instanceof Error ? error.message : String(error);
    result.errors.push(`Failed to load module ${modulePath}: ${errorMsg}`);
    console.error(`  ❌ Failed to load: ${errorMsg}`);
  }
}

/**
 * Main verification function.
 */
function main(): void {
  console.log('='.repeat(60));
  console.log('Export Verification Script');
  console.log('='.repeat(60));

  // Get the dist directory
  const distDir = path.resolve(__dirname, '..', 'dist');
  console.log(`\nChecking dist directory: ${distDir}\n`);

  // Verify main index exports
  console.log('--- Main Library Exports ---');
  verifyExports(path.join(distDir, 'index.js'), [
    // Client exports (runtime classes/functions)
    'LLMClient',
    'ClaudeSDKClient',
    'LocalLLMClient',

    // Server exports (runtime classes/functions)
    'LLMServerManager',

    // Template system exports (should be re-exported from templates/index)
    'AgentFactory',
    'TemplateRegistry',
    'loadTemplate',
    'loadFragment',
    'loadToolConfig',
    'interpolate',
    'validateTemplate',
    'resolveTemplate',
    'isAgentTemplate',
    'isPromptFragment',
    'isToolConfig',
    'isToolReference',

    // Utility exports
    'extractThinkingBlocks',
    'collectMessages',
    'withRetry',

    // Error exports
    'LLMClientError',
    'QueryError',
    'TemplateLoaderError',
    'InterpolationError',
    'TemplateResolutionError',
  ]);

  // Verify templates module exports
  console.log('\n--- Templates Module Exports ---');
  verifyExports(path.join(distDir, 'templates', 'index.js'), [
    // Types
    'isAgentTemplate',
    'isPromptFragment',
    'isToolConfig',
    'isToolReference',

    // Registry
    'TemplateRegistry',

    // Factory
    'AgentFactory',
    'FactoryError',
    'TemplateNotFoundError',
    'MissingVariablesError',
    'TemplateValidationError',

    // Loader
    'loadTemplate',
    'loadFragment',
    'loadToolConfig',
    'TemplateLoaderError',
    'FileNotFoundError',
    'FileAccessError',
    'YAMLParseError',
    'SchemaValidationError',

    // Interpolation
    'interpolate',
    'hasVariables',
    'extractVariables',
    'validateTemplateVariables',
    'InterpolationError',

    // Validator
    'validateTemplate',
    'validateToolConfig',
    'validateFragment',
    'validateVariables',

    // Resolver
    'resolveTemplate',
    'resolveExtends',
    'resolveFragments',
    'resolveToolConfigs',
    'TemplateResolutionError',
    'CircularInheritanceError',
    'MaxDepthExceededError',
  ]);

  // Verify individual template modules
  console.log('\n--- Individual Template Modules ---');

  verifyExports(path.join(distDir, 'templates', 'types.js'), [
    'isAgentTemplate',
    'isPromptFragment',
    'isToolConfig',
    'isToolReference',
  ]);

  verifyExports(path.join(distDir, 'templates', 'loader.js'), [
    'loadTemplate',
    'loadFragment',
    'loadToolConfig',
    'TemplateLoaderError',
  ]);

  verifyExports(path.join(distDir, 'templates', 'interpolation.js'), [
    'interpolate',
    'hasVariables',
    'extractVariables',
    'validateVariables',
  ]);

  verifyExports(path.join(distDir, 'templates', 'validator.js'), [
    'validateTemplate',
    'validateToolConfig',
    'validateFragment',
    'validateVariables',
  ]);

  verifyExports(path.join(distDir, 'templates', 'resolver.js'), [
    'resolveTemplate',
    'resolveExtends',
    'resolveFragments',
    'resolveToolConfigs',
  ]);

  verifyExports(path.join(distDir, 'templates', 'registry.js'), [
    'TemplateRegistry',
  ]);

  verifyExports(path.join(distDir, 'templates', 'factory.js'), [
    'AgentFactory',
  ]);

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('Verification Summary');
  console.log('='.repeat(60));

  if (result.errors.length > 0) {
    console.log('\n❌ ERRORS:');
    result.errors.forEach(err => console.log(`  - ${err}`));
  }

  if (result.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    result.warnings.forEach(warn => console.log(`  - ${warn}`));
  }

  if (result.success) {
    console.log('\n✅ All exports verified successfully!');
  } else {
    console.log('\n❌ Verification failed!');
    process.exit(1);
  }
}

// Run verification
main();
