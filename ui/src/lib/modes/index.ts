/**
 * Mode System Exports
 *
 * Central export point for mode-related utilities and configuration.
 *
 * @module lib/modes
 * @version 1.0.0
 * @author Mode System Engineer (Agent 1) - Wave 2
 */

// Metadata
export {
  MODE_METADATA,
  ALL_MODES,
  EDITABLE_MODES,
  CANVAS_MODES,
  SIDEBAR_MODES,
  getModeMetadata,
  getModeName,
  getModeIcon,
  getModeDescription,
  getModeShortcut,
  supportsEditing,
  showsCanvas,
  hasSidebar,
} from './metadata';

// Filters
export {
  applyModeFilters,
  isNodeVisibleInMode,
  isEdgeVisibleInMode,
  getVisibleNodeTypes,
  getVisibleEdgeTypes,
  type FilterResult,
} from './filters';

// Re-export backend types
export type {
  ViewMode,
  ModeMetadata,
  ExplorerState,
  CompositionState,
  DependencyState,
  ExecutionState,
  ValidationState,
  ModeSpecificState,
  ModeHistoryEntry,
  ModeTransition,
  PersistedModeState,
} from '@backend/lib/modes/types';

// Re-export backend store
export { useModeStore, type ModeStore } from '@backend/lib/modes/mode-store';
