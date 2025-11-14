/**
 * Error Handling Module
 *
 * Central exports for error classification, logging, and recovery utilities.
 *
 * @module lib/errors
 * @version 1.0.0
 * @author Error Handling & Recovery Engineer (Agent 3)
 */

// Classification
export {
  ErrorSeverity,
  ErrorCategory,
  classifyError,
  isNetworkError,
  isRecoverableError,
  isFatalError,
  getUserMessage,
  getSuggestedAction,
  type ClassifiedError,
} from './classification';

// Logging
export {
  logError,
  getErrorLogs,
  getErrorLogsBySeverity,
  getErrorLogsByCategory,
  getErrorLogsByComponent,
  clearErrorLogs,
  getErrorStats,
  exportErrorLogs,
  type ErrorLog,
} from './logging';

// Recovery
export {
  withRetry,
  withFallback,
  withFallbackAsync,
  withErrorBoundary,
  isNetworkErrorCheck,
  isRateLimitError,
  isRetryableError,
  withStrategies,
  withTimeout,
  safeExecute,
  safeExecuteAsync,
  type RetryOptions,
} from './recovery';
