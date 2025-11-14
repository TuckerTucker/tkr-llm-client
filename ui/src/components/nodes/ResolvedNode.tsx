/**
 * ResolvedNode Component
 *
 * Shows the final resolved agent configuration (output of factory.create()).
 * Read-only display with copy/export actions.
 *
 * Features:
 * - Displays: prompt, tools, settings, runtime
 * - Read-only (output node)
 * - Copy/export actions
 * - No output handle (terminal node)
 *
 * @see .context-kit/orchestration/reactflow-template-ui/integration-contracts/02-node-component-contracts.md
 */

import React, { useState } from 'react';
import type { BaseNodeProps, ResolvedNodeData } from '../../lib/types/ui-types';
import { BaseNode } from './BaseNode';
import { nodeColors, getDetailLevel, cn } from './styles';

export interface ResolvedNodeProps extends BaseNodeProps<ResolvedNodeData> {}

/**
 * Resolved Config Node Component
 *
 * Shows the final resolved configuration ready for execution.
 */
export const ResolvedNode: React.FC<ResolvedNodeProps> = ({
  id,
  data,
  selected,
  dragging,
  zoomLevel = 1.5, // Default to 'full' detail level
}) => {
  const [copied, setCopied] = useState(false);
  const detailLevel = getDetailLevel(zoomLevel);
  const colors = nodeColors.resolved;

  // Icon
  const icon = (
    <span className="text-xl" role="img" aria-label="Resolved Configuration">
      ✅
    </span>
  );

  // Copy to clipboard
  const handleCopy = () => {
    const configText = JSON.stringify(data.resolvedConfig, null, 2);
    navigator.clipboard.writeText(configText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Header actions (copy/export buttons)
  const headerActions =
    detailLevel !== 'minimal' && detailLevel !== 'compact' ? (
      <div className="flex gap-1">
        <button
          className={cn(
            'text-xs px-2 py-1 rounded',
            copied
              ? 'bg-green-100 text-green-700'
              : 'text-gray-600 hover:bg-gray-100'
          )}
          onClick={(e) => {
            e.stopPropagation();
            handleCopy();
          }}
          aria-label="Copy configuration"
          title="Copy to clipboard"
        >
          {copied ? '✓ Copied' : '📋 Copy'}
        </button>
        <button
          className="text-xs text-gray-600 hover:bg-gray-100 px-2 py-1 rounded"
          onClick={(e) => {
            e.stopPropagation();
            console.log('Export config:', data.resolvedConfig);
          }}
          aria-label="Export configuration"
          title="Export"
        >
          💾 Export
        </button>
      </div>
    ) : null;

  // Footer
  const footer =
    detailLevel !== 'minimal' && detailLevel !== 'compact' ? (
      <div className="flex items-center justify-between text-xs text-gray-600">
        <span>Read-only output</span>
        <span>{data.resolvedConfig.tools.length} tools configured</span>
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
            {/* Prompt preview */}
            <div>
              <div className="text-xs font-semibold text-gray-600 mb-1">Prompt:</div>
              <div className="text-xs text-gray-700 line-clamp-3 bg-gray-50 p-2 rounded">
                {data.resolvedConfig.prompt}
              </div>
            </div>

            {/* Tools */}
            <div>
              <div className="text-xs font-semibold text-gray-600 mb-1">Tools:</div>
              <div className="text-xs text-gray-700">
                {data.resolvedConfig.tools.slice(0, 5).join(', ')}
                {data.resolvedConfig.tools.length > 5 &&
                  ` +${data.resolvedConfig.tools.length - 5} more`}
              </div>
            </div>

            {/* Settings count */}
            <div className="text-xs text-gray-600">
              {Object.keys(data.resolvedConfig.settings).length} settings,{' '}
              {Object.keys(data.resolvedConfig.runtime).length} runtime options
            </div>
          </div>
        );

      case 'full':
        return (
          <div className="space-y-3 text-sm max-h-full overflow-auto">
            {/* Prompt */}
            <div>
              <div className="text-xs font-semibold text-gray-700 mb-1">Prompt:</div>
              <div className="text-xs text-gray-700 bg-gray-50 p-2 rounded max-h-32 overflow-auto">
                {data.resolvedConfig.prompt}
              </div>
            </div>

            {/* Tools */}
            <div>
              <div className="text-xs font-semibold text-gray-700 mb-1">
                Tools ({data.resolvedConfig.tools.length}):
              </div>
              <div className="text-xs text-gray-700 space-y-1">
                {data.resolvedConfig.tools.map((tool) => (
                  <div key={tool} className="pl-2">
                    • {tool}
                  </div>
                ))}
              </div>
            </div>

            {/* Settings */}
            {Object.keys(data.resolvedConfig.settings).length > 0 && (
              <div>
                <div className="text-xs font-semibold text-gray-700 mb-1">Settings:</div>
                <div className="text-xs text-gray-700 bg-gray-50 p-2 rounded space-y-1">
                  {Object.entries(data.resolvedConfig.settings).map(([key, value]) => (
                    <div key={key}>
                      <span className="font-medium">{key}:</span>{' '}
                      {JSON.stringify(value)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Runtime */}
            {Object.keys(data.resolvedConfig.runtime).length > 0 && (
              <div>
                <div className="text-xs font-semibold text-gray-700 mb-1">Runtime:</div>
                <div className="text-xs text-gray-700 bg-gray-50 p-2 rounded space-y-1">
                  {Object.entries(data.resolvedConfig.runtime).map(([key, value]) => (
                    <div key={key}>
                      <span className="font-medium">{key}:</span>{' '}
                      {JSON.stringify(value)}
                    </div>
                  ))}
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
      showOutputHandle={false}
      inputHandleId="resolved-input"
    >
      {content}
    </BaseNode>
  );
};

export default ResolvedNode;
