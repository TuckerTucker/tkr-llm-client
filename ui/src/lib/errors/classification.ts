/**
 * Error Classification System
 *
 * Classifies errors by severity and category, providing user-friendly messages
 * and recovery suggestions. This enables intelligent error handling throughout
 * the application.
 *
 * @module lib/errors/classification
 * @version 1.0.0
 * @author Error Handling & Recovery Engineer (Agent 3)
 */

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  /** App must reload - unrecoverable */
  Fatal = 'fatal',
  /** Feature unavailable but app continues */
  Critical = 'critical',
  /** Degraded performance or partial failure */
  Warning = 'warning',
  /** Non-critical informational error */
  Info = 'info',
}

/**
 * Error categories for classification
 */
export enum ErrorCategory {
  /** Network/API errors */
  Network = 'network',
  /** Data validation errors */
  Validation = 'validation',
  /** React rendering errors */
  Rendering = 'rendering',
  /** State management errors */
  State = 'state',
  /** Permission/authorization errors */
  Permission = 'permission',
  /** Template conversion errors */
  Conversion = 'conversion',
  /** Layout calculation errors */
  Layout = 'layout',
  /** Unknown/unclassified errors */
  Unknown = 'unknown',
}

/**
 * Classified error with metadata
 */
export interface ClassifiedError {
  /** Original error */
  error: Error;
  /** Error severity level */
  severity: ErrorSeverity;
  /** Error category */
  category: ErrorCategory;
  /** User-friendly message */
  userMessage: string;
  /** Technical message for developers */
  technicalMessage: string;
  /** Whether error is recoverable */
  recoverable: boolean;
  /** Suggested action for user */
  suggestedAction?: string;
  /** Additional context */
  context?: Record<string, any>;
}

/**
 * Classifies an error and provides recovery information
 *
 * @param error - Error to classify
 * @param context - Additional context about where error occurred
 * @returns Classified error with recovery information
 *
 * @example
 * ```typescript
 * try {
 *   // Some operation
 * } catch (err) {
 *   const classified = classifyError(err as Error, { component: 'Canvas' });
 *   toast.error(classified.userMessage, {
 *     action: classified.suggestedAction
 *   });
 * }
 * ```
 */
export function classifyError(
  error: Error,
  context?: Record<string, any>
): ClassifiedError {
  const errorMessage = error.message.toLowerCase();
  const errorStack = error.stack?.toLowerCase() || '';

  // Network errors
  if (
    errorMessage.includes('network') ||
    errorMessage.includes('fetch') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('connection')
  ) {
    return {
      error,
      severity: ErrorSeverity.Warning,
      category: ErrorCategory.Network,
      userMessage: 'Network connection issue detected',
      technicalMessage: error.message,
      recoverable: true,
      suggestedAction: 'Check your internet connection and try again',
      context,
    };
  }

  // Validation errors
  if (
    errorMessage.includes('validation') ||
    errorMessage.includes('invalid') ||
    errorMessage.includes('required')
  ) {
    return {
      error,
      severity: ErrorSeverity.Info,
      category: ErrorCategory.Validation,
      userMessage: 'Invalid data provided',
      technicalMessage: error.message,
      recoverable: true,
      suggestedAction: 'Please check your input and try again',
      context,
    };
  }

  // React rendering errors
  if (
    errorStack.includes('react') ||
    errorMessage.includes('render') ||
    errorMessage.includes('component')
  ) {
    return {
      error,
      severity: ErrorSeverity.Critical,
      category: ErrorCategory.Rendering,
      userMessage: 'Component rendering failed',
      technicalMessage: error.message,
      recoverable: true,
      suggestedAction: 'Try refreshing the component',
      context,
    };
  }

  // State management errors
  if (
    errorMessage.includes('state') ||
    errorMessage.includes('store') ||
    errorMessage.includes('zustand')
  ) {
    return {
      error,
      severity: ErrorSeverity.Critical,
      category: ErrorCategory.State,
      userMessage: 'Application state error',
      technicalMessage: error.message,
      recoverable: true,
      suggestedAction: 'Try resetting the application state',
      context,
    };
  }

  // Permission errors
  if (
    errorMessage.includes('permission') ||
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('forbidden')
  ) {
    return {
      error,
      severity: ErrorSeverity.Warning,
      category: ErrorCategory.Permission,
      userMessage: 'Permission denied',
      technicalMessage: error.message,
      recoverable: false,
      suggestedAction: 'Check your permissions and try again',
      context,
    };
  }

  // Conversion errors
  if (
    errorMessage.includes('conversion') ||
    errorMessage.includes('template') ||
    errorMessage.includes('adapter')
  ) {
    return {
      error,
      severity: ErrorSeverity.Warning,
      category: ErrorCategory.Conversion,
      userMessage: 'Template conversion failed',
      technicalMessage: error.message,
      recoverable: true,
      suggestedAction: 'Try selecting a different template',
      context,
    };
  }

  // Layout errors
  if (
    errorMessage.includes('layout') ||
    errorMessage.includes('position') ||
    errorMessage.includes('dagre')
  ) {
    return {
      error,
      severity: ErrorSeverity.Warning,
      category: ErrorCategory.Layout,
      userMessage: 'Layout calculation failed',
      technicalMessage: error.message,
      recoverable: true,
      suggestedAction: 'Try using a different layout algorithm',
      context,
    };
  }

  // Fatal errors (out of memory, etc.)
  if (
    errorMessage.includes('memory') ||
    errorMessage.includes('stack') ||
    errorMessage.includes('recursion')
  ) {
    return {
      error,
      severity: ErrorSeverity.Fatal,
      category: ErrorCategory.Unknown,
      userMessage: 'A critical error occurred',
      technicalMessage: error.message,
      recoverable: false,
      suggestedAction: 'Please reload the application',
      context,
    };
  }

  // Default: Unknown error
  return {
    error,
    severity: ErrorSeverity.Warning,
    category: ErrorCategory.Unknown,
    userMessage: 'An unexpected error occurred',
    technicalMessage: error.message,
    recoverable: true,
    suggestedAction: 'Please try again',
    context,
  };
}

/**
 * Checks if an error is a network error
 */
export function isNetworkError(error: Error): boolean {
  const classified = classifyError(error);
  return classified.category === ErrorCategory.Network;
}

/**
 * Checks if an error is recoverable
 */
export function isRecoverableError(error: Error): boolean {
  const classified = classifyError(error);
  return classified.recoverable;
}

/**
 * Checks if an error is fatal
 */
export function isFatalError(error: Error): boolean {
  const classified = classifyError(error);
  return classified.severity === ErrorSeverity.Fatal;
}

/**
 * Gets a user-friendly message for an error
 */
export function getUserMessage(error: Error): string {
  const classified = classifyError(error);
  return classified.userMessage;
}

/**
 * Gets suggested action for an error
 */
export function getSuggestedAction(error: Error): string | undefined {
  const classified = classifyError(error);
  return classified.suggestedAction;
}
