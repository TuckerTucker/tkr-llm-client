/**
 * Edge Components Export
 *
 * Exports all edge components for the ReactFlow Template UI.
 *
 * @see .context-kit/orchestration/reactflow-template-ui/integration-contracts/02-node-component-contracts.md
 */

// Import edge component to bring it into scope
import { CustomEdge } from './CustomEdge';

// Re-export for external use
export { CustomEdge };
export type { CustomEdgeProps } from './CustomEdge';

/**
 * Edge type registry for ReactFlow
 *
 * Usage:
 * ```tsx
 * import { edgeTypes } from './components/edges';
 *
 * <ReactFlow edgeTypes={edgeTypes} ... />
 * ```
 */
export const edgeTypes = {
  custom: CustomEdge,
  extends: CustomEdge,
  mixin: CustomEdge,
  variable: CustomEdge,
  toolRef: CustomEdge,
  bundle: CustomEdge,
};
