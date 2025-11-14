/**
 * Adapters Index
 *
 * Central export for all adapter functions.
 *
 * @module lib/adapters
 * @version 1.0.0
 */

// Export template adapter
export {
  templateToNode,
  nodeToTemplate,
  templatesToNodes,
  type LayoutStrategy,
} from './template-adapter';

// Export fragment adapter
export {
  fragmentToNode,
  nodeToFragment,
} from './fragment-adapter';

// Export config adapter
export {
  toolConfigToNode,
  nodeToToolConfig,
} from './config-adapter';

// Export variable adapter
export {
  variableToNode,
  extractVariableValues,
  createVariableNodesFromTemplate,
} from './variable-adapter';

// Export edge adapter
export {
  createExtendsEdge,
  createMixinEdge,
  createVariableEdge,
  createToolRefEdge,
  createBundleEdge,
} from './edge-adapter';

// Export error classes
export { AdapterError } from './errors';
