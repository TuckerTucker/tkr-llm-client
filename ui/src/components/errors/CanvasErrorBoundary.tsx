/**
 * Canvas Error Boundary Component
 *
 * Error boundary specifically for canvas-related errors.
 * Allows the rest of the application to continue functioning
 * while displaying a canvas-specific error fallback.
 *
 * @module components/errors/CanvasErrorBoundary
 * @version 1.0.0
 * @author Error Handling & Recovery Engineer (Agent 3)
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logError } from '../../lib/errors/logging';
import { toast } from '../../lib/notifications/toast';
import { CanvasErrorFallback } from './fallbacks/CanvasErrorFallback';
import { useCanvasStore } from '../../store';

/**
 * Props for CanvasErrorBoundary component
 */
export interface CanvasErrorBoundaryProps {
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
 * State for CanvasErrorBoundary component
 */
interface CanvasErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Canvas error boundary component
 *
 * Catches errors specifically in the canvas component tree.
 * Displays a canvas-specific error fallback while allowing the
 * rest of the application (catalog, controls, etc.) to continue working.
 *
 * Features:
 * - Canvas-specific error handling
 * - Toast notification for errors
 * - Canvas state reset capability
 * - Graceful degradation
 *
 * Usage:
 * ```tsx
 * <CanvasErrorBoundary>
 *   <Canvas />
 * </CanvasErrorBoundary>
 * ```
 */
export class CanvasErrorBoundary extends Component<
  CanvasErrorBoundaryProps,
  CanvasErrorBoundaryState
> {
  constructor(props: CanvasErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<CanvasErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error with canvas context
    logError('Canvas', error, errorInfo, {
      componentStack: errorInfo.componentStack,
      canvasState: 'error',
    });

    // Update state with error info
    this.setState({
      errorInfo,
    });

    // Show toast notification
    toast.error('Canvas rendering failed. Try resetting the canvas.', {
      duration: 5000,
      action: {
        label: 'Reset',
        onClick: this.handleReset,
      },
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = (): void => {
    // Reset canvas state
    try {
      const canvasStore = useCanvasStore.getState();
      if (canvasStore.reset) {
        canvasStore.reset();
      }
    } catch (resetError) {
      console.error('Failed to reset canvas state:', resetError);
    }

    // Call optional reset handler
    if (this.props.onReset) {
      this.props.onReset();
    }

    // Clear error state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    // Show success toast
    toast.success('Canvas reset successfully');
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      // Default: Show canvas error fallback
      return (
        <CanvasErrorFallback
          error={this.state.error}
          reset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

export default CanvasErrorBoundary;
