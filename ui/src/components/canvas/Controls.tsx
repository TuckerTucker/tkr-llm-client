/**
 * Canvas Controls Component
 *
 * Control panel for canvas operations including zoom, pan, fit view, and undo/redo.
 *
 * @module components/canvas/Controls
 * @version 1.0.0
 * @author Canvas & ReactFlow Integration (Agent 6)
 */

import React from 'react';
import { useCanvasStore } from '../../../../src/lib/state/canvas-store';
import {
  zoomIn,
  zoomOut,
  resetZoom,
  fitViewToNodes,
  getZoomPercentage,
} from '../../../../src/lib/reactflow/viewport';

export interface ControlsProps {
  /** Whether canvas is locked (no editing) */
  locked?: boolean;
  /** Callback when lock state changes */
  onLockChange?: (locked: boolean) => void;
  /** Callback when export button is clicked */
  onExport?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Canvas Controls Component
 *
 * Provides UI controls for:
 * - Zoom in/out/reset
 * - Fit view
 * - Undo/redo
 * - Lock/unlock canvas
 *
 * @param props - Component props
 */
export const Controls: React.FC<ControlsProps> = ({
  locked = false,
  onLockChange,
  onExport,
  className = '',
}) => {
  const canUndo = useCanvasStore((state) => state.canUndo());
  const canRedo = useCanvasStore((state) => state.canRedo());
  const undo = useCanvasStore((state) => state.undo);
  const redo = useCanvasStore((state) => state.redo);
  const [isLocked, setIsLocked] = React.useState(locked);
  const [zoomLevel, setZoomLevel] = React.useState('100%');

  // Update zoom percentage when viewport changes
  React.useEffect(() => {
    const unsubscribe = useCanvasStore.subscribe((state) => {
      setZoomLevel(getZoomPercentage());
    });
    return unsubscribe;
  }, []);

  const handleZoomIn = () => {
    zoomIn();
  };

  const handleZoomOut = () => {
    zoomOut();
  };

  const handleResetZoom = () => {
    resetZoom();
  };

  const handleFitView = () => {
    fitViewToNodes({ padding: 50, maxZoom: 1.5 });
  };

  const handleUndo = () => {
    if (canUndo) {
      undo();
    }
  };

  const handleRedo = () => {
    if (canRedo) {
      redo();
    }
  };

  const handleLockToggle = () => {
    const newLocked = !isLocked;
    setIsLocked(newLocked);
    onLockChange?.(newLocked);
  };

  return (
    <div
      className={`canvas-controls ${className}`}
      style={{
        position: 'absolute',
        bottom: 16,
        right: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        background: 'white',
        borderRadius: 8,
        padding: 8,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        zIndex: 10,
      }}
      role="toolbar"
      aria-label="Canvas controls"
    >
      {/* Zoom Controls */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          borderBottom: '1px solid #e5e7eb',
          paddingBottom: 8,
        }}
      >
        <button
          onClick={handleZoomIn}
          title="Zoom in (Ctrl/Cmd + =)"
          style={buttonStyle}
          aria-label="Zoom in"
        >
          <ZoomInIcon />
        </button>

        <div
          style={{
            textAlign: 'center',
            fontSize: 12,
            color: '#6b7280',
            padding: '4px 0',
            minWidth: 48,
          }}
        >
          {zoomLevel}
        </div>

        <button
          onClick={handleZoomOut}
          title="Zoom out (Ctrl/Cmd + -)"
          style={buttonStyle}
          aria-label="Zoom out"
        >
          <ZoomOutIcon />
        </button>

        <button
          onClick={handleResetZoom}
          title="Reset zoom (Ctrl/Cmd + 0)"
          style={buttonStyle}
          aria-label="Reset zoom"
        >
          <ResetZoomIcon />
        </button>
      </div>

      {/* View Controls */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          borderBottom: '1px solid #e5e7eb',
          paddingBottom: 8,
        }}
      >
        <button
          onClick={handleFitView}
          title="Fit view (Ctrl/Cmd + F)"
          style={buttonStyle}
          aria-label="Fit view"
        >
          <FitViewIcon />
        </button>
      </div>

      {/* History Controls */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          borderBottom: '1px solid #e5e7eb',
          paddingBottom: 8,
        }}
      >
        <button
          onClick={handleUndo}
          disabled={!canUndo}
          title="Undo (Ctrl/Cmd + Z)"
          style={{
            ...buttonStyle,
            opacity: canUndo ? 1 : 0.4,
            cursor: canUndo ? 'pointer' : 'not-allowed',
          }}
          aria-label="Undo"
        >
          <UndoIcon />
        </button>

        <button
          onClick={handleRedo}
          disabled={!canRedo}
          title="Redo (Ctrl/Cmd + Shift + Z)"
          style={{
            ...buttonStyle,
            opacity: canRedo ? 1 : 0.4,
            cursor: canRedo ? 'pointer' : 'not-allowed',
          }}
          aria-label="Redo"
        >
          <RedoIcon />
        </button>
      </div>

      {/* Lock Control */}
      <div>
        <button
          onClick={handleLockToggle}
          title={isLocked ? 'Unlock canvas' : 'Lock canvas'}
          style={{
            ...buttonStyle,
            background: isLocked ? '#3b82f6' : 'transparent',
            color: isLocked ? 'white' : '#374151',
          }}
          aria-label={isLocked ? 'Unlock canvas' : 'Lock canvas'}
          aria-pressed={isLocked}
        >
          {isLocked ? <LockIcon /> : <UnlockIcon />}
        </button>
      </div>

      {/* Export Control */}
      {onExport && (
        <div
          style={{
            borderTop: '1px solid #e5e7eb',
            paddingTop: 8,
          }}
        >
          <button
            onClick={onExport}
            title="Export (Cmd/Ctrl + E)"
            style={buttonStyle}
            aria-label="Export template or canvas"
          >
            <ExportIcon />
          </button>
        </div>
      )}
    </div>
  );
};

// Button style
const buttonStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 36,
  height: 36,
  border: 'none',
  background: 'transparent',
  borderRadius: 4,
  cursor: 'pointer',
  color: '#374151',
  transition: 'background-color 0.15s',
};

// Simple SVG Icons
const ZoomInIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
    <path d="M9 9V5h2v4h4v2h-4v4H9v-4H5V9h4z" />
    <circle cx="9" cy="9" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const ZoomOutIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
    <path d="M5 9h8v2H5V9z" />
    <circle cx="9" cy="9" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const ResetZoomIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="10" cy="10" r="7" />
    <text x="10" y="14" textAnchor="middle" fontSize="10" fill="currentColor" stroke="none">
      1:1
    </text>
  </svg>
);

const FitViewIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="3" width="14" height="14" rx="1" />
    <path d="M6 3v3m0 8v3m11-11h-3m-8 0H3m14 8h-3" strokeLinecap="round" />
  </svg>
);

const UndoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M5 10h10M5 10l3-3M5 10l3 3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const RedoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M15 10H5m10 0l-3-3m3 3l-3 3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const LockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
    <path d="M10 2a4 4 0 00-4 4v2H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-1V6a4 4 0 00-4-4zm2 6V6a2 2 0 10-4 0v2h4z" />
  </svg>
);

const UnlockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
    <path d="M10 2a4 4 0 00-4 4v2H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-7V6a2 2 0 114 0v1h2V6a4 4 0 00-4-4z" />
  </svg>
);

const ExportIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M10 3v8m0-8l-3 3m3-3l3 3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 11v5a1 1 0 01-1 1H5a1 1 0 01-1-1v-5" strokeLinecap="round" />
  </svg>
);
