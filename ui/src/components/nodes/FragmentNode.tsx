/**
 * FragmentNode Component
 *
 * Rounded node with green tint (150x100px default) representing a prompt fragment.
 *
 * Features:
 * - Shows: name, type, usage count
 * - Output handle only (connects to templates)
 * - Hover: Preview instructions tooltip
 * - Rounded corners for visual distinction
 *
 * @see .context-kit/orchestration/reactflow-template-ui/integration-contracts/02-node-component-contracts.md
 */

import React, { useState } from 'react';
import type { BaseNodeProps, FragmentNodeData } from '../../lib/types/ui-types';
import { BaseNode } from './BaseNode';
import { nodeColors, getDetailLevel, cn } from './styles';

export interface FragmentNodeProps extends BaseNodeProps<FragmentNodeData> {}

/**
 * Fragment Node Component
 *
 * Visual specification:
 * ╭────────────────────────────╮
 * │ 📝 file-safety             │
 * │ Type: Safety Instructions  │
 * │                            │
 * │ Used by: 3 templates       │
 * ╰────────────────────────────╯
 *                           ○
 *                      (output)
 */
export const FragmentNode: React.FC<FragmentNodeProps> = ({
  id,
  data,
  selected,
  dragging,
  zoomLevel = 1.5, // Default to 'full' detail level
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const detailLevel = getDetailLevel(zoomLevel);
  const colors = nodeColors.fragment;

  // Icon
  const icon = (
    <span className="text-xl" role="img" aria-label="Fragment">
      📝
    </span>
  );

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
            {/* Fragment type */}
            <div className="text-gray-600 text-xs">
              Type: {data.fragmentType || 'Instructions'}
            </div>

            {/* Instructions preview (in full detail) */}
            {detailLevel === 'full' && data.instructions && (
              <div className="text-gray-700 text-xs line-clamp-3">
                {data.instructions}
              </div>
            )}

            {/* Usage count */}
            <div
              className={cn('text-xs font-medium', colors.text)}
              title={data.usedBy.length > 0 ? `Used by: ${data.usedBy.join(', ')}` : 'Not used'}
            >
              Used by: {data.usedBy.length} template{data.usedBy.length !== 1 ? 's' : ''}
            </div>

            {/* Show templates using this fragment (in full detail) */}
            {detailLevel === 'full' && data.usedBy.length > 0 && (
              <div className="text-xs text-gray-500">
                {data.usedBy.slice(0, 3).join(', ')}
                {data.usedBy.length > 3 && ` +${data.usedBy.length - 3} more`}
              </div>
            )}
          </div>
        );
    }
  })();

  // Tooltip for hover preview
  const tooltip = showPreview && data.instructions && (
    <div className="absolute z-50 top-full left-0 mt-2 p-3 bg-white border border-gray-300 rounded-lg shadow-lg max-w-md">
      <div className="text-xs font-semibold mb-2">Fragment Preview:</div>
      <div className="text-xs text-gray-700 max-h-40 overflow-auto">
        {data.instructions}
      </div>
    </div>
  );

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowPreview(true)}
      onMouseLeave={() => setShowPreview(false)}
    >
      <div className={cn('rounded-2xl overflow-hidden')}>
        <BaseNode
          id={id}
          data={data}
          selected={selected}
          dragging={dragging}
          zoomLevel={zoomLevel}
          icon={icon}
          showInputHandle={false}
          showOutputHandle={true}
          outputHandleId="fragment-output"
        >
          {content}
        </BaseNode>
      </div>
      {tooltip}
    </div>
  );
};

export default FragmentNode;
