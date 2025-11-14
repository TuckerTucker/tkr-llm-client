/**
 * State Management Index
 *
 * Central export for state sync and registry bridge functions.
 *
 * @module lib/state
 * @version 1.0.0
 */

// Export sync utilities
export {
  syncRegistryToNodes,
  syncNodesToTemplate,
  validateConnections,
  detectCircularInheritance,
} from './sync';

// Export registry bridge
export {
  loadFromRegistry,
  refreshRegistry,
  saveNodeToYAML,
  loadTemplateFromFile,
  watchRegistry,
} from './registry-bridge';
