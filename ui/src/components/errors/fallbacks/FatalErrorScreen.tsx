/**
 * Fatal Error Screen Component
 *
 * Full-page error screen for unrecoverable fatal errors.
 * Displays error details and provides option to reload the application.
 *
 * @module components/errors/fallbacks/FatalErrorScreen
 * @version 1.0.0
 * @author Error Handling & Recovery Engineer (Agent 3)
 */

import React from 'react';

/**
 * Props for FatalErrorScreen component
 */
export interface FatalErrorScreenProps {
  /** The error that occurred */
  error?: Error;
  /** Function to reset and reload */
  reset?: () => void;
}

/**
 * Fatal error screen component
 *
 * Displays a full-page error screen for fatal errors that require
 * the application to be reloaded. Shows error details in an
 * expandable section and provides a reload button.
 *
 * Usage:
 * ```tsx
 * <FatalErrorScreen
 *   error={error}
 *   reset={() => window.location.reload()}
 * />
 * ```
 */
export const FatalErrorScreen: React.FC<FatalErrorScreenProps> = ({
  error,
  reset,
}) => {
  const handleReset = () => {
    if (reset) {
      reset();
    } else {
      window.location.reload();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9fafb',
        padding: '20px',
        zIndex: 10000,
      }}
    >
      <div
        style={{
          maxWidth: '600px',
          width: '100%',
          textAlign: 'center',
          padding: '48px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Error Icon */}
        <div
          style={{
            fontSize: '72px',
            marginBottom: '24px',
            lineHeight: 1,
          }}
        >
          💥
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: '32px',
            fontWeight: 700,
            color: '#dc2626',
            marginBottom: '16px',
            margin: '0 0 16px 0',
          }}
        >
          Application Error
        </h1>

        {/* Description */}
        <p
          style={{
            fontSize: '18px',
            color: '#6b7280',
            marginBottom: '24px',
            margin: '0 0 24px 0',
            lineHeight: 1.5,
          }}
        >
          The application encountered a critical error and needs to be reloaded.
          We apologize for the inconvenience.
        </p>

        {/* Error Details */}
        {error && (
          <details
            style={{
              marginBottom: '32px',
              textAlign: 'left',
              fontSize: '14px',
              color: '#374151',
              backgroundColor: '#f3f4f6',
              padding: '16px',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            <summary
              style={{
                fontWeight: 600,
                marginBottom: '12px',
                color: '#111827',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              Technical Details
            </summary>
            <div
              style={{
                marginTop: '12px',
                padding: '12px',
                backgroundColor: 'white',
                borderRadius: '6px',
                border: '1px solid #e5e7eb',
              }}
            >
              <p
                style={{
                  margin: '0 0 12px 0',
                  fontWeight: 600,
                  color: '#dc2626',
                }}
              >
                {error.message}
              </p>
              {error.stack && (
                <pre
                  style={{
                    margin: 0,
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    color: '#6b7280',
                    lineHeight: 1.5,
                  }}
                >
                  {error.stack}
                </pre>
              )}
            </div>
          </details>
        )}

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
          }}
        >
          <button
            onClick={handleReset}
            style={{
              padding: '14px 32px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2563eb';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#3b82f6';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.3)';
            }}
          >
            Reload Application
          </button>

          <button
            onClick={() => {
              const logs = localStorage.getItem('error-logs') || '[]';
              const blob = new Blob([logs], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `error-logs-${Date.now()}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            style={{
              padding: '14px 32px',
              backgroundColor: 'white',
              color: '#374151',
              border: '2px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 600,
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
            Export Error Log
          </button>
        </div>

        {/* Help Text */}
        <p
          style={{
            marginTop: '24px',
            fontSize: '14px',
            color: '#9ca3af',
            margin: '24px 0 0 0',
          }}
        >
          If this problem persists, please contact support with the error details above.
        </p>
      </div>
    </div>
  );
};

export default FatalErrorScreen;
