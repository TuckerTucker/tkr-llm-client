/**
 * Layout Selector Hook
 *
 * React hook for managing layout algorithm selection with localStorage persistence
 * and keyboard shortcut support.
 *
 * @module hooks/useLayoutSelector
 * @version 1.0.0
 * @author Layout Integration Engineer (Agent 2) - Wave 1
 */

import { useState, useEffect, useCallback } from 'react';
import type { LayoutAlgorithm } from './useAutoLayout';

// Type alias for backward compatibility
export type LayoutAlgorithmType = LayoutAlgorithm;

/**
 * Layout selector configuration
 */
export interface LayoutSelectorConfig {
  /** Initial layout algorithm */
  defaultLayout?: LayoutAlgorithmType;
  /** Enable localStorage persistence */
  persist?: boolean;
  /** localStorage key for persistence */
  storageKey?: string;
  /** Enable keyboard shortcuts */
  enableKeyboardShortcuts?: boolean;
}

/**
 * Layout metadata for display
 */
export interface LayoutMetadata {
  algorithm: LayoutAlgorithmType;
  name: string;
  description: string;
  icon?: string;
  recommended?: boolean;
  shortcutKey?: string;
}

/**
 * All available layouts with metadata
 */
export const LAYOUT_OPTIONS: LayoutMetadata[] = [
  {
    algorithm: 'dagre',
    name: 'Dagre',
    description: 'Hierarchical',
    icon: '⬇',
    recommended: true,
    shortcutKey: '1',
  },
  {
    algorithm: 'force',
    name: 'Force-Directed',
    description: 'Network',
    icon: '🌐',
    shortcutKey: '2',
  },
  {
    algorithm: 'elk',
    name: 'ELK',
    description: 'Advanced Hierarchical',
    icon: '⚡',
    shortcutKey: '3',
  },
  {
    algorithm: 'grid',
    name: 'Grid',
    description: 'Uniform Spacing',
    icon: '📐',
    shortcutKey: '4',
  },
  {
    algorithm: 'circular',
    name: 'Circular',
    description: 'Cycle Emphasis',
    icon: '⭕',
    shortcutKey: '5',
  },
  {
    algorithm: 'tree',
    name: 'Tree',
    description: 'Strict Hierarchy',
    icon: '🌳',
    shortcutKey: '6',
  },
  {
    algorithm: 'manual',
    name: 'Manual',
    description: 'User Positioned',
    icon: '✋',
    shortcutKey: '7',
  },
];

/**
 * Get layout metadata by algorithm
 */
export function getLayoutMetadata(algorithm: LayoutAlgorithmType): LayoutMetadata {
  return (
    LAYOUT_OPTIONS.find((opt) => opt.algorithm === algorithm) || {
      algorithm,
      name: algorithm,
      description: '',
    }
  );
}

/**
 * Hook for managing layout selection
 *
 * @param config - Configuration options
 * @returns Current layout and selection functions
 */
export function useLayoutSelector(config: LayoutSelectorConfig = {}) {
  const {
    defaultLayout = 'dagre',
    persist = true,
    storageKey = 'reactflow-layout-algorithm',
    enableKeyboardShortcuts = true,
  } = config;

  // Load initial layout from localStorage if enabled
  const getInitialLayout = (): LayoutAlgorithmType => {
    if (persist && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored && LAYOUT_OPTIONS.some((opt) => opt.algorithm === stored)) {
          return stored as LayoutAlgorithmType;
        }
      } catch (error) {
        console.warn('Failed to load layout from localStorage:', error);
      }
    }
    return defaultLayout;
  };

  const [selectedLayout, setSelectedLayout] = useState<LayoutAlgorithmType>(getInitialLayout);
  const [isOpen, setIsOpen] = useState(false);

  /**
   * Change the selected layout
   */
  const selectLayout = useCallback(
    (algorithm: LayoutAlgorithmType) => {
      setSelectedLayout(algorithm);

      // Persist to localStorage if enabled
      if (persist && typeof window !== 'undefined') {
        try {
          localStorage.setItem(storageKey, algorithm);
        } catch (error) {
          console.warn('Failed to save layout to localStorage:', error);
        }
      }
    },
    [persist, storageKey]
  );

  /**
   * Toggle layout selector open/closed
   */
  const toggleSelector = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  /**
   * Open layout selector
   */
  const openSelector = useCallback(() => {
    setIsOpen(true);
  }, []);

  /**
   * Close layout selector
   */
  const closeSelector = useCallback(() => {
    setIsOpen(false);
  }, []);

  /**
   * Get the next layout in the list (for cycling)
   */
  const nextLayout = useCallback(() => {
    const currentIndex = LAYOUT_OPTIONS.findIndex((opt) => opt.algorithm === selectedLayout);
    const nextIndex = (currentIndex + 1) % LAYOUT_OPTIONS.length;
    selectLayout(LAYOUT_OPTIONS[nextIndex].algorithm);
  }, [selectedLayout, selectLayout]);

  /**
   * Get the previous layout in the list (for cycling)
   */
  const previousLayout = useCallback(() => {
    const currentIndex = LAYOUT_OPTIONS.findIndex((opt) => opt.algorithm === selectedLayout);
    const prevIndex = (currentIndex - 1 + LAYOUT_OPTIONS.length) % LAYOUT_OPTIONS.length;
    selectLayout(LAYOUT_OPTIONS[prevIndex].algorithm);
  }, [selectedLayout, selectLayout]);

  /**
   * Handle keyboard shortcuts
   */
  useEffect(() => {
    if (!enableKeyboardShortcuts) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // L key - Open layout selector
      if (event.key === 'l' && !event.metaKey && !event.ctrlKey && !event.altKey) {
        // Only if not in an input field
        const target = event.target as HTMLElement;
        if (
          target.tagName !== 'INPUT' &&
          target.tagName !== 'TEXTAREA' &&
          !target.isContentEditable
        ) {
          event.preventDefault();
          toggleSelector();
        }
      }

      // Cmd/Ctrl + L - Apply last-used layout (re-layout)
      if (event.key === 'l' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        // Trigger a re-layout by setting the same layout
        // This will be handled by the consumer
        selectLayout(selectedLayout);
      }

      // Number keys 1-7 - Quick select layout (when selector is open)
      if (isOpen && event.key >= '1' && event.key <= '7') {
        const index = parseInt(event.key, 10) - 1;
        if (index < LAYOUT_OPTIONS.length) {
          event.preventDefault();
          selectLayout(LAYOUT_OPTIONS[index].algorithm);
          closeSelector();
        }
      }

      // Escape - Close selector
      if (event.key === 'Escape' && isOpen) {
        event.preventDefault();
        closeSelector();
      }

      // Arrow keys for cycling when selector is open
      if (isOpen) {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          nextLayout();
        } else if (event.key === 'ArrowUp') {
          event.preventDefault();
          previousLayout();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    enableKeyboardShortcuts,
    isOpen,
    selectedLayout,
    toggleSelector,
    closeSelector,
    selectLayout,
    nextLayout,
    previousLayout,
  ]);

  /**
   * Get metadata for current layout
   */
  const currentMetadata = getLayoutMetadata(selectedLayout);

  return {
    // State
    selectedLayout,
    currentMetadata,
    isOpen,
    availableLayouts: LAYOUT_OPTIONS,

    // Actions
    selectLayout,
    toggleSelector,
    openSelector,
    closeSelector,
    nextLayout,
    previousLayout,
  };
}
