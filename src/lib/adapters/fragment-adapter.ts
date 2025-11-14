/**
 * Fragment Adapter
 *
 * Converts PromptFragment to/from FragmentNodeData for ReactFlow.
 *
 * @module lib/adapters/fragment-adapter
 * @version 1.0.0
 * @author Data Bridge Engineer (Agent 1)
 */

import type { PromptFragment } from '../../templates/types';
import type { FragmentNodeData } from '../types/ui-types';
import type { Node } from '../types/reactflow';
import { AdapterError } from './errors';

/**
 * Converts PromptFragment to ReactFlow Node with FragmentNodeData.
 *
 * @param fragment - Fragment from file
 * @param usedBy - Template names using this fragment
 * @param position - Optional position
 * @returns ReactFlow Node with FragmentNodeData
 * @throws {AdapterError} If fragment is invalid
 *
 * @example
 * ```typescript
 * const fragment = await loader.loadFragment('safety-checks.yml');
 * const usedBy = ['code-reviewer', 'file-writer'];
 * const node = fragmentToNode(fragment, usedBy, { x: 100, y: 100 });
 * ```
 */
export function fragmentToNode(
  fragment: PromptFragment,
  usedBy: string[],
  position?: { x: number; y: number }
): Node<FragmentNodeData> {
  try {
    // Validate required fields
    if (!fragment?.fragment?.name) {
      throw new Error('Fragment missing fragment.name');
    }
    if (!fragment?.fragment?.instructions) {
      throw new Error('Fragment missing fragment.instructions');
    }

    // Build node data
    const nodeData: FragmentNodeData = {
      id: fragment.fragment.name,
      type: 'fragment',
      name: fragment.fragment.name,
      fragment,
      instructions: fragment.fragment.instructions,
      usedBy: [...usedBy], // Copy array to avoid mutation
      metadata: {
        hasExample: !!fragment.fragment.example,
        hasValidation: !!fragment.fragment.validation,
        hasSafetyChecks: !!fragment.fragment.safetyChecks,
      },
    };

    // Build ReactFlow node
    const node: Node<FragmentNodeData> = {
      id: fragment.fragment.name,
      type: 'fragment',
      position: position || { x: 0, y: 0 },
      data: nodeData,
      draggable: true,
      selectable: true,
    };

    return node;
  } catch (error) {
    throw new AdapterError(
      `Failed to convert fragment to node: ${(error as Error).message}`,
      fragment,
      'fragment'
    );
  }
}

/**
 * Converts ReactFlow Node with FragmentNodeData back to PromptFragment.
 *
 * @param node - ReactFlow node with FragmentNodeData
 * @returns PromptFragment
 * @throws {AdapterError} If node is invalid
 *
 * @example
 * ```typescript
 * const fragment = nodeToFragment(node);
 * await fs.writeFile('fragment.yml', yaml.dump(fragment));
 * ```
 */
export function nodeToFragment(node: Node<FragmentNodeData>): PromptFragment {
  try {
    // Validate node structure
    if (!node?.data?.fragment) {
      throw new Error('Node missing fragment data');
    }

    // Return the stored fragment (it's the source of truth)
    return node.data.fragment;
  } catch (error) {
    throw new AdapterError(
      `Failed to convert node to fragment: ${(error as Error).message}`,
      node,
      'fragment'
    );
  }
}
