/**
 * Root Error Boundary Component
 *
 * Top-level error boundary that catches all unhandled errors in the application.
 * Displays a fatal error screen and provides option to reload the application.
 *
 * @module components/errors/RootErrorBoundary
 * @version 1.0.0
 * @author Error Handling & Recovery Engineer (Agent 3)
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logError } from '../../lib/errors/logging';
import { isFatalError } from '../../lib/errors/classification';
import { FatalErrorScreen } from './fallbacks/FatalErrorScreen';

/**
 * Props for RootErrorBoundary component
 */
export interface RootErrorBoundaryProps {
  /** Child components to wrap */
  children: ReactNode;
  /** Optional custom fallback */
  fallback?: (error: Error, reset: () => void) => ReactNode;
  /** Optional error handler */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Optional reset handler */
  onReset?: () => void;
}

/**
 * State for RootErrorBoundary component
 */
interface RootErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Root error boundary component
 *
 * Catches all unhandled errors at the application root level.
 * Displays a fatal error screen with option to reload the application.
 * All errors caught here are logged and can be sent to error tracking services.
 *
 * Features:
 * - Catches all unhandled React errors
 * - Logs errors with full context
 * - Displays user-friendly fatal error screen
 * - Provides reload functionality
 * - Can export error logs
 *
 * Usage:
 * ```tsx
 * <RootErrorBoundary>
 *   <App />
 * </RootErrorBoundary>
 * ```
 */
export class RootErrorBoundary extends Component<
  RootErrorBoundaryProps,
  RootErrorBoundaryState
> {
  constructor(props: RootErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<RootErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error with full context
    logError('Root', error, errorInfo, {
      componentStack: errorInfo.componentStack,
      isFatal: isFatalError(error),
    });

    // Update state with error info
    this.setState({
      errorInfo,
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Store error in localStorage for debugging
    try {
      const errorLog = {
        timestamp: new Date().toISOString(),
        error: {
          message: error.message,
          stack: error.stack,
        },
        componentStack: errorInfo.componentStack,
      };

      const existingLogs = localStorage.getItem('error-logs');
      const logs = existingLogs ? JSON.parse(existingLogs) : [];
      logs.push(errorLog);

      // Keep only last 10 errors
      if (logs.length > 10) {
        logs.shift();
      }

      localStorage.setItem('error-logs', JSON.stringify(logs));
    } catch (storageError) {
      console.error('Failed to store error log:', storageError);
    }
  }

  handleReset = (): void => {
    if (this.props.onReset) {
      this.props.onReset();
    }

    // Clear error state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    // Reload the application
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      // Default: Show fatal error screen
      return (
        <FatalErrorScreen
          error={this.state.error}
          reset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

export default RootErrorBoundary;
