/**
 * Template Catalog Component
 *
 * Standalone catalog component for browsing and selecting templates.
 *
 * @module components/catalog/TemplateCatalog
 * @version 1.0.0
 * @author Catalog Engineer (Agent 3) - Wave 3
 */

import React, { useMemo, useState } from 'react';
import type { AgentTemplate } from '../../templates/types';

/**
 * Template catalog props
 */
export interface TemplateCatalogProps {
  /** Available templates */
  templates: AgentTemplate[];

  /** Selected template ID */
  selectedId?: string;

  /** Template selection callback */
  onSelect?: (template: AgentTemplate) => void;

  /** Template action callback (e.g., edit, delete) */
  onAction?: (action: string, template: AgentTemplate) => void;

  /** Search query */
  searchQuery?: string;

  /** Search callback */
  onSearch?: (query: string) => void;

  /** Category filter */
  categoryFilter?: string;

  /** Category filter callback */
  onCategoryFilter?: (category: string | null) => void;

  /** Show template preview */
  showPreview?: boolean;

  /** Grid or list view */
  viewMode?: 'grid' | 'list';
}

/**
 * Template Catalog Component
 *
 * Displays templates in a browsable catalog with search and filtering.
 */
export const TemplateCatalog: React.FC<TemplateCatalogProps> = ({
  templates,
  selectedId,
  onSelect,
  onAction,
  searchQuery = '',
  onSearch,
  categoryFilter,
  onCategoryFilter,
  showPreview = false,
  viewMode = 'grid',
}) => {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  // Extract categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    templates.forEach((template) => {
      if (template.metadata.tags) {
        template.metadata.tags.forEach((tag) => cats.add(tag));
      }
    });
    return Array.from(cats).sort();
  }, [templates]);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      // Search filter
      if (localSearchQuery) {
        const query = localSearchQuery.toLowerCase();
        const matchesName = template.metadata.name.toLowerCase().includes(query);
        const matchesDesc = template.metadata.description.toLowerCase().includes(query);
        const matchesTags = template.metadata.tags?.some((tag) => tag.toLowerCase().includes(query));

        if (!matchesName && !matchesDesc && !matchesTags) {
          return false;
        }
      }

      // Category filter
      if (categoryFilter) {
        if (!template.metadata.tags?.includes(categoryFilter)) {
          return false;
        }
      }

      return true;
    });
  }, [templates, localSearchQuery, categoryFilter]);

  const handleSearch = (query: string) => {
    setLocalSearchQuery(query);
    onSearch?.(query);
  };

  return (
    <div className="template-catalog" style={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 600 }}>Template Catalog</h2>
        <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
          {filteredTemplates.length} of {templates.length} templates
        </p>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search templates..."
        value={localSearchQuery}
        onChange={(e) => handleSearch(e.target.value)}
        style={{
          padding: '8px 12px',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          fontSize: '14px',
          marginBottom: '12px',
        }}
      />

      {/* Categories */}
      {categories.length > 0 && (
        <div style={{ marginBottom: '16px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <button
            onClick={() => onCategoryFilter?.(null)}
            style={{
              padding: '4px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '16px',
              backgroundColor: !categoryFilter ? '#3b82f6' : 'white',
              color: !categoryFilter ? 'white' : '#374151',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => onCategoryFilter?.(category)}
              style={{
                padding: '4px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '16px',
                backgroundColor: categoryFilter === category ? '#3b82f6' : 'white',
                color: categoryFilter === category ? 'white' : '#374151',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {/* Template list */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: viewMode === 'grid' ? 'grid' : 'flex',
          flexDirection: viewMode === 'list' ? 'column' : undefined,
          gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(250px, 1fr))' : undefined,
          gap: '12px',
        }}
      >
        {filteredTemplates.map((template) => {
          const isSelected = template.metadata.name === selectedId;

          return (
            <div
              key={template.metadata.name}
              onClick={() => onSelect?.(template)}
              style={{
                border: `2px solid ${isSelected ? '#3b82f6' : '#e5e7eb'}`,
                borderRadius: '8px',
                padding: '12px',
                backgroundColor: isSelected ? '#eff6ff' : 'white',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = '#9ca3af';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                }
              }}
            >
              <div style={{ marginBottom: '8px' }}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 600 }}>
                  {template.metadata.name}
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#6b7280', lineHeight: 1.4 }}>
                  {template.metadata.description}
                </p>
              </div>

              {template.metadata.tags && template.metadata.tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                  {template.metadata.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        padding: '2px 8px',
                        backgroundColor: '#f3f4f6',
                        borderRadius: '12px',
                        fontSize: '11px',
                        color: '#4b5563',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {showPreview && isSelected && (
                <div
                  style={{
                    marginTop: '12px',
                    padding: '8px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    maxHeight: '100px',
                    overflowY: 'auto',
                  }}
                >
                  {template.agent.prompt.substring(0, 150)}...
                </div>
              )}

              {onAction && (
                <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAction('view', template);
                    }}
                    style={{
                      padding: '4px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      backgroundColor: 'white',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    View
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAction('edit', template);
                    }}
                    style={{
                      padding: '4px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      backgroundColor: 'white',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredTemplates.length === 0 && (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            color: '#9ca3af',
          }}
        >
          <p style={{ fontSize: '16px', marginBottom: '8px' }}>No templates found</p>
          <p style={{ fontSize: '14px' }}>Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
};

export default TemplateCatalog;
