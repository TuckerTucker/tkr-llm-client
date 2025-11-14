/**
 * Store Index
 *
 * Re-exports backend Zustand stores for UI consumption.
 * Provides a clean interface to access state management from UI components.
 *
 * @module ui/store
 * @version 1.0.0
 * @author State Management Integration Engineer (Agent 4, Wave 1)
 */

// Re-export backend stores
export { useCanvasStore } from '@/../../src/lib/state/canvas-store';

// Re-export types
export type {
  CanvasState,
  Viewport,
} from '@/../../src/lib/state/canvas-store';

// Note: Template and App stores will be added when they are implemented in the backend
// export { useTemplateStore } from '@/../../src/lib/state/template-store';
// export { useAppStore } from '@/../../src/lib/state/app-store';
