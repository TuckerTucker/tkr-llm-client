/**
 * Toast Notification API
 *
 * Simple API for creating toast notifications throughout the application.
 * Provides methods for different notification types and promise-based toasts.
 *
 * @module lib/notifications/toast
 * @version 1.0.0
 * @author Error Handling & Recovery Engineer (Agent 3)
 */

import { useToastStore, type ToastAction } from './toast-store';

/**
 * Toast options
 */
export interface ToastOptions {
  /** Auto-dismiss duration (ms), 0 for no auto-dismiss */
  duration?: number;
  /** Optional action button */
  action?: ToastAction;
}

/**
 * Promise toast messages
 */
export interface PromiseMessages {
  /** Message while promise is pending */
  loading: string;
  /** Message on success */
  success: string;
  /** Message on error */
  error: string;
}

/**
 * Toast notification API
 *
 * @example
 * ```typescript
 * // Simple success toast
 * toast.success('Template loaded successfully');
 *
 * // Error toast with action
 * toast.error('Failed to load template', {
 *   action: { label: 'Retry', onClick: () => retry() }
 * });
 *
 * // Promise-based toast
 * await toast.promise(
 *   fetchData(),
 *   {
 *     loading: 'Loading data...',
 *     success: 'Data loaded',
 *     error: 'Failed to load data'
 *   }
 * );
 * ```
 */
export const toast = {
  /**
   * Show a success toast
   */
  success: (message: string, options?: ToastOptions): string => {
    return useToastStore.getState().addToast({
      type: 'success',
      message,
      duration: options?.duration,
      action: options?.action,
    });
  },

  /**
   * Show an error toast
   */
  error: (message: string, options?: ToastOptions): string => {
    return useToastStore.getState().addToast({
      type: 'error',
      message,
      duration: options?.duration ?? 5000, // Errors stay longer by default
      action: options?.action,
    });
  },

  /**
   * Show a warning toast
   */
  warning: (message: string, options?: ToastOptions): string => {
    return useToastStore.getState().addToast({
      type: 'warning',
      message,
      duration: options?.duration,
      action: options?.action,
    });
  },

  /**
   * Show an info toast
   */
  info: (message: string, options?: ToastOptions): string => {
    return useToastStore.getState().addToast({
      type: 'info',
      message,
      duration: options?.duration,
      action: options?.action,
    });
  },

  /**
   * Show a toast for a promise, updating it based on promise state
   *
   * @example
   * ```typescript
   * const result = await toast.promise(
   *   saveData(),
   *   {
   *     loading: 'Saving...',
   *     success: 'Saved successfully',
   *     error: 'Save failed'
   *   }
   * );
   * ```
   */
  promise: async <T>(
    promise: Promise<T>,
    messages: PromiseMessages,
    options?: ToastOptions
  ): Promise<T> => {
    const id = useToastStore.getState().addToast({
      type: 'info',
      message: messages.loading,
      duration: 0, // Don't auto-dismiss while loading
    });

    try {
      const result = await promise;
      useToastStore.getState().updateToast(id, {
        type: 'success',
        message: messages.success,
        duration: options?.duration ?? 3000,
      });
      return result;
    } catch (err) {
      useToastStore.getState().updateToast(id, {
        type: 'error',
        message: messages.error,
        duration: options?.duration ?? 5000,
        action: options?.action,
      });
      throw err;
    }
  },

  /**
   * Remove a specific toast
   */
  dismiss: (id: string): void => {
    useToastStore.getState().removeToast(id);
  },

  /**
   * Remove all toasts
   */
  dismissAll: (): void => {
    useToastStore.getState().clearAll();
  },
};
