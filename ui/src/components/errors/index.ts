/**
 * Error Components Module
 *
 * Central exports for error boundaries and fallback components.
 *
 * @module components/errors
 * @version 1.0.0
 * @author Error Handling & Recovery Engineer (Agent 3)
 */

// Error Boundaries
export { RootErrorBoundary } from './RootErrorBoundary';
export type { RootErrorBoundaryProps } from './RootErrorBoundary';

export { CanvasErrorBoundary } from './CanvasErrorBoundary';
export type { CanvasErrorBoundaryProps } from './CanvasErrorBoundary';

export { ComponentErrorBoundary } from './ComponentErrorBoundary';
export type { ComponentErrorBoundaryProps } from './ComponentErrorBoundary';

// Fallback Components
export { FatalErrorScreen } from './fallbacks/FatalErrorScreen';
export type { FatalErrorScreenProps } from './fallbacks/FatalErrorScreen';

export { CanvasErrorFallback } from './fallbacks/CanvasErrorFallback';
export type { CanvasErrorFallbackProps } from './fallbacks/CanvasErrorFallback';

export { ComponentErrorFallback } from './fallbacks/ComponentErrorFallback';
export type { ComponentErrorFallbackProps } from './fallbacks/ComponentErrorFallback';
