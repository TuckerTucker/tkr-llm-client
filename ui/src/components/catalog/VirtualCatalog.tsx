/**
 * Virtual Catalog Component
 *
 * Virtualized template catalog using react-window for performance with large lists.
 * Renders only visible items to minimize DOM nodes and improve performance.
 *
 * @module components/catalog/VirtualCatalog
 * @version 1.0.0
 * @author Performance Optimization Engineer (Agent 2)
 */

import React, { useCallback, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import type { AgentTemplate } from '@backend/templates/types';

/**
 * Virtual catalog props
 */
export interface VirtualCatalogProps {
  /** Templates to display */
  templates: AgentTemplate[];

  /** Currently selected template ID */
  selectedId?: string;

  /** Selection handler */
  onSelect: (template: AgentTemplate) => void;

  /** Height of the catalog container (default: 600px) */
  height?: number;

  /** Height of each item row (default: 100px) */
  itemHeight?: number;

  /** Width of the catalog (default: 100%) */
  width?: number | string;

  /** Whether to show template preview */
  showPreview?: boolean;

  /** Custom class name */
  className?: string;
}

/**
 * Row renderer props (internal)
 */
interface RowProps {
  index: number;
  style: React.CSSProperties;
  data: {
    templates: AgentTemplate[];
    selectedId?: string;
    onSelect: (template: AgentTemplate) => void;
    showPreview: boolean;
  };
}

/**
 * Individual catalog item component
 */
const CatalogItem: React.FC<{
  template: AgentTemplate;
  isSelected: boolean;
  onSelect: (template: AgentTemplate) => void;
  showPreview: boolean;
}> = ({ template, isSelected, onSelect, showPreview }) => {
  const handleClick = useCallback(() => {
    onSelect(template);
  }, [template, onSelect]);

  return (
    <div
      onClick={handleClick}
      style={{
        padding: '12px 16px',
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: isSelected ? '#eff6ff' : 'white',
        cursor: 'pointer',
        transition: 'background-color 150ms',
        height: '100%',
        boxSizing: 'border-box',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = '#f9fafb';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = 'white';
        }
      }}
    >
      <div
        style={{
          fontSize: '14px',
          fontWeight: isSelected ? 600 : 500,
          color: isSelected ? '#1d4ed8' : '#111827',
          marginBottom: '4px',
        }}
      >
        {template.metadata.name}
      </div>
      <div
        style={{
          fontSize: '12px',
          color: '#6b7280',
          marginBottom: '6px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}
      >
        {template.metadata.description}
      </div>
      {showPreview && template.metadata.tags && (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {template.metadata.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: '10px',
                padding: '2px 6px',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                borderRadius: '3px',
              }}
            >
              {tag}
            </span>
          ))}
          {template.metadata.tags.length > 3 && (
            <span
              style={{
                fontSize: '10px',
                padding: '2px 6px',
                color: '#6b7280',
              }}
            >
              +{template.metadata.tags.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Row renderer for react-window
 */
const Row: React.FC<RowProps> = ({ index, style, data }) => {
  const { templates, selectedId, onSelect, showPreview } = data;
  const template = templates[index];
  const isSelected = selectedId === template.metadata.name;

  return (
    <div style={style}>
      <CatalogItem
        template={template}
        isSelected={isSelected}
        onSelect={onSelect}
        showPreview={showPreview}
      />
    </div>
  );
};

/**
 * Virtual Catalog Component
 *
 * High-performance template catalog using windowing/virtualization.
 * Only renders visible items, enabling smooth scrolling with 1000+ templates.
 *
 * Benefits:
 * - Constant render performance regardless of list size
 * - Minimal DOM nodes (only visible items)
 * - Smooth 60fps scrolling
 * - Low memory footprint
 *
 * @param props - Component props
 * @returns Virtualized catalog component
 *
 * @example
 * ```typescript
 * <VirtualCatalog
 *   templates={allTemplates}
 *   selectedId={selectedTemplate?.metadata.name}
 *   onSelect={handleSelect}
 *   height={600}
 *   itemHeight={100}
 * />
 * ```
 */
export const VirtualCatalog: React.FC<VirtualCatalogProps> = ({
  templates,
  selectedId,
  onSelect,
  height = 600,
  itemHeight = 100,
  width = '100%',
  showPreview = true,
  className = '',
}) => {
  // Memoize item data to prevent unnecessary re-renders
  const itemData = useMemo(
    () => ({
      templates,
      selectedId,
      onSelect,
      showPreview,
    }),
    [templates, selectedId, onSelect, showPreview]
  );

  // Calculate scroll position for selected item
  const initialScrollOffset = useMemo(() => {
    if (!selectedId) return 0;

    const selectedIndex = templates.findIndex(
      (t) => t.metadata.name === selectedId
    );

    if (selectedIndex === -1) return 0;

    // Center the selected item
    return Math.max(0, selectedIndex * itemHeight - height / 2);
  }, [selectedId, templates, itemHeight, height]);

  return (
    <div className={className} style={{ height, width }}>
      <List
        height={height}
        itemCount={templates.length}
        itemSize={itemHeight}
        width={width}
        itemData={itemData}
        initialScrollOffset={initialScrollOffset}
        overscanCount={5} // Render 5 extra items above/below viewport
      >
        {Row}
      </List>
    </div>
  );
};

/**
 * Default export
 */
export default VirtualCatalog;
