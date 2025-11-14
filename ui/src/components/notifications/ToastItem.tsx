/**
 * Toast Item Component
 *
 * Individual toast notification with animations, icons, and action buttons.
 *
 * @module components/notifications/ToastItem
 * @version 1.0.0
 * @author Error Handling & Recovery Engineer (Agent 3)
 */

import React, { useEffect, useState } from 'react';
import type { Toast, ToastType } from '../../lib/notifications/toast-store';
import { useToastStore } from '../../lib/notifications/toast-store';

/**
 * Props for ToastItem component
 */
export interface ToastItemProps {
  /** Toast to display */
  toast: Toast;
}

/**
 * Icons for different toast types
 */
const TOAST_ICONS: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ⓘ',
};

/**
 * Colors for different toast types
 */
const TOAST_COLORS: Record<ToastType, { bg: string; border: string; text: string; icon: string }> = {
  success: {
    bg: '#ecfdf5',
    border: '#10b981',
    text: '#065f46',
    icon: '#10b981',
  },
  error: {
    bg: '#fef2f2',
    border: '#ef4444',
    text: '#991b1b',
    icon: '#ef4444',
  },
  warning: {
    bg: '#fefce8',
    border: '#eab308',
    text: '#854d0e',
    icon: '#eab308',
  },
  info: {
    bg: '#eff6ff',
    border: '#3b82f6',
    text: '#1e40af',
    icon: '#3b82f6',
  },
};

/**
 * Individual toast notification component
 *
 * Features:
 * - Type-specific icons and colors
 * - Slide-in animation
 * - Auto-dismiss with progress bar
 * - Optional action button
 * - Manual dismiss button
 */
export const ToastItem: React.FC<ToastItemProps> = ({ toast }) => {
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);
  const removeToast = useToastStore((state) => state.removeToast);

  const colors = TOAST_COLORS[toast.type];
  const icon = TOAST_ICONS[toast.type];

  // Handle auto-dismiss progress bar
  useEffect(() => {
    if (!toast.duration || toast.duration === 0) return;

    const startTime = Date.now();
    const endTime = toast.createdAt + toast.duration;
    const totalDuration = toast.duration;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - toast.createdAt;
      const remaining = Math.max(0, endTime - now);
      const progressPercent = (remaining / totalDuration) * 100;

      setProgress(progressPercent);

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [toast.duration, toast.createdAt]);

  // Handle dismiss
  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      removeToast(toast.id);
    }, 300);
  };

  // Handle action click
  const handleAction = () => {
    if (toast.action) {
      toast.action.onClick();
      handleDismiss();
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        minWidth: '320px',
        maxWidth: '420px',
        padding: '16px',
        backgroundColor: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        animation: isExiting
          ? 'toast-exit 0.3s ease-out forwards'
          : 'toast-enter 0.3s ease-out',
        overflow: 'hidden',
      }}
    >
      {/* Icon */}
      <div
        style={{
          flexShrink: 0,
          width: '24px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.icon,
          color: 'white',
          borderRadius: '50%',
          fontSize: '14px',
          fontWeight: 'bold',
        }}
      >
        {icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: '14px',
            lineHeight: '20px',
            color: colors.text,
            fontWeight: 500,
            wordBreak: 'break-word',
          }}
        >
          {toast.message}
        </p>

        {/* Action button */}
        {toast.action && (
          <button
            onClick={handleAction}
            style={{
              marginTop: '8px',
              padding: '6px 12px',
              backgroundColor: 'transparent',
              border: `1px solid ${colors.border}`,
              borderRadius: '4px',
              color: colors.text,
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.border;
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = colors.text;
            }}
          >
            {toast.action.label}
          </button>
        )}
      </div>

      {/* Close button */}
      <button
        onClick={handleDismiss}
        style={{
          flexShrink: 0,
          width: '20px',
          height: '20px',
          padding: 0,
          backgroundColor: 'transparent',
          border: 'none',
          color: colors.text,
          fontSize: '16px',
          lineHeight: 1,
          cursor: 'pointer',
          opacity: 0.6,
          transition: 'opacity 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '1';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '0.6';
        }}
        aria-label="Dismiss"
      >
        ×
      </button>

      {/* Progress bar */}
      {toast.duration && toast.duration > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '3px',
            backgroundColor: colors.border,
            opacity: 0.3,
          }}
        >
          <div
            style={{
              height: '100%',
              backgroundColor: colors.border,
              transition: 'width 0.05s linear',
              width: `${progress}%`,
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes toast-enter {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes toast-exit {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default ToastItem;
