/**
 * Undo/Redo Controls Component
 *
 * UI controls for undo/redo functionality on the canvas.
 *
 * @module components/canvas/UndoRedoControls
 * @version 1.0.0
 * @author Wave 3 Engineer
 */

import React, { useCallback, useEffect } from 'react';
import { useCanvasStore } from '../../lib/state/canvas-store';

/**
 * Undo/Redo controls component props
 */
export interface UndoRedoControlsProps {
  /** Additional CSS classes */
  className?: string;

  /** Show keyboard shortcuts in tooltips */
  showShortcuts?: boolean;

  /** Position of controls */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

/**
 * Undo/Redo controls component
 *
 * Provides undo/redo buttons with keyboard shortcuts (Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z).
 */
export const UndoRedoControls: React.FC<UndoRedoControlsProps> = ({
  className = '',
  showShortcuts = true,
  position = 'bottom-left',
}) => {
  const canUndo = useCanvasStore((state) => state.historyIndex > 0);
  const canRedo = useCanvasStore((state) => state.historyIndex < state.history.length - 1);
  const undo = useCanvasStore((state) => state.undo);
  const redo = useCanvasStore((state) => state.redo);

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isCtrlOrCmd = isMac ? event.metaKey : event.ctrlKey;

      if (isCtrlOrCmd && event.key === 'z') {
        event.preventDefault();
        if (event.shiftKey) {
          // Redo: Cmd/Ctrl+Shift+Z
          if (canRedo) {
            redo();
          }
        } else {
          // Undo: Cmd/Ctrl+Z
          if (canUndo) {
            undo();
          }
        }
      }

      // Alternative redo shortcut: Cmd/Ctrl+Y
      if (isCtrlOrCmd && event.key === 'y' && canRedo) {
        event.preventDefault();
        redo();
      }
    },
    [canUndo, canRedo, undo, redo]
  );

  // Register keyboard shortcuts
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Position styles
  const positionStyles: Record<string, React.CSSProperties> = {
    'top-left': { top: 10, left: 10 },
    'top-right': { top: 10, right: 10 },
    'bottom-left': { bottom: 10, left: 10 },
    'bottom-right': { bottom: 10, right: 10 },
  };

  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const cmdKey = isMac ? '⌘' : 'Ctrl';

  return (
    <div
      className={`undo-redo-controls ${className}`}
      style={{
        position: 'absolute',
        ...positionStyles[position],
        display: 'flex',
        gap: '8px',
        zIndex: 10,
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '8px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
      }}
    >
      <button
        onClick={undo}
        disabled={!canUndo}
        title={showShortcuts ? `Undo (${cmdKey}+Z)` : 'Undo'}
        style={{
          padding: '8px 12px',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          backgroundColor: canUndo ? 'white' : '#f3f4f6',
          color: canUndo ? '#374151' : '#9ca3af',
          cursor: canUndo ? 'pointer' : 'not-allowed',
          fontSize: '14px',
          fontWeight: 500,
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          if (canUndo) {
            e.currentTarget.style.backgroundColor = '#f9fafb';
            e.currentTarget.style.borderColor = '#9ca3af';
          }
        }}
        onMouseLeave={(e) => {
          if (canUndo) {
            e.currentTarget.style.backgroundColor = 'white';
            e.currentTarget.style.borderColor = '#d1d5db';
          }
        }}
        aria-label="Undo"
      >
        ↶ Undo
      </button>

      <button
        onClick={redo}
        disabled={!canRedo}
        title={showShortcuts ? `Redo (${cmdKey}+Shift+Z)` : 'Redo'}
        style={{
          padding: '8px 12px',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          backgroundColor: canRedo ? 'white' : '#f3f4f6',
          color: canRedo ? '#374151' : '#9ca3af',
          cursor: canRedo ? 'pointer' : 'not-allowed',
          fontSize: '14px',
          fontWeight: 500,
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          if (canRedo) {
            e.currentTarget.style.backgroundColor = '#f9fafb';
            e.currentTarget.style.borderColor = '#9ca3af';
          }
        }}
        onMouseLeave={(e) => {
          if (canRedo) {
            e.currentTarget.style.backgroundColor = 'white';
            e.currentTarget.style.borderColor = '#d1d5db';
          }
        }}
        aria-label="Redo"
      >
        ↷ Redo
      </button>

      {showShortcuts && (
        <div
          style={{
            fontSize: '11px',
            color: '#6b7280',
            padding: '8px 6px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <span style={{ marginRight: '4px' }}>💡</span>
          {cmdKey}+Z / {cmdKey}+Shift+Z
        </div>
      )}
    </div>
  );
};

/**
 * History status component
 *
 * Shows current position in history and available undo/redo counts.
 */
export const HistoryStatus: React.FC<{ className?: string }> = ({ className = '' }) => {
  const historyIndex = useCanvasStore((state) => state.historyIndex);
  const historyLength = useCanvasStore((state) => state.history.length);

  const undoCount = historyIndex;
  const redoCount = historyLength - historyIndex - 1;

  return (
    <div
      className={`history-status ${className}`}
      style={{
        fontSize: '12px',
        color: '#6b7280',
        padding: '4px 8px',
        backgroundColor: '#f9fafb',
        borderRadius: '4px',
        border: '1px solid #e5e7eb',
      }}
    >
      History: {historyIndex + 1} / {historyLength}
      {undoCount > 0 && <span style={{ marginLeft: '8px' }}>↶ {undoCount}</span>}
      {redoCount > 0 && <span style={{ marginLeft: '4px' }}>↷ {redoCount}</span>}
    </div>
  );
};

export default UndoRedoControls;
