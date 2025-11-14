/**
 * Component Error Boundary Component
 *
 * Generic error boundary for wrapping individual components.
 * Provides isolated error handling without affecting other components.
 *
 * @module components/errors/ComponentErrorBoundary
 * @version 1.0.0
 * @author Error Handling & Recovery Engineer (Agent 3)
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logError } from '../../lib/errors/logging';
import { toast } from '../../lib/notifications/toast';
import { ComponentErrorFallback } from './fallbacks/ComponentErrorFallback';

/**
 * Props for ComponentErrorBoundary component
 */
export interface ComponentErrorBoundaryProps {
  /** Child components to wrap */
  children: ReactNode;
  /** Name of the component being wrapped */
  componentName: string;
  /** Optional custom fallback */
  fallback?: (error: Error, reset: () => void) => ReactNode;
  /** Optional error handler */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Optional reset handler */
  onReset?: () => void;
  /** Whether to show toast notification on error */
  showToast?: boolean;
  /** Whether to show error details in fallback */
  showDetails?: boolean;
}

/**
 * State for ComponentErrorBoundary component
 */
interface ComponentErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

/**
 * Component error boundary component
 *
 * Generic error boundary for wrapping individual components with
 * isolated error handling. Tracks retry attempts and can automatically
 * retry rendering a certain number of times.
 *
 * Features:
 * - Component-specific error handling
 * - Optional toast notifications
 * - Retry mechanism
 * - Isolated error scope
 * - Customizable fallback UI
 *
 * Usage:
 * ```tsx
 * <ComponentErrorBoundary componentName="VariablePanel">
 *   <VariablePanel />
 * </ComponentErrorBoundary>
 * ```
 */
export class ComponentErrorBoundary extends Component<
  ComponentErrorBoundaryProps,
  ComponentErrorBoundaryState
> {
  private maxRetries = 2;

  constructor(props: ComponentErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ComponentErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { componentName, onError, showToast = true } = this.props;

    // Log error with component context
    logError(componentName, error, errorInfo, {
      componentStack: errorInfo.componentStack,
      retryCount: this.state.retryCount,
    });

    // Update state with error info
    this.setState({
      errorInfo,
    });

    // Show toast notification if enabled
    if (showToast) {
      toast.error(`${componentName} failed to render`, {
        duration: 4000,
        action: {
          label: 'Retry',
          onClick: this.handleReset,
        },
      });
    }

    // Call optional error handler
    if (onError) {
      onError(error, errorInfo);
    }
  }

  handleReset = (): void => {
    const { onReset, componentName } = this.props;

    // Check if we've exceeded max retries
    if (this.state.retryCount >= this.maxRetries) {
      toast.warning(`${componentName} has failed multiple times. Please refresh the page.`, {
        duration: 6000,
      });
      return;
    }

    // Increment retry count
    this.setState((prevState) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
    }));

    // Call optional reset handler
    if (onReset) {
      onReset();
    }

    // Show retry toast
    toast.info(`Retrying ${componentName}...`, {
      duration: 2000,
    });
  };

  render(): ReactNode {
    const { children, fallback, componentName, showDetails = false } = this.props;

    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback(this.state.error, this.handleReset);
      }

      // Default: Show component error fallback
      return (
        <ComponentErrorFallback
          componentName={componentName}
          error={this.state.error}
          reset={
            this.state.retryCount < this.maxRetries
              ? this.handleReset
              : undefined
          }
          showDetails={showDetails}
        />
      );
    }

    return children;
  }
}

export default ComponentErrorBoundary;
