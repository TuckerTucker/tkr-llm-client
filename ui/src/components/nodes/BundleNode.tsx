/**
 * BundleNode Component
 *
 * Container node with purple tint that represents a bundle of tools.
 *
 * Features:
 * - Shows: bundle name, contained tools
 * - Expandable/collapsible
 * - Output handle (connects to templates)
 * - Visual container appearance
 *
 * @see .context-kit/orchestration/reactflow-template-ui/integration-contracts/02-node-component-contracts.md
 */

import React from 'react';
import type { BaseNodeProps, BundleNodeData } from '../../lib/types/ui-types';
import { BaseNode } from './BaseNode';
import { nodeColors, getDetailLevel, cn } from './styles';

export interface BundleNodeProps extends BaseNodeProps<BundleNodeData> {
  onToggleExpand?: () => void;
}

/**
 * Tool Bundle Node Component
 *
 * Visual specification:
 * ┌────────────────────────────┐
 * │ 📦 file-operations         │
 * ├────────────────────────────┤
 * │ Contains:                  │
 * │  • Read                    │
 * │  • Write                   │
 * │  • Edit                    │
 * │  • Glob                    │
 * │  • Grep                    │
 * │                            │
 * │ [Expand] [Collapse]        │
 * └────────────────────────────┘
 *                          ○
 *                     (output)
 */
export const BundleNode: React.FC<BundleNodeProps> = ({
  id,
  data,
  selected,
  dragging,
  zoomLevel = 1.5, // Default to 'full' detail level
  onToggleExpand,
}) => {
  const detailLevel = getDetailLevel(zoomLevel);
  const colors = nodeColors.bundle;

  // Icon
  const icon = (
    <span className="text-xl" role="img" aria-label="Bundle">
      📦
    </span>
  );

  // Header actions (expand/collapse button)
  const headerActions =
    detailLevel !== 'minimal' && detailLevel !== 'compact' ? (
      <button
        className="text-xs text-purple-600 hover:text-purple-800 px-2 py-1 rounded hover:bg-purple-50"
        onClick={(e) => {
          e.stopPropagation();
          onToggleExpand?.();
        }}
        aria-label={data.expanded ? 'Collapse bundle' : 'Expand bundle'}
        title={data.expanded ? 'Collapse' : 'Expand'}
      >
        {data.expanded ? '▼' : '▶'}
      </button>
    ) : null;

  // Content based on detail level
  const content = (() => {
    switch (detailLevel) {
      case 'minimal':
      case 'compact':
        return null; // BaseNode handles minimal display

      case 'standard':
      case 'full':
        return (
          <div className="space-y-2 text-sm">
            {/* Bundle description */}
            <div className="text-gray-700">
              Contains {data.containedTools.length} tool{data.containedTools.length !== 1 ? 's' : ''}
            </div>

            {/* Tool list (when expanded or in full detail) */}
            {(data.expanded || detailLevel === 'full') && (
              <div className="space-y-1">
                <div className="text-xs font-semibold text-gray-600">Tools:</div>
                {data.containedTools.map((tool) => (
                  <div key={tool} className="text-xs text-gray-700 pl-2">
                    • {tool}
                  </div>
                ))}
              </div>
            )}

            {/* Collapsed view */}
            {!data.expanded && detailLevel !== 'full' && (
              <div className="text-xs text-gray-600">
                {data.containedTools.slice(0, 3).join(', ')}
                {data.containedTools.length > 3 && ` +${data.containedTools.length - 3} more`}
              </div>
            )}
          </div>
        );
    }
  })();

  return (
    <BaseNode
      id={id}
      data={data}
      selected={selected}
      dragging={dragging}
      zoomLevel={zoomLevel}
      icon={icon}
      headerActions={headerActions}
      showInputHandle={false}
      showOutputHandle={true}
      outputHandleId="bundle-output"
    >
      {content}
    </BaseNode>
  );
};

export default BundleNode;
