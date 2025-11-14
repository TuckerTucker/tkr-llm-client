/**
 * Canvas Error Fallback Component
 *
 * Error fallback UI specifically for canvas rendering errors.
 * Allows the rest of the application to continue functioning.
 *
 * @module components/errors/fallbacks/CanvasErrorFallback
 * @version 1.0.0
 * @author Error Handling & Recovery Engineer (Agent 3)
 */

import React from 'react';

/**
 * Props for CanvasErrorFallback component
 */
export interface CanvasErrorFallbackProps {
  /** The error that occurred */
  error?: Error;
  /** Function to reset the canvas */
  reset?: () => void;
}

/**
 * Canvas error fallback component
 *
 * Displays a user-friendly error message when the canvas fails to render.
 * Provides options to reset the canvas or clear state without reloading
 * the entire application.
 *
 * Usage:
 * ```tsx
 * <CanvasErrorFallback
 *   error={error}
 *   reset={() => resetCanvasState()}
 * />
 * ```
 */
export const CanvasErrorFallback: React.FC<CanvasErrorFallbackProps> = ({
  error,
  reset,
}) => {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9fafb',
        padding: '40px',
      }}
    >
      <div
        style={{
          maxWidth: '500px',
          textAlign: 'center',
          padding: '32px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#fef2f2',
            borderRadius: '50%',
            fontSize: '40px',
          }}
        >
          🎨
        </div>

        {/* Title */}
        <h2
          style={{
            fontSize: '24px',
            fontWeight: 600,
            color: '#111827',
            marginBottom: '12px',
            margin: '0 0 12px 0',
          }}
        >
          Canvas Rendering Failed
        </h2>

        {/* Description */}
        <p
          style={{
            fontSize: '15px',
            color: '#6b7280',
            marginBottom: '8px',
            margin: '0 0 8px 0',
            lineHeight: 1.6,
          }}
        >
          The canvas encountered an error while rendering. The rest of the
          application is still working.
        </p>

        {/* Error Message */}
        {error && (
          <p
            style={{
              fontSize: '14px',
              color: '#dc2626',
              marginBottom: '24px',
              margin: '0 0 24px 0',
              padding: '12px',
              backgroundColor: '#fef2f2',
              borderRadius: '6px',
              border: '1px solid #fecaca',
              fontFamily: 'monospace',
            }}
          >
            {error.message}
          </p>
        )}

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          {reset && (
            <button
              onClick={reset}
              style={{
                padding: '12px 24px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2563eb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#3b82f6';
              }}
            >
              Reset Canvas
            </button>
          )}

          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              backgroundColor: 'white',
              color: '#374151',
              border: '2px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#9ca3af';
              e.currentTarget.style.backgroundColor = '#f9fafb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#d1d5db';
              e.currentTarget.style.backgroundColor = 'white';
            }}
          >
            Reload Page
          </button>
        </div>

        {/* Help Text */}
        <p
          style={{
            marginTop: '24px',
            fontSize: '13px',
            color: '#9ca3af',
            margin: '24px 0 0 0',
          }}
        >
          Try resetting the canvas first. If the problem persists, reload the page.
        </p>

        {/* Error Details (Collapsible) */}
        {error?.stack && (
          <details
            style={{
              marginTop: '24px',
              textAlign: 'left',
              fontSize: '12px',
              color: '#6b7280',
              backgroundColor: '#f9fafb',
              padding: '12px',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            <summary
              style={{
                fontWeight: 600,
                marginBottom: '8px',
                color: '#374151',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              Technical Details
            </summary>
            <pre
              style={{
                margin: '8px 0 0 0',
                fontSize: '11px',
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                lineHeight: 1.5,
                color: '#6b7280',
              }}
            >
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
};

export default CanvasErrorFallback;
