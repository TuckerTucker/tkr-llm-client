/**
 * TemplateNode Component
 *
 * Large rectangular node (200x150px default) representing an agent template.
 *
 * Features:
 * - Shows: name, description, tags, tools, status
 * - Connection handles: input (for extends), output (for children)
 * - Visual indicators: validation status, cache status, version
 * - Actions: edit, delete, duplicate, export
 * - Semantic zoom: adapts detail based on zoom level
 *
 * @see .context-kit/orchestration/reactflow-template-ui/integration-contracts/02-node-component-contracts.md
 */

import React from 'react';
import type { BaseNodeProps, TemplateNodeData } from '../../lib/types/ui-types';
import { BaseNode } from './BaseNode';
import { nodeColors, getDetailLevel, cn } from './styles';

export interface TemplateNodeProps extends BaseNodeProps<TemplateNodeData> {}

/**
 * Template Node Component
 *
 * Visual specification:
 * ┌────────────────────────────────────────┐
 * │ 📋 code-reviewer            [⚙️][×]   │ ← Header
 * ├────────────────────────────────────────┤
 * │ Reviews code for quality and security  │ ← Description
 * │                                        │
 * │ Tags: [security] [code-analysis]       │ ← Metadata
 * │ Tools: Read, Grep, Write               │
 * │ Variables: 2 required                  │
 * ├────────────────────────────────────────┤
 * │ ✓ Valid  |  v1.0.0  |  💾 Cached      │ ← Footer
 * └────────────────────────────────────────┘
 *   ●                                     ○
 * (input)                           (output)
 */
export const TemplateNode: React.FC<TemplateNodeProps> = ({
  id,
  data,
  selected,
  dragging,
  zoomLevel = 1.5, // Default to 'full' detail level
}) => {
  console.log('🎨 TemplateNode rendering:', { id, data, selected });
  const detailLevel = getDetailLevel(zoomLevel);
  const colors = nodeColors.template;

  // Icon
  const icon = (
    <span className="text-xl" role="img" aria-label="Template">
      📋
    </span>
  );

  // Header actions (shown in standard and full detail)
  const headerActions =
    detailLevel !== 'minimal' && detailLevel !== 'compact' ? (
      <div className="flex gap-1">
        <button
          className="text-gray-400 hover:text-gray-600 p-1"
          onClick={(e) => {
            e.stopPropagation();
            console.log('Edit template:', id);
          }}
          aria-label="Edit template"
          title="Edit"
        >
          ⚙️
        </button>
        <button
          className="text-gray-400 hover:text-red-600 p-1"
          onClick={(e) => {
            e.stopPropagation();
            console.log('Delete template:', id);
          }}
          aria-label="Delete template"
          title="Delete"
        >
          ×
        </button>
      </div>
    ) : null;

  // Footer (shown in standard and full detail)
  const footer =
    detailLevel !== 'minimal' && detailLevel !== 'compact' ? (
      <div className="flex items-center justify-between gap-2">
        {/* Validation status */}
        <span className={cn('flex items-center gap-1', data.validationState?.valid ? 'text-green-600' : 'text-red-600')}>
          {data.validationState?.valid ? '✓ Valid' : `✗ ${data.validationState?.errors.length || 0} errors`}
        </span>

        {/* Version */}
        {data.version && (
          <span className="text-gray-500">v{data.version}</span>
        )}

        {/* Cache status */}
        {data.cached && (
          <span className="text-blue-500" title="Cached">
            💾
          </span>
        )}
      </div>
    ) : null;

  // Content based on detail level
  const content = (() => {
    switch (detailLevel) {
      case 'minimal':
      case 'compact':
        return null; // BaseNode handles minimal display

      case 'standard':
        return (
          <div className="space-y-2 text-sm">
            {/* Description */}
            <p className="text-gray-700 line-clamp-2">{data.description}</p>

            {/* Tags */}
            {data.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {data.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className={cn(
                      'px-2 py-0.5 rounded text-xs',
                      colors.bg,
                      colors.text
                    )}
                  >
                    {tag}
                  </span>
                ))}
                {data.tags.length > 3 && (
                  <span className="text-xs text-gray-500">
                    +{data.tags.length - 3}
                  </span>
                )}
              </div>
            )}

            {/* Tools count */}
            <div className="text-xs text-gray-600">
              Tools: {data.tools.length > 0 ? data.tools.slice(0, 3).join(', ') : 'None'}
              {data.tools.length > 3 && ` +${data.tools.length - 3}`}
            </div>

            {/* Variables */}
            {(data.requiredVariables.length > 0 || data.optionalVariables.length > 0) && (
              <div className="text-xs text-gray-600">
                Variables: {data.requiredVariables.length} required
                {data.optionalVariables.length > 0 && `, ${data.optionalVariables.length} optional`}
              </div>
            )}
          </div>
        );

      case 'full':
        return (
          <div className="space-y-3 text-sm">
            {/* Description */}
            <p className="text-gray-700">{data.description}</p>

            {/* Tags */}
            {data.tags.length > 0 && (
              <div>
                <div className="text-xs text-gray-500 mb-1">Tags:</div>
                <div className="flex flex-wrap gap-1">
                  {data.tags.map((tag) => (
                    <span
                      key={tag}
                      className={cn(
                        'px-2 py-1 rounded-md text-xs font-medium',
                        colors.bg,
                        colors.text
                      )}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tools */}
            {data.tools.length > 0 && (
              <div>
                <div className="text-xs text-gray-500 mb-1">Tools:</div>
                <div className="text-xs text-gray-700">
                  {data.tools.join(', ')}
                </div>
              </div>
            )}

            {/* Extends */}
            {data.extends && (
              <div className="text-xs text-purple-600">
                Extends: {data.extends}
              </div>
            )}

            {/* Mixins */}
            {data.mixins && data.mixins.length > 0 && (
              <div className="text-xs text-green-600">
                Mixins: {data.mixins.join(', ')}
              </div>
            )}

            {/* Variables */}
            {data.requiredVariables.length > 0 && (
              <div>
                <div className="text-xs text-gray-500 mb-1">Required Variables:</div>
                <div className="text-xs text-gray-700">
                  {data.requiredVariables.join(', ')}
                </div>
              </div>
            )}

            {data.optionalVariables.length > 0 && (
              <div>
                <div className="text-xs text-gray-500 mb-1">Optional Variables:</div>
                <div className="text-xs text-gray-700">
                  {data.optionalVariables.join(', ')}
                </div>
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
      footer={footer}
      showInputHandle={true}
      showOutputHandle={true}
      inputHandleId="extends"
      outputHandleId="children"
    >
      {content}
    </BaseNode>
  );
};

export default TemplateNode;
