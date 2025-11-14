/**
 * Component Error Fallback Component
 *
 * Generic error fallback UI for component-level errors.
 * Compact design suitable for embedding within other components.
 *
 * @module components/errors/fallbacks/ComponentErrorFallback
 * @version 1.0.0
 * @author Error Handling & Recovery Engineer (Agent 3)
 */

import React from 'react';

/**
 * Props for ComponentErrorFallback component
 */
export interface ComponentErrorFallbackProps {
  /** Name of the component that failed */
  componentName: string;
  /** The error that occurred */
  error?: Error;
  /** Function to reset the component */
  reset?: () => void;
  /** Whether to show error details */
  showDetails?: boolean;
}

/**
 * Component error fallback component
 *
 * Displays a compact error message when a component fails to render.
 * Designed to be embedded within the layout without disrupting the
 * rest of the application.
 *
 * Usage:
 * ```tsx
 * <ComponentErrorFallback
 *   componentName="VariablePanel"
 *   error={error}
 *   reset={() => resetComponent()}
 * />
 * ```
 */
export const ComponentErrorFallback: React.FC<ComponentErrorFallbackProps> = ({
  componentName,
  error,
  reset,
  showDetails = false,
}) => {
  return (
    <div
      style={{
        padding: '24px',
        backgroundColor: '#fef2f2',
        border: '2px solid #fecaca',
        borderRadius: '8px',
        textAlign: 'center',
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: '48px',
          height: '48px',
          margin: '0 auto 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fee2e2',
          borderRadius: '50%',
          fontSize: '24px',
        }}
      >
        ⚠️
      </div>

      {/* Title */}
      <h3
        style={{
          fontSize: '18px',
          fontWeight: 600,
          color: '#991b1b',
          marginBottom: '8px',
          margin: '0 0 8px 0',
        }}
      >
        {componentName} Failed
      </h3>

      {/* Description */}
      <p
        style={{
          fontSize: '14px',
          color: '#7f1d1d',
          marginBottom: '16px',
          margin: '0 0 16px 0',
          lineHeight: 1.5,
        }}
      >
        This component encountered an error and could not be displayed.
      </p>

      {/* Error Message */}
      {error && showDetails && (
        <p
          style={{
            fontSize: '13px',
            color: '#dc2626',
            marginBottom: '16px',
            margin: '0 0 16px 0',
            padding: '10px',
            backgroundColor: 'white',
            borderRadius: '6px',
            border: '1px solid #fecaca',
            fontFamily: 'monospace',
            wordBreak: 'break-word',
          }}
        >
          {error.message}
        </p>
      )}

      {/* Actions */}
      {reset && (
        <button
          onClick={reset}
          style={{
            padding: '10px 20px',
            backgroundColor: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#b91c1c';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#dc2626';
          }}
        >
          Retry
        </button>
      )}

      {/* Stack Trace (if provided) */}
      {error?.stack && (
        <details
          style={{
            marginTop: '16px',
            textAlign: 'left',
            fontSize: '11px',
            color: '#6b7280',
            backgroundColor: 'white',
            padding: '10px',
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
            Stack Trace
          </summary>
          <pre
            style={{
              margin: '8px 0 0 0',
              fontSize: '10px',
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
  );
};

export default ComponentErrorFallback;
