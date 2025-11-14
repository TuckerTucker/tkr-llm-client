/**
 * ToolConfigNode Component
 *
 * Hexagonal node with blue tint (150x120px default) representing a tool configuration.
 *
 * Features:
 * - Shows: tool name, key permissions, validation rules
 * - Expandable details panel
 * - Security warnings (if forbidden tools)
 * - Output handle (connects to templates)
 * - Hexagonal shape for visual distinction
 *
 * @see .context-kit/orchestration/reactflow-template-ui/integration-contracts/02-node-component-contracts.md
 */

import React, { useState } from 'react';
import type { BaseNodeProps, ToolConfigNodeData } from '../../lib/types/ui-types';
import { nodeColors, getDetailLevel, cn } from './styles';
import NodeHandle from './NodeHandle';
import { Position } from 'reactflow';

export interface ToolConfigNodeProps extends BaseNodeProps<ToolConfigNodeData> {}

/**
 * Tool Config Node Component
 *
 * Visual specification:
 *   ╱────────────────────────╲
 *  ╱  🔧 Write Config         ╲
 * │                            │
 * │  Permissions:              │
 * │   ✓ src/files              │
 * │   ✗ node_modules           │
 * │                            │
 * │  Max file size: 10MB       │
 *  ╲                          ╱
 *   ╲────────────────────────╱
 *                          ○
 *                     (output)
 */
export const ToolConfigNode: React.FC<ToolConfigNodeProps> = ({
  id,
  data,
  selected,
  dragging,
  zoomLevel = 1.5, // Default to 'full' detail level
}) => {
  const [expanded, setExpanded] = useState(false);
  const detailLevel = getDetailLevel(zoomLevel);
  const colors = nodeColors.toolConfig;

  // Icon based on tool name
  const getToolIcon = (toolName: string): string => {
    const iconMap: Record<string, string> = {
      Read: '📖',
      Write: '✍️',
      Edit: '✏️',
      Grep: '🔍',
      Glob: '🌐',
      Bash: '⌨️',
      WebFetch: '🌍',
      WebSearch: '🔎',
    };
    return iconMap[toolName] || '🔧';
  };

  const icon = getToolIcon(data.toolName);

  // Hexagonal shape using clip-path
  const hexagonalContainer = (content: React.ReactNode) => {
    const size = {
      minimal: { width: 40, height: 40 },
      compact: { width: 100, height: 80 },
      standard: { width: 150, height: 120 },
      full: { width: 200, height: 160 },
    }[detailLevel];

    return (
      <div
        className="relative nopan"
        style={{
          width: size.width,
          height: size.height,
        }}
        role="article"
        tabIndex={0}
        aria-label={`Tool configuration: ${data.toolName}. ${
          data.permissions?.forbidden.length
            ? `Has ${data.permissions.forbidden.length} forbidden patterns`
            : 'No restrictions'
        }`}
      >
        {/* Hexagonal background */}
        <div
          className={cn(
            'absolute inset-0',
            colors.bg,
            colors.border,
            'border-2',
            selected ? 'ring-2 ring-blue-500 ring-offset-2' : '',
            'shadow-md',
            'transition-all duration-200'
          )}
          style={{
            clipPath:
              'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
          }}
        />

        {/* Content */}
        <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-4">
          {content}
        </div>

        {/* Handle */}
        <NodeHandle
          type="source"
          position={Position.Right}
          id="tool-output"
          title="Connect to template"
        />
      </div>
    );
  };

  // Content based on detail level
  const content = (() => {
    switch (detailLevel) {
      case 'minimal':
        return (
          <div className="text-center">
            <span className="text-lg">{icon}</span>
          </div>
        );

      case 'compact':
        return (
          <div className="text-center space-y-1">
            <div className="text-lg">{icon}</div>
            <div className="font-semibold text-xs truncate">{data.toolName}</div>
          </div>
        );

      case 'standard':
        return (
          <div className="w-full space-y-2">
            {/* Tool name with icon */}
            <div className="text-center">
              <span className="text-xl mr-1">{icon}</span>
              <span className="font-semibold text-sm">{data.toolName}</span>
              {data.extends && (
                <div className="text-xs text-purple-600">extends: {data.extends}</div>
              )}
            </div>

            {/* Permissions summary */}
            {data.permissions && (
              <div className="text-xs space-y-1">
                {data.permissions.allowed.length > 0 && (
                  <div className="text-green-600">
                    ✓ {data.permissions.allowed.length} allowed
                  </div>
                )}
                {data.permissions.forbidden.length > 0 && (
                  <div className="text-red-600">
                    ✗ {data.permissions.forbidden.length} forbidden
                  </div>
                )}
                {data.permissions.maxFileSize && (
                  <div className="text-gray-600">
                    Max: {Math.round(data.permissions.maxFileSize / 1024 / 1024)}MB
                  </div>
                )}
              </div>
            )}

            {/* Validation count */}
            {data.validation && (
              <div className="text-xs text-gray-600">
                {data.validation.rules.length} validation rule{data.validation.rules.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        );

      case 'full':
        return (
          <div className="w-full space-y-2 max-h-full overflow-auto">
            {/* Tool name with icon */}
            <div className="text-center">
              <span className="text-2xl mr-2">{icon}</span>
              <span className="font-semibold text-base">{data.toolName}</span>
              {data.extends && (
                <div className="text-xs text-purple-600 mt-1">
                  Extends: {data.extends}
                </div>
              )}
            </div>

            {/* Permissions details */}
            {data.permissions && (
              <div className="text-xs space-y-1">
                <div className="font-semibold text-gray-700">Permissions:</div>
                {data.permissions.allowed.length > 0 && (
                  <div>
                    <div className="text-green-600 font-medium">Allowed:</div>
                    {data.permissions.allowed.slice(0, 3).map((pattern, idx) => (
                      <div key={idx} className="text-green-700 pl-2">
                        ✓ {pattern}
                      </div>
                    ))}
                    {data.permissions.allowed.length > 3 && (
                      <div className="text-green-600 pl-2">
                        +{data.permissions.allowed.length - 3} more
                      </div>
                    )}
                  </div>
                )}
                {data.permissions.forbidden.length > 0 && (
                  <div>
                    <div className="text-red-600 font-medium">Forbidden:</div>
                    {data.permissions.forbidden.slice(0, 3).map((pattern, idx) => (
                      <div key={idx} className="text-red-700 pl-2">
                        ✗ {pattern}
                      </div>
                    ))}
                    {data.permissions.forbidden.length > 3 && (
                      <div className="text-red-600 pl-2">
                        +{data.permissions.forbidden.length - 3} more
                      </div>
                    )}
                  </div>
                )}
                {data.permissions.maxFileSize && (
                  <div className="text-gray-600">
                    Max file size: {Math.round(data.permissions.maxFileSize / 1024 / 1024)}MB
                  </div>
                )}
              </div>
            )}

            {/* Validation rules */}
            {data.validation && data.validation.rules.length > 0 && (
              <div className="text-xs">
                <div className="font-semibold text-gray-700">Validation:</div>
                {data.validation.rules.slice(0, 2).map((rule, idx) => (
                  <div key={idx} className="text-gray-600 pl-2">
                    • {rule.field}: {rule.validator}
                  </div>
                ))}
                {data.validation.rules.length > 2 && (
                  <div className="text-gray-600 pl-2">
                    +{data.validation.rules.length - 2} more rules
                  </div>
                )}
              </div>
            )}

            {/* Error handling */}
            {data.errorHandling && (
              <div className="text-xs text-gray-600">
                <div className="font-semibold text-gray-700">Error Handling:</div>
                <div className="pl-2">Strategy: {data.errorHandling.strategy}</div>
                {data.errorHandling.maxRetries && (
                  <div className="pl-2">Max retries: {data.errorHandling.maxRetries}</div>
                )}
              </div>
            )}

            {/* Expand/Collapse button */}
            <button
              className="text-xs text-blue-600 hover:text-blue-800 underline"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
            >
              {expanded ? 'Show less' : 'Show more'}
            </button>
          </div>
        );
    }
  })();

  return hexagonalContainer(content);
};

export default ToolConfigNode;
