/**
 * Mode System Type Definitions
 *
 * Defines all types and interfaces for the view mode system including
 * mode types, state management, and configuration.
 *
 * @module lib/modes/types
 * @version 1.0.0
 * @author Mode System Engineer (Agent 1) - Wave 2
 */

// ============================================================================
// VIEW MODES
// ============================================================================

/**
 * Available view modes for the ReactFlow Template UI.
 *
 * @enum
 */
export type ViewMode = 'explorer' | 'composition' | 'dependency' | 'execution' | 'validation';

/**
 * Mode metadata configuration.
 *
 * Describes display information and capabilities for each mode.
 */
export interface ModeMetadata {
  /** Unique mode identifier */
  id: ViewMode;

  /** Display name for the mode */
  name: string;

  /** Mode description */
  description: string;

  /** Icon identifier (for UI rendering) */
  icon: string;

  /** Keyboard shortcut (e.g., "Cmd+1") */
  shortcut: string;

  /** Whether this mode supports editing */
  supportsEditing: boolean;

  /** Whether this mode shows the canvas */
  showsCanvas: boolean;

  /** Whether this mode has a sidebar */
  hasSidebar: boolean;
}

// ============================================================================
// MODE-SPECIFIC STATE
// ============================================================================

/**
 * Explorer mode state.
 *
 * State for template browsing and search functionality.
 */
export interface ExplorerState {
  /** Current search query */
  searchQuery: string;

  /** Selected template category */
  selectedCategory: string | null;

  /** Active filter tags */
  filterTags: string[];

  /** Sort order for templates */
  sortBy: 'name' | 'date' | 'usage';

  /** Sort direction */
  sortDirection: 'asc' | 'desc';

  /** Currently hovered template ID */
  hoveredTemplateId: string | null;
}

/**
 * Composition mode state.
 *
 * State for component library and composition building.
 */
export interface CompositionState {
  /** Selected component type filter */
  componentFilter: 'all' | 'fragments' | 'configs' | 'tools';

  /** Active composition being built */
  activeCompositionId: string | null;

  /** Selected library items */
  selectedLibraryItems: string[];

  /** Whether the composition panel is open */
  compositionPanelOpen: boolean;
}

/**
 * Dependency mode state.
 *
 * State for dependency graph visualization.
 */
export interface DependencyState {
  /** Root node for dependency visualization */
  rootNodeId: string | null;

  /** Depth level to display (1-5, null = all) */
  depthLevel: number | null;

  /** Whether to show inheritance chains */
  showInheritance: boolean;

  /** Whether to show fragment usage */
  showFragmentUsage: boolean;

  /** Whether to show tool dependencies */
  showToolDependencies: boolean;

  /** Highlight mode for dependencies */
  highlightMode: 'none' | 'upstream' | 'downstream' | 'both';

  /** Currently selected dependency type filter */
  dependencyTypeFilter: 'all' | 'extends' | 'mixin' | 'toolRef' | 'variable';
}

/**
 * Execution mode state.
 *
 * State for template execution and output preview.
 */
export interface ExecutionState {
  /** ID of the template being executed */
  executingTemplateId: string | null;

  /** Current variable values */
  variableValues: Record<string, any>;

  /** Validation errors for variables */
  variableErrors: Record<string, string>;

  /** Whether the form is in edit mode */
  formEditMode: boolean;

  /** Execution result (if available) */
  executionResult: {
    /** Whether execution was successful */
    success: boolean;

    /** Output from execution */
    output: string;

    /** Execution timestamp */
    timestamp: number;

    /** Error message (if failed) */
    error?: string;
  } | null;

  /** Whether the output preview is visible */
  previewVisible: boolean;
}

/**
 * Validation mode state.
 *
 * State for validation results display and error highlighting.
 */
export interface ValidationState {
  /** Currently selected validation result */
  selectedResultId: string | null;

  /** Filter for validation severity */
  severityFilter: 'all' | 'error' | 'warning';

  /** Whether to show only failed validations */
  showFailedOnly: boolean;

  /** Auto-fix suggestions enabled */
  autoFixEnabled: boolean;

  /** List of applied auto-fixes */
  appliedFixes: Array<{
    /** ID of the fix */
    id: string;

    /** Description of the fix */
    description: string;

    /** Timestamp when applied */
    timestamp: number;
  }>;
}

/**
 * Union type for all mode-specific states.
 */
export type ModeSpecificState = {
  explorer: ExplorerState;
  composition: CompositionState;
  dependency: DependencyState;
  execution: ExecutionState;
  validation: ValidationState;
};

// ============================================================================
// MODE HISTORY
// ============================================================================

/**
 * Mode history entry.
 *
 * Tracks mode changes for navigation history.
 */
export interface ModeHistoryEntry {
  /** Mode that was active */
  mode: ViewMode;

  /** Timestamp of mode activation */
  timestamp: number;

  /** State snapshot (optional) */
  state?: Partial<ModeSpecificState[ViewMode]>;
}

// ============================================================================
// MODE TRANSITION
// ============================================================================

/**
 * Mode transition configuration.
 *
 * Defines how to transition between modes.
 */
export interface ModeTransition {
  /** Source mode */
  from: ViewMode;

  /** Target mode */
  to: ViewMode;

  /** Whether to preserve state */
  preserveState: boolean;

  /** Whether to validate before transition */
  requiresValidation: boolean;

  /** Animation duration (ms) */
  animationDuration: number;

  /** Animation easing function */
  animationEasing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

// ============================================================================
// MODE PERSISTENCE
// ============================================================================

/**
 * Persisted mode state.
 *
 * State that is saved to localStorage.
 */
export interface PersistedModeState {
  /** Current active mode */
  currentMode: ViewMode;

  /** Mode-specific states */
  modeStates: Partial<ModeSpecificState>;

  /** Mode history */
  history: ModeHistoryEntry[];

  /** Last updated timestamp */
  lastUpdated: number;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if a value is a valid ViewMode.
 *
 * @param value - Value to check
 * @returns True if value is a ViewMode
 */
export function isViewMode(value: any): value is ViewMode {
  return ['explorer', 'composition', 'dependency', 'execution', 'validation'].includes(value);
}

/**
 * Type guard to check if a mode has a specific state type.
 *
 * @param mode - Mode to check
 * @param state - State object
 * @returns Type assertion for the state
 */
export function isModeState<T extends ViewMode>(
  _mode: T,
  state: any
): state is ModeSpecificState[T] {
  // Basic validation - could be extended with more specific checks
  return state !== null && typeof state === 'object';
}

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * @public
 * @exports ViewMode - Type for available view modes
 * @exports ModeMetadata - Mode configuration metadata
 * @exports ExplorerState - Explorer mode state
 * @exports CompositionState - Composition mode state
 * @exports DependencyState - Dependency mode state
 * @exports ExecutionState - Execution mode state
 * @exports ValidationState - Validation mode state
 * @exports ModeSpecificState - Union of all mode states
 * @exports ModeHistoryEntry - Mode history entry
 * @exports ModeTransition - Mode transition configuration
 * @exports PersistedModeState - Persisted state structure
 * @exports isViewMode - Type guard for ViewMode
 * @exports isModeState - Type guard for mode-specific state
 */
