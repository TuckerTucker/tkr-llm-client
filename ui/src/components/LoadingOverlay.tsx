/**
 * Loading Overlay Component
 *
 * Displays a loading spinner over the canvas during template conversion and layout.
 * Also shows error messages if conversion fails.
 *
 * @module components/LoadingOverlay
 * @version 1.0.0
 * @author Canvas Integration Engineer (Agent 3)
 */

import React from 'react';

export interface LoadingOverlayProps {
  /** Whether to show the loading overlay */
  isLoading: boolean;
  /** Error message to display, if any */
  error?: string | null;
  /** Callback to retry after an error */
  onRetry?: () => void;
  /** Optional loading message */
  message?: string;
}

/**
 * Loading Overlay Component
 *
 * Positioned absolutely over the canvas to show loading states
 * and error messages during template conversion.
 */
export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  error,
  onRetry,
  message = 'Loading template...',
}) => {
  if (!isLoading && !error) {
    return null;
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        zIndex: 1000,
        pointerEvents: 'all',
      }}
    >
      <div
        style={{
          textAlign: 'center',
          padding: '32px',
          borderRadius: '8px',
          backgroundColor: 'white',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          maxWidth: '400px',
        }}
      >
        {error ? (
          // Error state
          <>
            <div
              style={{
                fontSize: '48px',
                marginBottom: '16px',
              }}
            >
              ⚠️
            </div>
            <h3
              style={{
                fontSize: '18px',
                fontWeight: 600,
                color: '#dc2626',
                marginBottom: '12px',
              }}
            >
              Conversion Error
            </h3>
            <p
              style={{
                fontSize: '14px',
                color: '#6b7280',
                marginBottom: '20px',
                whiteSpace: 'pre-wrap',
              }}
            >
              {error}
            </p>
            {onRetry && (
              <button
                onClick={onRetry}
                style={{
                  padding: '10px 24px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Retry
              </button>
            )}
          </>
        ) : (
          // Loading state
          <>
            <div
              style={{
                width: '48px',
                height: '48px',
                margin: '0 auto 16px',
                border: '4px solid #e5e7eb',
                borderTop: '4px solid #3b82f6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }}
            />
            <style>
              {`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}
            </style>
            <p
              style={{
                fontSize: '16px',
                color: '#374151',
                fontWeight: 500,
              }}
            >
              {message}
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default LoadingOverlay;
