/**
 * Mode Store
 *
 * Zustand store for managing view mode state, mode-specific configurations,
 * history tracking, and localStorage persistence.
 *
 * @module lib/modes/mode-store
 * @version 1.0.0
 * @author Mode System Engineer (Agent 1) - Wave 2
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ViewMode,
  ExplorerState,
  CompositionState,
  DependencyState,
  ExecutionState,
  ValidationState,
  ModeHistoryEntry,
} from './types';

// ============================================================================
// DEFAULT MODE STATES
// ============================================================================

/**
 * Default state for Explorer mode.
 */
const DEFAULT_EXPLORER_STATE: ExplorerState = {
  searchQuery: '',
  selectedCategory: null,
  filterTags: [],
  sortBy: 'name',
  sortDirection: 'asc',
  hoveredTemplateId: null,
};

/**
 * Default state for Composition mode.
 */
const DEFAULT_COMPOSITION_STATE: CompositionState = {
  componentFilter: 'all',
  activeCompositionId: null,
  selectedLibraryItems: [],
  compositionPanelOpen: false,
};

/**
 * Default state for Dependency mode.
 */
const DEFAULT_DEPENDENCY_STATE: DependencyState = {
  rootNodeId: null,
  depthLevel: null,
  showInheritance: true,
  showFragmentUsage: true,
  showToolDependencies: true,
  highlightMode: 'none',
  dependencyTypeFilter: 'all',
};

/**
 * Default state for Execution mode.
 */
const DEFAULT_EXECUTION_STATE: ExecutionState = {
  executingTemplateId: null,
  variableValues: {},
  variableErrors: {},
  formEditMode: true,
  executionResult: null,
  previewVisible: false,
};

/**
 * Default state for Validation mode.
 */
const DEFAULT_VALIDATION_STATE: ValidationState = {
  selectedResultId: null,
  severityFilter: 'all',
  showFailedOnly: false,
  autoFixEnabled: false,
  appliedFixes: [],
};

// ============================================================================
// MODE STORE INTERFACE
// ============================================================================

/**
 * Mode store state and actions.
 */
export interface ModeStore {
  // ========================================
  // Core State
  // ========================================

  /** Current active mode */
  currentMode: ViewMode;

  /** Previous mode (for back navigation) */
  previousMode: ViewMode | null;

  /** Mode history stack */
  history: ModeHistoryEntry[];

  /** Mode-specific states */
  modeStates: {
    explorer: ExplorerState;
    composition: CompositionState;
    dependency: DependencyState;
    execution: ExecutionState;
    validation: ValidationState;
  };

  // ========================================
  // Mode Actions
  // ========================================

  /**
   * Set the current active mode.
   *
   * @param mode - Mode to activate
   * @param preserveState - Whether to preserve current mode state
   */
  setMode: (mode: ViewMode, preserveState?: boolean) => void;

  /**
   * Go back to the previous mode.
   */
  goBack: () => void;

  /**
   * Get the current mode state.
   *
   * @returns Current mode-specific state
   */
  getCurrentModeState: () => ExplorerState | CompositionState | DependencyState | ExecutionState | ValidationState;

  /**
   * Get state for a specific mode.
   *
   * @param mode - Mode to get state for
   * @returns Mode-specific state
   */
  getModeState: (mode: ViewMode) => ExplorerState | CompositionState | DependencyState | ExecutionState | ValidationState;

  // ========================================
  // Explorer Mode Actions
  // ========================================

  /**
   * Update Explorer mode state.
   *
   * @param updates - Partial state updates
   */
  updateExplorerState: (updates: Partial<ExplorerState>) => void;

  /**
   * Set search query in Explorer mode.
   *
   * @param query - Search query string
   */
  setSearchQuery: (query: string) => void;

  /**
   * Set selected category in Explorer mode.
   *
   * @param category - Category name or null
   */
  setSelectedCategory: (category: string | null) => void;

  /**
   * Add a filter tag in Explorer mode.
   *
   * @param tag - Tag to add
   */
  addFilterTag: (tag: string) => void;

  /**
   * Remove a filter tag in Explorer mode.
   *
   * @param tag - Tag to remove
   */
  removeFilterTag: (tag: string) => void;

  /**
   * Clear all filter tags in Explorer mode.
   */
  clearFilterTags: () => void;

  // ========================================
  // Composition Mode Actions
  // ========================================

  /**
   * Update Composition mode state.
   *
   * @param updates - Partial state updates
   */
  updateCompositionState: (updates: Partial<CompositionState>) => void;

  /**
   * Set component filter in Composition mode.
   *
   * @param filter - Component type filter
   */
  setComponentFilter: (filter: CompositionState['componentFilter']) => void;

  /**
   * Toggle composition panel visibility.
   */
  toggleCompositionPanel: () => void;

  /**
   * Add item to selected library items.
   *
   * @param itemId - Item ID to select
   */
  addSelectedLibraryItem: (itemId: string) => void;

  /**
   * Remove item from selected library items.
   *
   * @param itemId - Item ID to deselect
   */
  removeSelectedLibraryItem: (itemId: string) => void;

  // ========================================
  // Dependency Mode Actions
  // ========================================

  /**
   * Update Dependency mode state.
   *
   * @param updates - Partial state updates
   */
  updateDependencyState: (updates: Partial<DependencyState>) => void;

  /**
   * Set root node for dependency visualization.
   *
   * @param nodeId - Root node ID or null
   */
  setDependencyRootNode: (nodeId: string | null) => void;

  /**
   * Set depth level for dependency visualization.
   *
   * @param depth - Depth level (1-5) or null for all
   */
  setDependencyDepth: (depth: number | null) => void;

  /**
   * Toggle dependency type visibility.
   *
   * @param type - Dependency type to toggle
   */
  toggleDependencyType: (type: keyof Pick<DependencyState, 'showInheritance' | 'showFragmentUsage' | 'showToolDependencies'>) => void;

  // ========================================
  // Execution Mode Actions
  // ========================================

  /**
   * Update Execution mode state.
   *
   * @param updates - Partial state updates
   */
  updateExecutionState: (updates: Partial<ExecutionState>) => void;

  /**
   * Set the template being executed.
   *
   * @param templateId - Template ID or null
   */
  setExecutingTemplate: (templateId: string | null) => void;

  /**
   * Set a variable value.
   *
   * @param variableName - Variable name
   * @param value - Variable value
   */
  setVariableValue: (variableName: string, value: any) => void;

  /**
   * Set a variable error.
   *
   * @param variableName - Variable name
   * @param error - Error message
   */
  setVariableError: (variableName: string, error: string) => void;

  /**
   * Clear variable errors.
   */
  clearVariableErrors: () => void;

  /**
   * Toggle preview visibility.
   */
  togglePreview: () => void;

  // ========================================
  // Validation Mode Actions
  // ========================================

  /**
   * Update Validation mode state.
   *
   * @param updates - Partial state updates
   */
  updateValidationState: (updates: Partial<ValidationState>) => void;

  /**
   * Set selected validation result.
   *
   * @param resultId - Result ID or null
   */
  setSelectedValidationResult: (resultId: string | null) => void;

  /**
   * Set severity filter.
   *
   * @param severity - Severity filter
   */
  setSeverityFilter: (severity: ValidationState['severityFilter']) => void;

  /**
   * Toggle show failed only filter.
   */
  toggleShowFailedOnly: () => void;

  /**
   * Add an applied fix to the history.
   *
   * @param fix - Fix details
   */
  addAppliedFix: (fix: { id: string; description: string }) => void;

  // ========================================
  // History Actions
  // ========================================

  /**
   * Clear mode history.
   */
  clearHistory: () => void;

  /**
   * Get recent mode history.
   *
   * @param limit - Number of entries to return
   * @returns Recent history entries
   */
  getRecentHistory: (limit?: number) => ModeHistoryEntry[];

  // ========================================
  // Reset Actions
  // ========================================

  /**
   * Reset all mode states to defaults.
   */
  resetAllModeStates: () => void;

  /**
   * Reset a specific mode state to default.
   *
   * @param mode - Mode to reset
   */
  resetModeState: (mode: ViewMode) => void;
}

// ============================================================================
// STORE CREATION
// ============================================================================

const STORAGE_KEY = 'tkr-llm-ui-mode-state';
const MAX_HISTORY = 20;

/**
 * Create the mode store with persistence.
 */
export const useModeStore = create<ModeStore>()(
  persist(
    (set, get) => ({
      // Initial state
      currentMode: 'explorer',
      previousMode: null,
      history: [],
      modeStates: {
        explorer: DEFAULT_EXPLORER_STATE,
        composition: DEFAULT_COMPOSITION_STATE,
        dependency: DEFAULT_DEPENDENCY_STATE,
        execution: DEFAULT_EXECUTION_STATE,
        validation: DEFAULT_VALIDATION_STATE,
      },

      // Mode actions
      setMode: (mode, preserveState = true) => {
        const currentMode = get().currentMode;
        if (currentMode === mode) return;

        set((state) => {
          const newHistory = [
            ...state.history,
            {
              mode: currentMode,
              timestamp: Date.now(),
              state: preserveState ? state.modeStates[currentMode] : undefined,
            },
          ].slice(-MAX_HISTORY);

          return {
            currentMode: mode,
            previousMode: currentMode,
            history: newHistory,
          };
        });
      },

      goBack: () => {
        const { previousMode, history } = get();
        if (!previousMode) return;

        // Restore state from history if available
        const lastEntry = history[history.length - 1];
        if (lastEntry && lastEntry.state) {
          set((state) => ({
            modeStates: {
              ...state.modeStates,
              [previousMode]: { ...state.modeStates[previousMode], ...lastEntry.state },
            },
          }));
        }

        get().setMode(previousMode);
      },

      getCurrentModeState: () => {
        const { currentMode, modeStates } = get();
        return modeStates[currentMode];
      },

      getModeState: (mode) => {
        return get().modeStates[mode];
      },

      // Explorer actions
      updateExplorerState: (updates) =>
        set((state) => ({
          modeStates: {
            ...state.modeStates,
            explorer: { ...state.modeStates.explorer, ...updates },
          },
        })),

      setSearchQuery: (query) =>
        get().updateExplorerState({ searchQuery: query }),

      setSelectedCategory: (category) =>
        get().updateExplorerState({ selectedCategory: category }),

      addFilterTag: (tag) =>
        set((state) => ({
          modeStates: {
            ...state.modeStates,
            explorer: {
              ...state.modeStates.explorer,
              filterTags: [...state.modeStates.explorer.filterTags, tag],
            },
          },
        })),

      removeFilterTag: (tag) =>
        set((state) => ({
          modeStates: {
            ...state.modeStates,
            explorer: {
              ...state.modeStates.explorer,
              filterTags: state.modeStates.explorer.filterTags.filter((t) => t !== tag),
            },
          },
        })),

      clearFilterTags: () =>
        get().updateExplorerState({ filterTags: [] }),

      // Composition actions
      updateCompositionState: (updates) =>
        set((state) => ({
          modeStates: {
            ...state.modeStates,
            composition: { ...state.modeStates.composition, ...updates },
          },
        })),

      setComponentFilter: (filter) =>
        get().updateCompositionState({ componentFilter: filter }),

      toggleCompositionPanel: () =>
        set((state) => ({
          modeStates: {
            ...state.modeStates,
            composition: {
              ...state.modeStates.composition,
              compositionPanelOpen: !state.modeStates.composition.compositionPanelOpen,
            },
          },
        })),

      addSelectedLibraryItem: (itemId) =>
        set((state) => ({
          modeStates: {
            ...state.modeStates,
            composition: {
              ...state.modeStates.composition,
              selectedLibraryItems: [...state.modeStates.composition.selectedLibraryItems, itemId],
            },
          },
        })),

      removeSelectedLibraryItem: (itemId) =>
        set((state) => ({
          modeStates: {
            ...state.modeStates,
            composition: {
              ...state.modeStates.composition,
              selectedLibraryItems: state.modeStates.composition.selectedLibraryItems.filter(
                (id) => id !== itemId
              ),
            },
          },
        })),

      // Dependency actions
      updateDependencyState: (updates) =>
        set((state) => ({
          modeStates: {
            ...state.modeStates,
            dependency: { ...state.modeStates.dependency, ...updates },
          },
        })),

      setDependencyRootNode: (nodeId) =>
        get().updateDependencyState({ rootNodeId: nodeId }),

      setDependencyDepth: (depth) =>
        get().updateDependencyState({ depthLevel: depth }),

      toggleDependencyType: (type) =>
        set((state) => ({
          modeStates: {
            ...state.modeStates,
            dependency: {
              ...state.modeStates.dependency,
              [type]: !state.modeStates.dependency[type],
            },
          },
        })),

      // Execution actions
      updateExecutionState: (updates) =>
        set((state) => ({
          modeStates: {
            ...state.modeStates,
            execution: { ...state.modeStates.execution, ...updates },
          },
        })),

      setExecutingTemplate: (templateId) =>
        get().updateExecutionState({ executingTemplateId: templateId }),

      setVariableValue: (variableName, value) =>
        set((state) => ({
          modeStates: {
            ...state.modeStates,
            execution: {
              ...state.modeStates.execution,
              variableValues: {
                ...state.modeStates.execution.variableValues,
                [variableName]: value,
              },
            },
          },
        })),

      setVariableError: (variableName, error) =>
        set((state) => ({
          modeStates: {
            ...state.modeStates,
            execution: {
              ...state.modeStates.execution,
              variableErrors: {
                ...state.modeStates.execution.variableErrors,
                [variableName]: error,
              },
            },
          },
        })),

      clearVariableErrors: () =>
        get().updateExecutionState({ variableErrors: {} }),

      togglePreview: () =>
        set((state) => ({
          modeStates: {
            ...state.modeStates,
            execution: {
              ...state.modeStates.execution,
              previewVisible: !state.modeStates.execution.previewVisible,
            },
          },
        })),

      // Validation actions
      updateValidationState: (updates) =>
        set((state) => ({
          modeStates: {
            ...state.modeStates,
            validation: { ...state.modeStates.validation, ...updates },
          },
        })),

      setSelectedValidationResult: (resultId) =>
        get().updateValidationState({ selectedResultId: resultId }),

      setSeverityFilter: (severity) =>
        get().updateValidationState({ severityFilter: severity }),

      toggleShowFailedOnly: () =>
        set((state) => ({
          modeStates: {
            ...state.modeStates,
            validation: {
              ...state.modeStates.validation,
              showFailedOnly: !state.modeStates.validation.showFailedOnly,
            },
          },
        })),

      addAppliedFix: (fix) =>
        set((state) => ({
          modeStates: {
            ...state.modeStates,
            validation: {
              ...state.modeStates.validation,
              appliedFixes: [
                ...state.modeStates.validation.appliedFixes,
                { ...fix, timestamp: Date.now() },
              ],
            },
          },
        })),

      // History actions
      clearHistory: () =>
        set({ history: [] }),

      getRecentHistory: (limit = 10) => {
        const { history } = get();
        return history.slice(-limit);
      },

      // Reset actions
      resetAllModeStates: () =>
        set({
          modeStates: {
            explorer: DEFAULT_EXPLORER_STATE,
            composition: DEFAULT_COMPOSITION_STATE,
            dependency: DEFAULT_DEPENDENCY_STATE,
            execution: DEFAULT_EXECUTION_STATE,
            validation: DEFAULT_VALIDATION_STATE,
          },
        }),

      resetModeState: (mode) =>
        set((state) => {
          const defaults = {
            explorer: DEFAULT_EXPLORER_STATE,
            composition: DEFAULT_COMPOSITION_STATE,
            dependency: DEFAULT_DEPENDENCY_STATE,
            execution: DEFAULT_EXECUTION_STATE,
            validation: DEFAULT_VALIDATION_STATE,
          };

          return {
            modeStates: {
              ...state.modeStates,
              [mode]: defaults[mode],
            },
          };
        }),
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        currentMode: state.currentMode,
        modeStates: state.modeStates,
        history: state.history.slice(-MAX_HISTORY),
      }),
    }
  )
);

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * @public
 * @exports useModeStore - Zustand hook for mode state
 * @exports ModeStore - Type definition for the store
 */
