/**
 * useModes Hook
 *
 * React hook for managing view mode state and filtering nodes/edges.
 * Integrates with the backend mode store and applies mode-specific filters.
 *
 * @module hooks/useModes
 * @version 1.0.0
 * @author Mode System Engineer (Agent 1) - Wave 2
 */

import { useMemo } from 'react';
import type { Node, Edge } from 'reactflow';
import type { ViewMode, ModeMetadata } from '@backend/lib/modes/types';
import { useModeStore } from '@backend/lib/modes/mode-store';
import { applyModeFilters, type FilterResult } from '../lib/modes/filters';
import { MODE_METADATA } from '../lib/modes/metadata';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Return type for useModes hook.
 */
export interface UseModesReturn {
  /** Current active mode */
  currentMode: ViewMode;

  /** Previous mode (for back navigation) */
  previousMode: ViewMode | null;

  /** Set the current mode */
  setMode: (mode: ViewMode, preserveState?: boolean) => void;

  /** Go back to previous mode */
  goBack: () => void;

  /** Filtered nodes based on current mode */
  filteredNodes: Node[];

  /** Filtered edges based on current mode */
  filteredEdges: Edge[];

  /** Filter statistics */
  filterStats: FilterResult['stats'];

  /** Metadata for current mode */
  modeConfig: ModeMetadata;

  /** Metadata for all modes */
  allModes: Record<ViewMode, ModeMetadata>;

  /** Whether the current mode supports editing */
  canEdit: boolean;

  /** Whether the current mode shows canvas */
  showsCanvas: boolean;

  /** Whether the current mode has sidebar */
  hasSidebar: boolean;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for managing view modes and filtering.
 *
 * Provides mode state management and automatically filters nodes/edges
 * based on the current mode's visibility rules.
 *
 * @param nodes - All nodes to filter
 * @param edges - All edges to filter
 * @returns Mode state and filtered nodes/edges
 *
 * @example
 * ```typescript
 * function App() {
 *   const [nodes, setNodes] = useState<Node[]>([]);
 *   const [edges, setEdges] = useState<Edge[]>([]);
 *
 *   const {
 *     currentMode,
 *     setMode,
 *     filteredNodes,
 *     filteredEdges,
 *     modeConfig,
 *   } = useModes(nodes, edges);
 *
 *   return (
 *     <>
 *       <ModeSelector currentMode={currentMode} onModeChange={setMode} />
 *       <Canvas nodes={filteredNodes} edges={filteredEdges} />
 *     </>
 *   );
 * }
 * ```
 */
export function useModes(nodes: Node[], edges: Edge[]): UseModesReturn {
  // ========================================
  // Mode Store
  // ========================================

  const currentMode = useModeStore((state) => state.currentMode);
  const previousMode = useModeStore((state) => state.previousMode);
  const setMode = useModeStore((state) => state.setMode);
  const goBack = useModeStore((state) => state.goBack);

  // ========================================
  // Mode Metadata
  // ========================================

  const modeConfig = useMemo(() => MODE_METADATA[currentMode], [currentMode]);

  const canEdit = useMemo(() => modeConfig.supportsEditing, [modeConfig]);

  const showsCanvas = useMemo(() => modeConfig.showsCanvas, [modeConfig]);

  const hasSidebar = useMemo(() => modeConfig.hasSidebar, [modeConfig]);

  // ========================================
  // Filtering
  // ========================================

  const filterResult = useMemo(() => {
    return applyModeFilters(nodes, edges, currentMode);
  }, [nodes, edges, currentMode]);

  const filteredNodes = useMemo(() => filterResult.nodes, [filterResult]);

  const filteredEdges = useMemo(() => filterResult.edges, [filterResult]);

  const filterStats = useMemo(() => filterResult.stats, [filterResult]);

  // ========================================
  // Return
  // ========================================

  return {
    currentMode,
    previousMode,
    setMode,
    goBack,
    filteredNodes,
    filteredEdges,
    filterStats,
    modeConfig,
    allModes: MODE_METADATA,
    canEdit,
    showsCanvas,
    hasSidebar,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * @public
 * @exports useModes - Hook for mode management
 * @exports UseModesReturn - Return type
 */
