/**
 * Toast Container Component
 *
 * Container for displaying toast notifications in a fixed position.
 * Manages the layout and stacking of multiple toasts.
 *
 * @module components/notifications/ToastContainer
 * @version 1.0.0
 * @author Error Handling & Recovery Engineer (Agent 3)
 */

import React from 'react';
import { useToastStore } from '../../lib/notifications/toast-store';
import { ToastItem } from './ToastItem';

/**
 * Position options for toast container
 */
export type ToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

/**
 * Props for ToastContainer component
 */
export interface ToastContainerProps {
  /** Position of toast container */
  position?: ToastPosition;
  /** Maximum number of toasts to show */
  maxToasts?: number;
}

/**
 * Get CSS styles for different positions
 */
function getPositionStyles(position: ToastPosition): React.CSSProperties {
  const base: React.CSSProperties = {
    position: 'fixed',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    zIndex: 9999,
    pointerEvents: 'none',
  };

  switch (position) {
    case 'top-left':
      return { ...base, top: '20px', left: '20px' };
    case 'top-center':
      return { ...base, top: '20px', left: '50%', transform: 'translateX(-50%)' };
    case 'top-right':
      return { ...base, top: '20px', right: '20px' };
    case 'bottom-left':
      return { ...base, bottom: '20px', left: '20px' };
    case 'bottom-center':
      return { ...base, bottom: '20px', left: '50%', transform: 'translateX(-50%)' };
    case 'bottom-right':
      return { ...base, bottom: '20px', right: '20px' };
    default:
      return { ...base, top: '20px', right: '20px' };
  }
}

/**
 * Toast notification container
 *
 * Displays all active toasts in a fixed position on the screen.
 * Automatically manages stacking and overflow.
 *
 * Features:
 * - Configurable position
 * - Maximum toast limit
 * - Automatic stacking
 * - Proper z-indexing
 *
 * Usage:
 * ```tsx
 * <ToastContainer position="top-right" maxToasts={5} />
 * ```
 */
export const ToastContainer: React.FC<ToastContainerProps> = ({
  position = 'top-right',
  maxToasts = 5,
}) => {
  const toasts = useToastStore((state) => state.toasts);

  // Limit number of visible toasts
  const visibleToasts = toasts.slice(-maxToasts);

  if (visibleToasts.length === 0) {
    return null;
  }

  return (
    <div style={getPositionStyles(position)}>
      {visibleToasts.map((toast) => (
        <div key={toast.id} style={{ pointerEvents: 'auto' }}>
          <ToastItem toast={toast} />
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
