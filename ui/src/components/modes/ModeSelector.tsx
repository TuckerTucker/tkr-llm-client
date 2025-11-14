/**
 * Mode Selector Component
 *
 * Tab-based interface for switching between view modes.
 * Supports keyboard shortcuts and displays mode descriptions.
 *
 * @module components/modes/ModeSelector
 * @version 1.0.0
 * @author Mode System Engineer (Agent 1) - Wave 2
 */

import React, { useEffect, useCallback } from 'react';
import type { ViewMode } from '@backend/lib/modes/types';
import { MODE_METADATA, ALL_MODES } from '../../lib/modes/metadata';

// ============================================================================
// TYPES
// ============================================================================

export interface ModeSelectorProps {
  /** Current active mode */
  currentMode: ViewMode;

  /** Callback when mode changes */
  onModeChange: (mode: ViewMode) => void;

  /** Whether to show mode descriptions */
  showDescriptions?: boolean;

  /** Whether to show keyboard shortcuts */
  showShortcuts?: boolean;

  /** Custom CSS class name */
  className?: string;

  /** Custom style */
  style?: React.CSSProperties;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Mode Selector Component
 *
 * Displays a tab interface for switching between view modes.
 * Supports keyboard shortcuts (1-5) for quick mode switching.
 */
export function ModeSelector({
  currentMode,
  onModeChange,
  showDescriptions = true,
  showShortcuts = true,
  className = '',
  style = {},
}: ModeSelectorProps): JSX.Element {
  // ========================================
  // Keyboard Shortcuts
  // ========================================

  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      // Only trigger if no input/textarea is focused
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      // Check if it's a mode shortcut (1-5)
      const key = event.key;
      const modeIndex = parseInt(key, 10) - 1;

      if (modeIndex >= 0 && modeIndex < ALL_MODES.length) {
        event.preventDefault();
        onModeChange(ALL_MODES[modeIndex]);
      }
    },
    [onModeChange]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  // ========================================
  // Render
  // ========================================

  return (
    <div
      className={`mode-selector ${className}`}
      style={{
        display: 'flex',
        gap: '4px',
        alignItems: 'center',
        ...style,
      }}
    >
      {ALL_MODES.map((mode) => {
        const metadata = MODE_METADATA[mode];
        const isActive = currentMode === mode;

        return (
          <button
            key={mode}
            onClick={() => onModeChange(mode)}
            title={showDescriptions ? metadata.description : metadata.name}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              border: '1px solid',
              borderColor: isActive ? '#3b82f6' : '#d1d5db',
              borderRadius: '6px',
              backgroundColor: isActive ? '#eff6ff' : 'white',
              color: isActive ? '#1e40af' : '#374151',
              fontSize: '14px',
              fontWeight: isActive ? 600 : 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              outline: 'none',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.borderColor = '#9ca3af';
                e.currentTarget.style.backgroundColor = '#f9fafb';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.borderColor = '#d1d5db';
                e.currentTarget.style.backgroundColor = 'white';
              }
            }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {/* Icon */}
            <span style={{ fontSize: '16px' }}>{metadata.icon}</span>

            {/* Mode Name */}
            <span>{metadata.name}</span>

            {/* Keyboard Shortcut */}
            {showShortcuts && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 400,
                  color: isActive ? '#3b82f6' : '#9ca3af',
                  backgroundColor: isActive ? 'white' : '#f3f4f6',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  fontFamily: 'monospace',
                }}
              >
                {metadata.shortcut}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * @public
 * @exports ModeSelector - Mode selector component
 * @exports ModeSelectorProps - Props interface
 */
