/**
 * Mode Metadata Configuration
 *
 * Defines display information, icons, and capabilities for each view mode.
 *
 * @module lib/modes/metadata
 * @version 1.0.0
 * @author Mode System Engineer (Agent 1) - Wave 2
 */

import type { ViewMode, ModeMetadata } from '@backend/lib/modes/types';

// ============================================================================
// MODE METADATA
// ============================================================================

/**
 * Metadata for all view modes.
 *
 * Provides display information, icons, shortcuts, and capabilities.
 */
export const MODE_METADATA: Record<ViewMode, ModeMetadata> = {
  explorer: {
    id: 'explorer',
    name: 'Explorer',
    description: 'Browse all templates, nodes, and relationships. General exploration mode.',
    icon: '🔍',
    shortcut: '1',
    supportsEditing: true,
    showsCanvas: true,
    hasSidebar: true,
  },

  composition: {
    id: 'composition',
    name: 'Composition',
    description: 'Focus on template structure and composition with fragments and configs.',
    icon: '🧩',
    shortcut: '2',
    supportsEditing: true,
    showsCanvas: true,
    hasSidebar: true,
  },

  dependency: {
    id: 'dependency',
    name: 'Dependency',
    description: 'Visualize template dependencies including extends and mixin relationships.',
    icon: '🔗',
    shortcut: '3',
    supportsEditing: false,
    showsCanvas: true,
    hasSidebar: true,
  },

  execution: {
    id: 'execution',
    name: 'Execution',
    description: 'View runtime execution flow with variable values and tool invocations.',
    icon: '▶️',
    shortcut: '4',
    supportsEditing: true,
    showsCanvas: true,
    hasSidebar: true,
  },

  validation: {
    id: 'validation',
    name: 'Validation',
    description: 'Review validation results, errors, and warnings with auto-fix suggestions.',
    icon: '✓',
    shortcut: '5',
    supportsEditing: false,
    showsCanvas: true,
    hasSidebar: true,
  },
};

// ============================================================================
// MODE LISTS
// ============================================================================

/**
 * All available view modes in display order.
 */
export const ALL_MODES: ViewMode[] = [
  'explorer',
  'composition',
  'dependency',
  'execution',
  'validation',
];

/**
 * Modes that support editing.
 */
export const EDITABLE_MODES: ViewMode[] = ALL_MODES.filter(
  (mode) => MODE_METADATA[mode].supportsEditing
);

/**
 * Modes that show the canvas.
 */
export const CANVAS_MODES: ViewMode[] = ALL_MODES.filter(
  (mode) => MODE_METADATA[mode].showsCanvas
);

/**
 * Modes that have a sidebar.
 */
export const SIDEBAR_MODES: ViewMode[] = ALL_MODES.filter(
  (mode) => MODE_METADATA[mode].hasSidebar
);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get metadata for a specific mode.
 *
 * @param mode - Mode to get metadata for
 * @returns Mode metadata
 */
export function getModeMetadata(mode: ViewMode): ModeMetadata {
  return MODE_METADATA[mode];
}

/**
 * Get display name for a mode.
 *
 * @param mode - Mode to get name for
 * @returns Display name
 */
export function getModeName(mode: ViewMode): string {
  return MODE_METADATA[mode].name;
}

/**
 * Get icon for a mode.
 *
 * @param mode - Mode to get icon for
 * @returns Icon string
 */
export function getModeIcon(mode: ViewMode): string {
  return MODE_METADATA[mode].icon;
}

/**
 * Get description for a mode.
 *
 * @param mode - Mode to get description for
 * @returns Description string
 */
export function getModeDescription(mode: ViewMode): string {
  return MODE_METADATA[mode].description;
}

/**
 * Get keyboard shortcut for a mode.
 *
 * @param mode - Mode to get shortcut for
 * @returns Shortcut string
 */
export function getModeShortcut(mode: ViewMode): string {
  return MODE_METADATA[mode].shortcut;
}

/**
 * Check if a mode supports editing.
 *
 * @param mode - Mode to check
 * @returns True if mode supports editing
 */
export function supportsEditing(mode: ViewMode): boolean {
  return MODE_METADATA[mode].supportsEditing;
}

/**
 * Check if a mode shows the canvas.
 *
 * @param mode - Mode to check
 * @returns True if mode shows canvas
 */
export function showsCanvas(mode: ViewMode): boolean {
  return MODE_METADATA[mode].showsCanvas;
}

/**
 * Check if a mode has a sidebar.
 *
 * @param mode - Mode to check
 * @returns True if mode has sidebar
 */
export function hasSidebar(mode: ViewMode): boolean {
  return MODE_METADATA[mode].hasSidebar;
}

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * @public
 * @exports MODE_METADATA - Metadata for all modes
 * @exports ALL_MODES - All available modes
 * @exports EDITABLE_MODES - Modes supporting editing
 * @exports CANVAS_MODES - Modes showing canvas
 * @exports SIDEBAR_MODES - Modes with sidebar
 * @exports getModeMetadata - Get metadata for a mode
 * @exports getModeName - Get display name
 * @exports getModeIcon - Get icon
 * @exports getModeDescription - Get description
 * @exports getModeShortcut - Get keyboard shortcut
 * @exports supportsEditing - Check edit support
 * @exports showsCanvas - Check canvas visibility
 * @exports hasSidebar - Check sidebar presence
 */
