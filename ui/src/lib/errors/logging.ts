/**
 * Error Logging System
 *
 * Centralized error logging with structured metadata, severity levels,
 * and optional integration with error tracking services.
 *
 * @module lib/errors/logging
 * @version 1.0.0
 * @author Error Handling & Recovery Engineer (Agent 3)
 */

import type { ErrorInfo } from 'react';
import { classifyError, ErrorSeverity, ErrorCategory } from './classification';

/**
 * Structured error log entry
 */
export interface ErrorLog {
  /** When the error occurred */
  timestamp: Date;
  /** Error severity level */
  severity: ErrorSeverity;
  /** Error category */
  category: ErrorCategory;
  /** User-friendly message */
  message: string;
  /** Technical error message */
  technicalMessage: string;
  /** Error stack trace */
  stack?: string;
  /** Component where error occurred */
  component?: string;
  /** Additional context */
  context?: Record<string, any>;
  /** React error info (if from error boundary) */
  errorInfo?: ErrorInfo;
}

/**
 * In-memory error log storage (circular buffer)
 */
const errorLogs: ErrorLog[] = [];
const MAX_LOGS = 100;

/**
 * Logs an error with classification and context
 *
 * @param component - Component where error occurred
 * @param error - The error object
 * @param errorInfo - React error info (optional)
 * @param context - Additional context (optional)
 *
 * @example
 * ```typescript
 * try {
 *   // Some operation
 * } catch (err) {
 *   logError('Canvas', err as Error, undefined, { nodeId: '123' });
 * }
 * ```
 */
export function logError(
  component: string,
  error: Error,
  errorInfo?: ErrorInfo,
  context?: Record<string, any>
): void {
  const classified = classifyError(error, { component, ...context });

  const log: ErrorLog = {
    timestamp: new Date(),
    severity: classified.severity,
    category: classified.category,
    message: `[${component}] ${classified.userMessage}`,
    technicalMessage: error.message,
    stack: error.stack,
    component,
    context: { ...context, ...classified.context },
    errorInfo,
  };

  // Add to circular buffer
  errorLogs.push(log);
  if (errorLogs.length > MAX_LOGS) {
    errorLogs.shift();
  }

  // Console logging with appropriate level
  switch (classified.severity) {
    case ErrorSeverity.Fatal:
    case ErrorSeverity.Critical:
      console.error(`[${component}]`, error, {
        ...log,
        errorInfo: errorInfo?.componentStack,
      });
      break;
    case ErrorSeverity.Warning:
      console.warn(`[${component}]`, error.message, context);
      break;
    case ErrorSeverity.Info:
      console.info(`[${component}]`, error.message, context);
      break;
  }

  // Send to error tracking service for fatal/critical errors
  if (
    classified.severity === ErrorSeverity.Fatal ||
    classified.severity === ErrorSeverity.Critical
  ) {
    sendToErrorTracking(log);
  }
}

/**
 * Sends error to external error tracking service
 * (Placeholder for Sentry, LogRocket, etc.)
 */
function sendToErrorTracking(log: ErrorLog): void {
  // TODO: Integrate with error tracking service
  // Example for Sentry:
  // if (window.Sentry) {
  //   window.Sentry.captureException(log.technicalMessage, {
  //     level: log.severity,
  //     tags: {
  //       category: log.category,
  //       component: log.component,
  //     },
  //     extra: log.context,
  //   });
  // }

  // For now, just log that we would send it
  if (process.env.NODE_ENV === 'development') {
    console.debug('[ErrorTracking] Would send to service:', log);
  }
}

/**
 * Gets all error logs
 */
export function getErrorLogs(): ErrorLog[] {
  return [...errorLogs];
}

/**
 * Gets error logs by severity
 */
export function getErrorLogsBySeverity(severity: ErrorSeverity): ErrorLog[] {
  return errorLogs.filter((log) => log.severity === severity);
}

/**
 * Gets error logs by category
 */
export function getErrorLogsByCategory(category: ErrorCategory): ErrorLog[] {
  return errorLogs.filter((log) => log.category === category);
}

/**
 * Gets error logs by component
 */
export function getErrorLogsByComponent(component: string): ErrorLog[] {
  return errorLogs.filter((log) => log.component === component);
}

/**
 * Clears all error logs
 */
export function clearErrorLogs(): void {
  errorLogs.length = 0;
}

/**
 * Gets error log statistics
 */
export function getErrorStats(): {
  total: number;
  bySeverity: Record<ErrorSeverity, number>;
  byCategory: Record<ErrorCategory, number>;
} {
  const stats = {
    total: errorLogs.length,
    bySeverity: {
      [ErrorSeverity.Fatal]: 0,
      [ErrorSeverity.Critical]: 0,
      [ErrorSeverity.Warning]: 0,
      [ErrorSeverity.Info]: 0,
    },
    byCategory: {
      [ErrorCategory.Network]: 0,
      [ErrorCategory.Validation]: 0,
      [ErrorCategory.Rendering]: 0,
      [ErrorCategory.State]: 0,
      [ErrorCategory.Permission]: 0,
      [ErrorCategory.Conversion]: 0,
      [ErrorCategory.Layout]: 0,
      [ErrorCategory.Unknown]: 0,
    },
  };

  for (const log of errorLogs) {
    stats.bySeverity[log.severity]++;
    stats.byCategory[log.category]++;
  }

  return stats;
}

/**
 * Exports error logs as JSON
 */
export function exportErrorLogs(): string {
  return JSON.stringify(errorLogs, null, 2);
}
