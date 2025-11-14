/**
 * Node Components Export
 *
 * Exports all node components for the ReactFlow Template UI.
 *
 * @see .context-kit/orchestration/reactflow-template-ui/integration-contracts/02-node-component-contracts.md
 */

// Base components
export { BaseNode } from './BaseNode';
export type { BaseNodeComponentProps } from './BaseNode';

export { NodeHandle } from './NodeHandle';
export type { NodeHandleProps } from './NodeHandle';

// Node components
import { TemplateNode } from './TemplateNode';
import { FragmentNode } from './FragmentNode';
import { VariableNode } from './VariableNode';
import { ToolConfigNode } from './ToolConfigNode';
import { BundleNode } from './BundleNode';
import { ResolvedNode } from './ResolvedNode';

export { TemplateNode };
export type { TemplateNodeProps } from './TemplateNode';

export { FragmentNode };
export type { FragmentNodeProps } from './FragmentNode';

export { VariableNode };
export type { VariableNodeProps } from './VariableNode';

export { ToolConfigNode };
export type { ToolConfigNodeProps } from './ToolConfigNode';

export { BundleNode };
export type { BundleNodeProps } from './BundleNode';

export { ResolvedNode };
export type { ResolvedNodeProps } from './ResolvedNode';

// Styling system
export * from './styles';

/**
 * Node type registry for ReactFlow
 *
 * Usage:
 * ```tsx
 * import { nodeTypes } from './components/nodes';
 *
 * <ReactFlow nodeTypes={nodeTypes} ... />
 * ```
 */
export const nodeTypes = {
  template: TemplateNode,
  fragment: FragmentNode,
  variable: VariableNode,
  toolConfig: ToolConfigNode,
  bundle: BundleNode,
  resolved: ResolvedNode,
};
