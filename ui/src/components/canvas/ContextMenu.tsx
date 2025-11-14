/**
 * Context Menu Component
 *
 * Provides right-click context menus for nodes, edges, and canvas.
 * Supports different menu options based on the target type.
 *
 * @module components/canvas/ContextMenu
 * @version 1.0.0
 * @author Interaction Engineer (Agent 2)
 */

import React, { useCallback, useEffect, useRef } from 'react';
import { useCanvasStore } from '@/../../src/lib/state/canvas-store';
import { useNodeSelection } from '../../hooks/useNodeSelection';

/**
 * Context menu props
 */
export interface ContextMenuProps {
  /** X position on screen */
  x: number;

  /** Y position on screen */
  y: number;

  /** Target type: node, edge, or canvas */
  target: 'node' | 'edge' | 'canvas';

  /** Target ID (for node or edge) */
  targetId?: string;

  /** Close handler */
  onClose: () => void;

  /** Callback to open node details panel */
  onViewDetails?: (nodeId: string) => void;

  /** Callback to open export modal */
  onExport?: () => void;
}

/**
 * Menu item interface
 */
interface MenuItem {
  label: string;
  icon?: string;
  shortcut?: string;
  action: () => void;
  disabled?: boolean;
  divider?: boolean;
}

/**
 * Context Menu Component
 *
 * Displays a context menu with actions based on the target type.
 */
export function ContextMenu({
  x,
  y,
  target,
  targetId,
  onClose,
  onViewDetails,
  onExport,
}: ContextMenuProps): JSX.Element {
  const menuRef = useRef<HTMLDivElement>(null);
  const store = useCanvasStore();
  const selection = useNodeSelection();

  /**
   * Get menu items based on target type
   */
  const getMenuItems = useCallback((): MenuItem[] => {
    switch (target) {
      case 'node':
        return getNodeMenuItems();
      case 'edge':
        return getEdgeMenuItems();
      case 'canvas':
        return getCanvasMenuItems();
      default:
        return [];
    }
  }, [target, targetId]);

  /**
   * Node context menu items
   */
  const getNodeMenuItems = (): MenuItem[] => {
    if (!targetId) return [];

    const node = store.getNodeById(targetId);
    if (!node) return [];

    const isSelected = selection.selectedNodes.includes(targetId);
    const selectionCount = selection.selectedNodes.length;

    return [
      {
        label: 'View Details',
        icon: '👁️',
        shortcut: 'Enter',
        action: () => {
          if (onViewDetails && targetId) {
            onViewDetails(targetId);
          }
          onClose();
        },
      },
      {
        label: 'Edit Properties',
        icon: '✏️',
        shortcut: 'E',
        action: () => {
          if (!targetId) return;

          const node = store.getNodeById(targetId);
          if (!node) return;

          // Simple inline editor using prompt
          const currentName = node.data.name;
          const newName = window.prompt('Edit node name:', currentName);

          if (newName && newName !== currentName) {
            store.updateNode(targetId, {
              ...node,
              data: {
                ...node.data,
                name: newName,
              },
            });
            store.pushHistory();
          }

          onClose();
        },
      },
      { divider: true } as MenuItem,
      {
        label: 'Duplicate',
        icon: '📋',
        shortcut: '⌘D',
        action: () => {
          if (!isSelected) {
            selection.selectNode(targetId);
          }
          selection.duplicateSelected();
          onClose();
        },
      },
      {
        label: 'Copy ID',
        icon: '🆔',
        action: () => {
          navigator.clipboard.writeText(targetId);
          console.log('Copied node ID:', targetId);
          onClose();
        },
      },
      { divider: true } as MenuItem,
      {
        label: 'Select Connected',
        icon: '🔗',
        action: () => {
          selection.selectNode(targetId);
          selection.selectConnectedNodes();
          onClose();
        },
      },
      { divider: true } as MenuItem,
      {
        label: isSelected && selectionCount > 1
          ? `Delete ${selectionCount} Nodes`
          : 'Delete Node',
        icon: '🗑️',
        shortcut: 'Delete',
        action: () => {
          if (!isSelected) {
            selection.selectNode(targetId);
          }
          selection.deleteSelected();
          onClose();
        },
      },
    ];
  };

  /**
   * Edge context menu items
   */
  const getEdgeMenuItems = (): MenuItem[] => {
    if (!targetId) return [];

    const edge = store.getEdgeById(targetId);
    if (!edge) return [];

    return [
      {
        label: 'Edit Label',
        icon: '✏️',
        action: () => {
          if (!targetId) return;

          const edge = store.getEdgeById(targetId);
          if (!edge) return;

          // Simple inline editor using prompt
          const currentLabel = edge.data?.label || '';
          const newLabel = window.prompt('Edit edge label:', currentLabel);

          if (newLabel !== null) {
            store.updateEdge(targetId, {
              ...edge,
              data: {
                ...edge.data,
                label: newLabel,
              },
            });
            store.pushHistory();
          }

          onClose();
        },
      },
      {
        label: 'Change Type',
        icon: '🔄',
        action: () => {
          if (!targetId) return;

          const edge = store.getEdgeById(targetId);
          if (!edge) return;

          // Simple inline editor using prompt with validation
          const validTypes = ['extends', 'mixin', 'variable', 'toolRef', 'bundle'];
          const currentType = edge.data?.type || 'toolRef';
          const newType = window.prompt(
            `Change edge type (valid types: ${validTypes.join(', ')}):`,
            currentType
          );

          if (newType && validTypes.includes(newType)) {
            store.updateEdge(targetId, {
              ...edge,
              data: {
                ...edge.data,
                type: newType,
              },
            });
            store.pushHistory();
          } else if (newType !== null) {
            window.alert(`Invalid type "${newType}". Valid types: ${validTypes.join(', ')}`);
          }

          onClose();
        },
      },
      { divider: true } as MenuItem,
      {
        label: 'Copy ID',
        icon: '🆔',
        action: () => {
          navigator.clipboard.writeText(targetId);
          console.log('Copied edge ID:', targetId);
          onClose();
        },
      },
      { divider: true } as MenuItem,
      {
        label: 'Delete Edge',
        icon: '🗑️',
        shortcut: 'Delete',
        action: () => {
          store.removeEdge(targetId);
          store.pushHistory();
          onClose();
        },
      },
    ];
  };

  /**
   * Canvas context menu items
   */
  const getCanvasMenuItems = (): MenuItem[] => {
    const hasSelection =
      selection.selectedNodes.length > 0 || selection.selectedEdges.length > 0;

    return [
      {
        label: 'Select All',
        icon: '☑️',
        shortcut: '⌘A',
        action: () => {
          selection.selectAll();
          onClose();
        },
      },
      {
        label: 'Clear Selection',
        icon: '⬜',
        shortcut: 'Esc',
        action: () => {
          selection.deselectAll();
          onClose();
        },
        disabled: !hasSelection,
      },
      { divider: true } as MenuItem,
      {
        label: 'Fit View',
        icon: '🔍',
        shortcut: '⌘0',
        action: () => {
          store.fitView();
          onClose();
        },
      },
      {
        label: 'Reset Zoom',
        icon: '🔎',
        shortcut: '⌘1',
        action: () => {
          store.resetViewport();
          onClose();
        },
      },
      { divider: true } as MenuItem,
      {
        label: 'Undo',
        icon: '↩️',
        shortcut: '⌘Z',
        action: () => {
          store.undo();
          onClose();
        },
        disabled: !store.canUndo(),
      },
      {
        label: 'Redo',
        icon: '↪️',
        shortcut: '⌘⇧Z',
        action: () => {
          store.redo();
          onClose();
        },
        disabled: !store.canRedo(),
      },
      { divider: true } as MenuItem,
      {
        label: 'Export Canvas',
        icon: '💾',
        action: () => {
          if (onExport) {
            onExport();
          }
          onClose();
        },
      },
    ];
  };

  const menuItems = getMenuItems();

  /**
   * Close menu on click outside
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  /**
   * Adjust menu position to keep it on screen
   */
  const getMenuPosition = () => {
    const menuWidth = 250;
    const menuHeight = menuItems.length * 40; // Approximate

    const adjustedX = x + menuWidth > window.innerWidth ? x - menuWidth : x;
    const adjustedY = y + menuHeight > window.innerHeight ? y - menuHeight : y;

    return {
      left: Math.max(0, adjustedX),
      top: Math.max(0, adjustedY),
    };
  };

  const position = getMenuPosition();

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left: position.left,
        top: position.top,
        minWidth: '220px',
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        zIndex: 9999,
        padding: '4px 0',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {menuItems.map((item, index) => {
        if (item.divider) {
          return (
            <div
              key={`divider-${index}`}
              style={{
                height: '1px',
                backgroundColor: '#e5e7eb',
                margin: '4px 0',
              }}
            />
          );
        }

        return (
          <button
            key={index}
            onClick={item.action}
            disabled={item.disabled}
            style={{
              width: '100%',
              padding: '8px 16px',
              border: 'none',
              backgroundColor: 'transparent',
              textAlign: 'left',
              cursor: item.disabled ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              opacity: item.disabled ? 0.5 : 1,
              transition: 'background-color 0.1s',
            }}
            onMouseEnter={(e) => {
              if (!item.disabled) {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {item.icon && <span style={{ fontSize: '16px' }}>{item.icon}</span>}
              <span>{item.label}</span>
            </div>
            {item.shortcut && (
              <span
                style={{
                  fontSize: '12px',
                  color: '#9ca3af',
                  fontFamily: 'monospace',
                }}
              >
                {item.shortcut}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
