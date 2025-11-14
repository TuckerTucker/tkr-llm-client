/**
 * Layout Selector Component
 *
 * Dropdown menu for selecting and applying graph layout algorithms.
 * Supports 7 different layout algorithms with keyboard shortcuts.
 *
 * @module components/canvas/LayoutSelector
 * @version 1.0.0
 * @author Layout Integration Engineer (Agent 2) - Wave 1
 */

import React, { useRef, useEffect } from 'react';
import { useLayoutSelector, LAYOUT_OPTIONS } from '../../hooks/useLayoutSelector';
import type { LayoutAlgorithmType } from '../../hooks/useAutoLayout';

/**
 * Layout selector props
 */
export interface LayoutSelectorProps {
  /** Current layout algorithm */
  currentLayout: LayoutAlgorithmType;
  /** Callback when layout changes */
  onLayoutChange: (algorithm: LayoutAlgorithmType) => void;
  /** Disable the selector */
  disabled?: boolean;
  /** Show layout preview icons */
  showPreview?: boolean;
  /** Custom class name */
  className?: string;
}

/**
 * Layout Selector Component
 *
 * Provides a dropdown menu for selecting layout algorithms with:
 * - 7 different layout options
 * - Radio button selection
 * - Keyboard shortcuts (L key to open, 1-7 to select)
 * - Visual indicators for recommended layouts
 * - Apply button for confirmation
 *
 * @param props - Component props
 */
export const LayoutSelector: React.FC<LayoutSelectorProps> = ({
  currentLayout,
  onLayoutChange,
  disabled = false,
  showPreview = true,
  className = '',
}) => {
  const {
    selectedLayout,
    currentMetadata,
    isOpen,
    availableLayouts,
    selectLayout,
    toggleSelector,
    closeSelector,
  } = useLayoutSelector({
    defaultLayout: currentLayout,
    persist: true,
    enableKeyboardShortcuts: true,
  });

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync internal state with external prop
  useEffect(() => {
    if (currentLayout !== selectedLayout) {
      selectLayout(currentLayout);
    }
  }, [currentLayout]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        closeSelector();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, closeSelector]);

  /**
   * Handle layout selection
   */
  const handleSelectLayout = (algorithm: LayoutAlgorithmType) => {
    selectLayout(algorithm);
  };

  /**
   * Handle apply button click
   */
  const handleApply = () => {
    onLayoutChange(selectedLayout);
    closeSelector();
  };

  /**
   * Handle cancel button click
   */
  const handleCancel = () => {
    selectLayout(currentLayout); // Revert to current layout
    closeSelector();
  };

  return (
    <div className={`layout-selector ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        className="layout-selector-trigger"
        onClick={toggleSelector}
        disabled={disabled}
        title="Select Layout Algorithm (L)"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          fontWeight: '500',
          color: '#374151',
          transition: 'all 0.2s',
          opacity: disabled ? 0.5 : 1,
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.background = '#f9fafb';
            e.currentTarget.style.borderColor = '#d1d5db';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'white';
          e.currentTarget.style.borderColor = '#e5e7eb';
        }}
      >
        <span style={{ fontSize: '16px' }}>{currentMetadata.icon || '⚙️'}</span>
        <span>Layout: {currentMetadata.name}</span>
        <span
          style={{
            fontSize: '12px',
            color: '#9ca3af',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 0.2s',
          }}
        >
          ▼
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="layout-selector-dropdown"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            minWidth: '320px',
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            zIndex: 1000,
            padding: '8px',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '8px 12px',
              borderBottom: '1px solid #e5e7eb',
              marginBottom: '4px',
            }}
          >
            <div
              style={{
                fontSize: '12px',
                fontWeight: '600',
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Select Layout Algorithm
            </div>
            <div
              style={{
                fontSize: '11px',
                color: '#9ca3af',
                marginTop: '2px',
              }}
            >
              Press 1-7 for quick selection
            </div>
          </div>

          {/* Layout Options */}
          <div className="layout-options" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {availableLayouts.map((layout) => {
              const isSelected = selectedLayout === layout.algorithm;
              const isCurrent = currentLayout === layout.algorithm;

              return (
                <button
                  key={layout.algorithm}
                  className="layout-option"
                  onClick={() => handleSelectLayout(layout.algorithm)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    width: '100%',
                    padding: '10px 12px',
                    background: isSelected ? '#eff6ff' : 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    textAlign: 'left',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = '#f9fafb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  {/* Radio Button */}
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      border: `2px solid ${isSelected ? '#3b82f6' : '#d1d5db'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {isSelected && (
                      <div
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: '#3b82f6',
                        }}
                      />
                    )}
                  </div>

                  {/* Icon */}
                  {showPreview && layout.icon && (
                    <span style={{ fontSize: '18px', flexShrink: 0 }}>{layout.icon}</span>
                  )}

                  {/* Label */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          fontWeight: isSelected ? '600' : '500',
                          color: isSelected ? '#1f2937' : '#374151',
                        }}
                      >
                        {layout.name}
                      </span>
                      {layout.recommended && (
                        <span
                          style={{
                            fontSize: '10px',
                            padding: '2px 6px',
                            background: '#dcfce7',
                            color: '#166534',
                            borderRadius: '4px',
                            fontWeight: '600',
                          }}
                        >
                          RECOMMENDED
                        </span>
                      )}
                      {isCurrent && (
                        <span
                          style={{
                            fontSize: '10px',
                            padding: '2px 6px',
                            background: '#dbeafe',
                            color: '#1e40af',
                            borderRadius: '4px',
                            fontWeight: '600',
                          }}
                        >
                          CURRENT
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                      {layout.description}
                    </div>
                  </div>

                  {/* Keyboard Shortcut */}
                  {layout.shortcutKey && (
                    <div
                      style={{
                        fontSize: '11px',
                        color: '#9ca3af',
                        background: '#f3f4f6',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontFamily: 'monospace',
                        flexShrink: 0,
                      }}
                    >
                      {layout.shortcutKey}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer with Apply/Cancel */}
          <div
            style={{
              padding: '8px 12px',
              borderTop: '1px solid #e5e7eb',
              marginTop: '4px',
              display: 'flex',
              gap: '8px',
              justifyContent: 'flex-end',
            }}
          >
            <button
              onClick={handleCancel}
              style={{
                padding: '6px 12px',
                background: 'transparent',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                color: '#6b7280',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f9fafb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={selectedLayout === currentLayout}
              style={{
                padding: '6px 16px',
                background: selectedLayout === currentLayout ? '#e5e7eb' : '#3b82f6',
                border: 'none',
                borderRadius: '6px',
                cursor: selectedLayout === currentLayout ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                color: selectedLayout === currentLayout ? '#9ca3af' : 'white',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                if (selectedLayout !== currentLayout) {
                  e.currentTarget.style.background = '#2563eb';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedLayout !== currentLayout) {
                  e.currentTarget.style.background = '#3b82f6';
                }
              }}
            >
              Apply Layout
            </button>
          </div>
        </div>
      )}

      {/* Global Styles */}
      <style>{`
        .layout-selector {
          position: relative;
          display: inline-block;
        }

        .layout-selector-trigger:focus {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }

        .layout-option:focus {
          outline: 2px solid #3b82f6;
          outline-offset: -2px;
        }
      `}</style>
    </div>
  );
};

/**
 * Default export
 */
export default LayoutSelector;
