/**
 * Left Panel Library Component
 *
 * Component library panel for Composition mode.
 * Displays fragments, configs, and bundles categorized by type.
 *
 * @module components/panels/content/LeftPanelLibrary
 * @version 1.0.0
 * @author Panel Content Engineer (Agent 5)
 */

import React, { useState, useMemo, useCallback } from 'react';
import type { LibraryItem, LibraryBundle } from '../types';
import type { PromptFragment, ToolConfig } from '../../../templates/types';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Props for LeftPanelLibrary.
 */
export interface LeftPanelLibraryProps {
  /** Available fragments */
  fragments: PromptFragment[];

  /** Available tool configs */
  configs: ToolConfig[];

  /** Available bundles */
  bundles: LibraryBundle[];

  /** Callback when item is selected */
  onSelectItem: (item: LibraryItem) => void;

  /** Callback when item is dragged to canvas */
  onDragStart: (item: LibraryItem, event: React.DragEvent) => void;

  /** Filter by search query */
  searchQuery?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Left panel library component.
 *
 * Displays component library with categorized fragments, configs, and bundles.
 *
 * @example
 * ```tsx
 * <LeftPanelLibrary
 *   fragments={fragments}
 *   configs={configs}
 *   bundles={bundles}
 *   onSelectItem={handleSelect}
 *   onDragStart={handleDrag}
 * />
 * ```
 */
export function LeftPanelLibrary({
  fragments,
  configs,
  bundles,
  onSelectItem,
  onDragStart,
  searchQuery = '',
}: LeftPanelLibraryProps): JSX.Element {
  // State
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['fragments', 'configs', 'bundles'])
  );
  const [search, setSearch] = useState(searchQuery);

  // Convert to library items
  const fragmentItems = useMemo<LibraryItem[]>(() => {
    return fragments.map((fragment) => ({
      type: 'fragment' as const,
      data: fragment,
      name: fragment.fragment.name,
    }));
  }, [fragments]);

  const configItems = useMemo<LibraryItem[]>(() => {
    return configs.map((config) => ({
      type: 'config' as const,
      data: config,
      name: config.tool.name,
    }));
  }, [configs]);

  const bundleItems = useMemo<LibraryItem[]>(() => {
    return bundles.map((bundle) => ({
      type: 'bundle' as const,
      data: bundle,
      name: bundle.name,
    }));
  }, [bundles]);

  // Filter items by search
  const filteredFragments = useMemo(() => {
    if (!search) return fragmentItems;
    const searchLower = search.toLowerCase();
    return fragmentItems.filter((item) =>
      item.name.toLowerCase().includes(searchLower)
    );
  }, [fragmentItems, search]);

  const filteredConfigs = useMemo(() => {
    if (!search) return configItems;
    const searchLower = search.toLowerCase();
    return configItems.filter((item) =>
      item.name.toLowerCase().includes(searchLower)
    );
  }, [configItems, search]);

  const filteredBundles = useMemo(() => {
    if (!search) return bundleItems;
    const searchLower = search.toLowerCase();
    return bundleItems.filter((item) =>
      item.name.toLowerCase().includes(searchLower)
    );
  }, [bundleItems, search]);

  // Handlers
  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  const handleDragStart = useCallback(
    (item: LibraryItem, event: React.DragEvent) => {
      onDragStart(item, event);
    },
    [onDragStart]
  );

  // Render category
  const renderCategory = (
    title: string,
    categoryKey: string,
    items: LibraryItem[],
    icon: string
  ) => {
    const isExpanded = expandedCategories.has(categoryKey);

    return (
      <div className="library-category">
        <div className="category-header" onClick={() => toggleCategory(categoryKey)}>
          <span className="category-icon">{isExpanded ? '▼' : '▶'}</span>
          <h3>{title}</h3>
          <span className="category-count">({items.length})</span>
        </div>

        {isExpanded && (
          <div className="category-items">
            {items.length === 0 ? (
              <p className="no-items">No {title.toLowerCase()} available</p>
            ) : (
              items.map((item) => (
                <div
                  key={item.name}
                  className={`library-item ${item.type}`}
                  draggable
                  onDragStart={(e) => handleDragStart(item, e)}
                  onClick={() => onSelectItem(item)}
                >
                  <span className="item-icon">{icon}</span>
                  <span className="item-name">{item.name}</span>
                  <span className="item-type">{item.type}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  };

  // Render
  return (
    <div className="left-panel-library">
      {/* Search */}
      <div className="library-search">
        <input
          type="text"
          placeholder="Search library..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Categories */}
      <div className="library-categories">
        {renderCategory('Fragments', 'fragments', filteredFragments, '📝')}
        {renderCategory('Tool Configs', 'configs', filteredConfigs, '⚙️')}
        {renderCategory('Bundles', 'bundles', filteredBundles, '📦')}
      </div>

      {/* Instructions */}
      <div className="library-instructions">
        <p>Drag components to canvas to add them to your template</p>
      </div>

      {/* Total Count */}
      <div className="library-count">
        Total: {filteredFragments.length + filteredConfigs.length + filteredBundles.length}{' '}
        components
      </div>
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * @public
 * @exports LeftPanelLibrary - Left panel library component
 * @exports LeftPanelLibraryProps - Props for LeftPanelLibrary
 */
