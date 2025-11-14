/**
 * Toast Notification Store
 *
 * Zustand store for managing toast notifications with support for
 * multiple notification types, auto-dismiss, and action buttons.
 *
 * @module lib/notifications/toast-store
 * @version 1.0.0
 * @author Error Handling & Recovery Engineer (Agent 3)
 */

import { create } from 'zustand';

/**
 * Toast notification types
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * Toast action button
 */
export interface ToastAction {
  /** Button label */
  label: string;
  /** Click handler */
  onClick: () => void;
}

/**
 * Toast notification
 */
export interface Toast {
  /** Unique ID */
  id: string;
  /** Toast type */
  type: ToastType;
  /** Message to display */
  message: string;
  /** Auto-dismiss duration in ms (0 = no auto-dismiss) */
  duration?: number;
  /** Optional action button */
  action?: ToastAction;
  /** Timestamp when created */
  createdAt: number;
}

/**
 * Toast store state
 */
interface ToastState {
  /** Active toasts */
  toasts: Toast[];
  /** Add a toast */
  addToast: (toast: Omit<Toast, 'id' | 'createdAt'>) => string;
  /** Remove a toast */
  removeToast: (id: string) => void;
  /** Update a toast */
  updateToast: (id: string, updates: Partial<Toast>) => void;
  /** Clear all toasts */
  clearAll: () => void;
}

/**
 * Default durations by toast type (milliseconds)
 */
const DEFAULT_DURATIONS: Record<ToastType, number> = {
  success: 3000,
  error: 5000,
  warning: 4000,
  info: 3000,
};

/**
 * Generate unique toast ID
 */
function generateToastId(): string {
  return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Toast notification store
 */
export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  addToast: (toast) => {
    const id = generateToastId();
    const duration = toast.duration ?? DEFAULT_DURATIONS[toast.type];

    const newToast: Toast = {
      ...toast,
      id,
      duration,
      createdAt: Date.now(),
    };

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    // Auto-dismiss if duration > 0
    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, duration);
    }

    return id;
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },

  updateToast: (id, updates) => {
    set((state) => ({
      toasts: state.toasts.map((toast) =>
        toast.id === id ? { ...toast, ...updates } : toast
      ),
    }));
  },

  clearAll: () => {
    set({ toasts: [] });
  },
}));
