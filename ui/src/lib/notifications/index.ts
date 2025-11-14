/**
 * Notifications Module
 *
 * Central exports for toast notifications and related utilities.
 *
 * @module lib/notifications
 * @version 1.0.0
 * @author Error Handling & Recovery Engineer (Agent 3)
 */

// Toast API
export { toast } from './toast';
export type { ToastOptions, PromiseMessages } from './toast';

// Toast Store
export { useToastStore } from './toast-store';
export type { Toast, ToastType, ToastAction } from './toast-store';
