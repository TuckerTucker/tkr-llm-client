/**
 * Left Panel Catalog Component
 *
 * Template catalog panel for Explorer mode.
 * Displays searchable, filterable template catalog with grid/list view.
 *
 * @module components/panels/content/LeftPanelCatalog
 * @version 1.0.0
 * @author Panel Content Engineer (Agent 5)
 */

import React, { useState, useMemo, useCallback } from 'react';
import type { CatalogItem, CatalogFilters } from '../types';
import type { AgentTemplate } from '../../../templates/types';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Props for LeftPanelCatalog.
 */
export interface LeftPanelCatalogProps {
  /** Available templates */
  templates: AgentTemplate[];

  /** Template paths (keyed by name) */
  templatePaths: Map<string, string>;

  /** Callback when template is selected */
  onSelectTemplate: (template: AgentTemplate) => void;

  /** Callback when template is added to canvas */
  onAddToCanvas: (template: AgentTemplate) => void;

  /** Available tags for filtering */
  availableTags: string[];

  /** Available tools for filtering */
  availableTools: string[];

  /** Initial view mode */
  initialViewMode?: 'grid' | 'list';
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Left panel catalog component.
 *
 * Displays template catalog with search, filters, and add-to-canvas functionality.
 *
 * @example
 * ```tsx
 * <LeftPanelCatalog
 *   templates={templates}
 *   templatePaths={paths}
 *   onSelectTemplate={handleSelect}
 *   onAddToCanvas={handleAdd}
 *   availableTags={['code', 'analysis']}
 *   availableTools={['Read', 'Write']}
 * />
 * ```
 */
export function LeftPanelCatalog({
  templates,
  templatePaths,
  onSelectTemplate,
  onAddToCanvas,
  availableTags,
  availableTools,
  initialViewMode = 'grid',
}: LeftPanelCatalogProps): JSX.Element {
  // State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(initialViewMode);
  const [filters, setFilters] = useState<CatalogFilters>({
    search: '',
    tags: [],
    tools: [],
  });

  // Convert templates to catalog items
  const catalogItems = useMemo<CatalogItem[]>(() => {
    return templates.map((template) => ({
      name: template.metadata.name,
      description: template.metadata.description,
      tags: template.metadata.tags || [],
      version: template.metadata.version,
      author: template.metadata.author,
      template,
      path: templatePaths.get(template.metadata.name) || '',
    }));
  }, [templates, templatePaths]);

  // Filter catalog items
  const filteredItems = useMemo(() => {
    return catalogItems.filter((item) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          item.name.toLowerCase().includes(searchLower) ||
          item.description.toLowerCase().includes(searchLower) ||
          item.tags.some((tag) => tag.toLowerCase().includes(searchLower));

        if (!matchesSearch) return false;
      }

      // Tag filter
      if (filters.tags.length > 0) {
        const hasTag = filters.tags.some((tag) => item.tags.includes(tag));
        if (!hasTag) return false;
      }

      // Tool filter
      if (filters.tools.length > 0) {
        const templateTools = item.template.agent.tools || [];
        const hasTool = filters.tools.some((tool) => templateTools.includes(tool));
        if (!hasTool) return false;
      }

      return true;
    });
  }, [catalogItems, filters]);

  // Handlers
  const handleSearchChange = useCallback((search: string) => {
    setFilters((prev) => ({ ...prev, search }));
  }, []);

  const handleTagToggle = useCallback((tag: string) => {
    setFilters((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  }, []);

  const handleToolToggle = useCallback((tool: string) => {
    setFilters((prev) => ({
      ...prev,
      tools: prev.tools.includes(tool)
        ? prev.tools.filter((t) => t !== tool)
        : [...prev.tools, tool],
    }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({ search: '', tags: [], tools: [] });
  }, []);

  // Render
  return (
    <div className="left-panel-catalog">
      {/* Search Bar */}
      <div className="catalog-search">
        <input
          type="text"
          placeholder="Search templates..."
          value={filters.search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Filters */}
      <div className="catalog-filters">
        {/* Tag Filters */}
        <div className="filter-group">
          <h4>Tags</h4>
          <div className="filter-chips">
            {availableTags.map((tag) => (
              <button
                key={tag}
                className={`filter-chip ${filters.tags.includes(tag) ? 'active' : ''}`}
                onClick={() => handleTagToggle(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Tool Filters */}
        <div className="filter-group">
          <h4>Tools</h4>
          <div className="filter-chips">
            {availableTools.map((tool) => (
              <button
                key={tool}
                className={`filter-chip ${filters.tools.includes(tool) ? 'active' : ''}`}
                onClick={() => handleToolToggle(tool)}
              >
                {tool}
              </button>
            ))}
          </div>
        </div>

        {/* Clear Filters */}
        {(filters.search || filters.tags.length > 0 || filters.tools.length > 0) && (
          <button className="clear-filters-btn" onClick={handleClearFilters}>
            Clear Filters
          </button>
        )}
      </div>

      {/* View Mode Toggle */}
      <div className="view-mode-toggle">
        <button
          className={viewMode === 'grid' ? 'active' : ''}
          onClick={() => setViewMode('grid')}
        >
          Grid
        </button>
        <button
          className={viewMode === 'list' ? 'active' : ''}
          onClick={() => setViewMode('list')}
        >
          List
        </button>
      </div>

      {/* Template Grid/List */}
      <div className={`catalog-items ${viewMode}`}>
        {filteredItems.length === 0 ? (
          <div className="no-results">
            <p>No templates found</p>
            <button onClick={handleClearFilters}>Clear Filters</button>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.name}
              className="catalog-item"
              onClick={() => onSelectTemplate(item.template)}
            >
              <div className="item-header">
                <h3>{item.name}</h3>
                <span className="item-version">v{item.version}</span>
              </div>
              <p className="item-description">{item.description}</p>
              {item.author && <p className="item-author">by {item.author}</p>}
              <div className="item-tags">
                {item.tags.map((tag) => (
                  <span key={tag} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
              <button
                className="add-to-canvas-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToCanvas(item.template);
                }}
              >
                Add to Canvas
              </button>
            </div>
          ))
        )}
      </div>

      {/* Results Count */}
      <div className="results-count">
        Showing {filteredItems.length} of {catalogItems.length} templates
      </div>
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * @public
 * @exports LeftPanelCatalog - Left panel catalog component
 * @exports LeftPanelCatalogProps - Props for LeftPanelCatalog
 */
