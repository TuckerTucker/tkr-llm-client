/**
 * BaseNode Component
 *
 * Generic base component that all nodes extend.
 * Provides common functionality:
 * - State styling (default, hover, selected, error, valid)
 * - Connection handles
 * - Responsive sizing based on zoom
 * - Accessibility (ARIA labels, keyboard nav)
 *
 * @see .context-kit/orchestration/reactflow-template-ui/integration-contracts/02-node-component-contracts.md
 */

import React, { useCallback, useEffect } from 'react';
import type { NodeData, BaseNodeProps } from '../../lib/types/ui-types';
import { getNodeClasses, getNodeSize, getDetailLevel, spacing, cn } from './styles';
import NodeHandle from './NodeHandle';
import { Position } from 'reactflow';

export interface BaseNodeComponentProps<T extends NodeData> extends BaseNodeProps<T> {
  children: React.ReactNode;
  icon?: React.ReactNode;
  headerActions?: React.ReactNode;
  footer?: React.ReactNode;
  showInputHandle?: boolean;
  showOutputHandle?: boolean;
  inputHandleId?: string;
  outputHandleId?: string;
  onNodeClick?: () => void;
  onNodeDoubleClick?: () => void;
  onDelete?: () => void;
}

/**
 * Base node component with common functionality
 *
 * Usage:
 * ```tsx
 * <BaseNode
 *   id={props.id}
 *   data={props.data}
 *   selected={props.selected}
 *   icon={<Icon />}
 *   headerActions={<Actions />}
 * >
 *   <NodeContent />
 * </BaseNode>
 * ```
 */
export function BaseNode<T extends NodeData>({
  id,
  data,
  selected = false,
  dragging = false,
  zoomLevel = 1.5, // Default to 'full' detail level
  children,
  icon,
  headerActions,
  footer,
  showInputHandle = true,
  showOutputHandle = true,
  inputHandleId,
  outputHandleId,
  onNodeClick,
  onNodeDoubleClick,
  onDelete,
}: BaseNodeComponentProps<T>): React.ReactElement {
  // Get responsive size based on zoom
  const size = getNodeSize(zoomLevel, data.type);
  const detailLevel = getDetailLevel(zoomLevel);

  // Debug logging
  console.log('🔷 BaseNode rendering:', {
    id,
    name: data.name,
    type: data.type,
    zoomLevel,
    detailLevel,
    size
  });

  // Get classes based on current state
  const nodeClasses = getNodeClasses({
    selected,
    focused: false, // Can be enhanced with focus tracking
    validationState: data.validationState,
    loading: (data as any).loading,
    disabled: false,
  });

  // Keyboard event handler
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'Enter':
        case ' ':
          e.preventDefault();
          onNodeDoubleClick?.();
          break;
        case 'Delete':
        case 'Backspace':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            onDelete?.();
          }
          break;
      }
    },
    [onNodeDoubleClick, onDelete]
  );

  // Announce selection state changes to screen readers
  useEffect(() => {
    if (selected) {
      const announcement = `Node ${data.name} selected. Type: ${data.type}. ${
        data.validationState?.valid ? 'Valid' : 'Has errors'
      }`;
      // This would typically use a live region for announcements
      console.debug('ARIA announcement:', announcement);
    }
  }, [selected, data.name, data.type, data.validationState]);

  // Minimal view (just a colored square with icon)
  if (detailLevel === 'minimal') {
    console.log('⚠️ BaseNode returning MINIMAL view for:', id);
    return (
      <div
        className={cn(
          nodeClasses,
          spacing.minimal,
          'flex items-center justify-center bg-white'
        )}
        style={{
          width: `${size.width}px`,
          height: `${size.height}px`,
          minWidth: `${size.width}px`,
          minHeight: `${size.height}px`,
        }}
        role="button"
        aria-label={`${data.type} node: ${data.name}`}
      >
        {icon}
        {showInputHandle && (
          <NodeHandle
            type="target"
            position={Position.Left}
            id={inputHandleId}
          />
        )}
        {showOutputHandle && (
          <NodeHandle
            type="source"
            position={Position.Right}
            id={outputHandleId}
          />
        )}
      </div>
    );
  }

  // Compact view and above
  return (
    <div
      className={cn(nodeClasses, 'bg-white overflow-hidden flex flex-col')}
      style={{
        width: `${size.width}px`,
        height: `${size.height}px`,
        minWidth: `${size.width}px`,
        minHeight: `${size.height}px`,
        cursor: 'grab',
      }}
      role="article"
      aria-label={`${data.type} node: ${data.name}. ${
        data.validationState?.valid === false
          ? `Has ${data.validationState.errors.length} errors`
          : 'Valid'
      }`}
      aria-describedby={`node-desc-${id}`}
    >
      {/* Header - drag handle */}
      <div className={cn('flex items-center justify-between', spacing[detailLevel], 'border-b')}>
        <div className="flex items-center gap-2 flex-1 min-w-0 cursor-grab active:cursor-grabbing">
          {icon && <div className="flex-shrink-0">{icon}</div>}
          <div className="font-semibold truncate" title={data.name}>
            {data.name}
          </div>
        </div>
        {headerActions && (
          <div className="flex-shrink-0 nodrag">
            {headerActions}
          </div>
        )}
      </div>

      {/* Content */}
      <div
        id={`node-desc-${id}`}
        className={cn('flex-1 overflow-auto nodrag', spacing[detailLevel])}
      >
        {children}
      </div>

      {/* Footer */}
      {footer && (
        <div className={cn('border-t', spacing[detailLevel], 'bg-gray-50 text-xs')}>
          {footer}
        </div>
      )}

      {/* Connection Handles */}
      {showInputHandle && (
        <NodeHandle
          type="target"
          position={Position.Left}
          id={inputHandleId}
          title="Connect parent template or fragment"
        />
      )}
      {showOutputHandle && (
        <NodeHandle
          type="source"
          position={Position.Right}
          id={outputHandleId}
          title="Connect to child template or usage"
        />
      )}
    </div>
  );
}

export default BaseNode;
